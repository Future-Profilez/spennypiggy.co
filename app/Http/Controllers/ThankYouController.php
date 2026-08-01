<?php

namespace App\Http\Controllers;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\TipGoal;
use App\Models\User;
use App\Models\WishItem;
use App\Services\MembershipUpsellService;
use App\Services\RewardService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * The thank-you page.
 *
 * It used to be a route closure that read the whole purchase — including the
 * reward content itself — out of the query string. That made the deliverable
 * URL-length-limited, editable by hand, and different in every module.
 *
 * The item is now resolved from the PAYMENT ROW rather than from a query
 * parameter. Each redirect handler passes a different `item_id` (some the uuid,
 * some the numeric id, Piggy Pot none at all), so trusting it meant the reward
 * silently failed to render on most flows — and a guessable id pointing at the
 * wrong table is worse than no reward at all. The payment row already knows
 * exactly what was bought.
 */
class ThankYouController extends Controller
{
    /**
     * Payment tables the redirect handlers may name in `source`. An allow-list,
     * so a tampered `source` can never reach another table.
     *
     *   buyer  — column holding the purchasing user
     *   status — column holding the payment state
     *   model  — the item model this payment bought
     *   fk     — column on the payment row pointing at that item
     *   parent — [table, foreign key] when buyer/status live on a parent row
     */
    private const SOURCES = [
        'shop_payments' => ['buyer' => 'user_id', 'status' => 'payment_status', 'model' => Shop::class, 'fk' => 'shop_id'],
        'task_purchases' => ['buyer' => 'supporter_id', 'status' => 'status', 'model' => Task::class, 'fk' => 'task_id'],
        'piggy_pot_contributions' => ['buyer' => 'user_id', 'status' => 'status', 'model' => PiggyPot::class, 'fk' => 'piggy_pot_id'],
        'tip_goals_payments' => ['buyer' => 'user_id', 'status' => 'status', 'model' => TipGoal::class, 'fk' => 'tip_goal_id'],
        'bill_payments' => ['buyer' => 'user_id', 'status' => 'status', 'model' => Bills::class, 'fk' => 'bills_id'],
        'membership_payments' => ['buyer' => 'user_id', 'status' => 'status', 'model' => Membership::class, 'fk' => 'membership_id'],
        'stripe_payment_details' => ['buyer' => 'user_id', 'status' => 'payment_status', 'model' => null, 'fk' => null],
        // A cart line item: the buyer and the payment state live on its parent.
        'stripe_payment_items' => [
            'buyer' => 'user_id',
            'status' => 'payment_status',
            'model' => WishItem::class,
            'fk' => 'wish_item_id',
            'parent' => ['stripe_payment_details', 'stripe_payment_detail_id'],
        ],
    ];

    /**
     * Last-resort lookup when there is no usable payment row. Tips are
     * deliberately absent: their `item_id` is a payment id, so resolving by it
     * would surface an unrelated creator's goal.
     */
    private const ITEMS = [
        'wish' => WishItem::class,
        'wish_subscription' => WishItem::class,
        'shop' => Shop::class,
        'task' => Task::class,
        'piggy_pot' => PiggyPot::class,
        'bill' => Bills::class,
        'membership' => Membership::class,
        'monthly_subscription' => Membership::class,
    ];

    /** Money has cleared — the content can be handed over. */
    private const PAID = ['paid', 'succeeded', 'completed', 'completed_accepted', 'delivered', 'paid_out'];

    /** Bank debits (SEPA/ACH) settle a day or two later. */
    private const PENDING = ['processing', 'pending', 'unpaid'];

    public function show(Request $request, string $username)
    {
        $owner = User::where('username', $username)->first();
        $type = (string) $request->query('type');

        [$item, $entitled, $settled] = $this->resolveFromPayment($request);

        // No usable payment row (an old link, or a handler that passes none) —
        // fall back to the item named in the URL, but show nothing paid.
        if (! $item) {
            $item = $this->resolveFromQuery($type, $request->query('item_id'));
        }

        // The reward headline and description describe the purchase and are
        // safe to show either way; the content itself is withheld until the
        // payment row proves both that this viewer bought it and that the
        // money has actually cleared.
        $reward = $item ? RewardService::for($item) : null;
        $locked = $reward && ! ($entitled && $settled);

        if ($reward && $locked) {
            $reward['media'] = null;
            $reward['text'] = null;
            $reward['link'] = null;
        }

        return Inertia::render('Profile/Thankyou', [
            'owner' => $owner,
            'type' => $type,
            'item_name' => $request->query('item_name'),
            'amount' => $request->query('amount'),
            'currency' => $request->query('currency'),
            'item_id' => $request->query('item_id'),
            'item_slug' => $request->query('item_slug'),
            'is_instant' => $request->query('is_instant'),
            'ask_question' => $request->query('ask_question'),
            'payment_id' => $request->query('payment_id'),
            'source' => $request->query('source'),
            'source_id' => $request->query('source_id'),
            'reward' => $reward,
            'reward_locked' => $locked,

            // The buyer has just paid this creator, which is the likeliest moment they will
            // pay them again — and this page offered nothing at all until now. A one-off sale
            // earns one commission; a membership earns one every month.
            //
            // ⚠️ Never upsell a membership to someone who just bought a membership. The
            // service also refuses when the creator has none published, and when the viewer
            // is already subscribed. Guests are offered it too: it is a public listing, and
            // the only check we cannot run for them is one that would exclude, never one
            // that would expose.
            'membership_offer' => $item instanceof Membership
                ? null
                : app(MembershipUpsellService::class)->for($owner, $request->user()),
            // Distinguishes "your bank is still confirming" from "we could not
            // confirm this is your purchase" — different copy, different fix.
            'awaiting_settlement' => $reward ? ($entitled && ! $settled) : false,
        ]);
    }

    /**
     * @return array{0: ?Model, 1: bool, 2: bool} [item, viewer bought it, money cleared]
     */
    private function resolveFromPayment(Request $request): array
    {
        $source = (string) $request->query('source');
        $sourceId = $request->query('source_id');
        $config = self::SOURCES[$source] ?? null;

        if (! $config || ! $sourceId) {
            return [null, false, false];
        }

        $row = DB::table($source)->where('id', $sourceId)->first();

        if (! $row) {
            return [null, false, false];
        }

        // A line item carries the item; its parent carries who paid and whether
        // the money arrived.
        $stateRow = $row;
        if (isset($config['parent'])) {
            [$parentTable, $parentKey] = $config['parent'];
            $stateRow = DB::table($parentTable)->where('id', $row->{$parentKey} ?? null)->first() ?: $row;
        }

        $status = strtolower((string) ($stateRow->{$config['status']} ?? ''));
        $settled = in_array($status, self::PAID, true);
        $recognised = $settled || in_array($status, self::PENDING, true);

        // A signed-in buyer is matched against the row. A guest cannot be
        // matched at all, so they are told to check their email rather than
        // being handed content on the strength of a guessable row id.
        $buyerId = $stateRow->{$config['buyer']} ?? null;
        $entitled = Auth::check() && $buyerId && (int) $buyerId === (int) Auth::id();

        $item = null;
        if (! empty($config['model']) && ! empty($config['fk'])) {
            $itemId = $row->{$config['fk']} ?? null;
            $item = $itemId ? $config['model']::find($itemId) : null;
        }

        return [$item, $entitled, $recognised && $settled];
    }

    /** Item named in the URL — uuid or numeric id, depending on the handler. */
    private function resolveFromQuery(string $type, $identifier): ?Model
    {
        $model = self::ITEMS[$type] ?? null;

        if (! $model || ! $identifier) {
            return null;
        }

        return $model::where('uuid', $identifier)
            ->when(ctype_digit((string) $identifier), fn ($q) => $q->orWhere('id', (int) $identifier))
            ->first();
    }

    /**
     * "Don't offer me this creator's membership again."
     *
     * ⚠️ Signed-in only, and the identity comes from the session — never from the request.
     * Accepting an email from the body would let anyone silence the offer for somebody else
     * by guessing their address. A guest sees the thank-you page once and then never again,
     * so they lose nothing by not having this.
     */
    public function dismissMembershipOffer(Request $request)
    {
        $viewer = $request->user();

        if (! $viewer) {
            return response()->json(['status' => 'ignored'], 200);
        }

        $creator = User::where('username', $request->input('creator_username'))->first();

        if ($creator) {
            app(MembershipUpsellService::class)->dismiss($creator, $viewer);
        }

        return response()->json(['status' => 'ok']);
    }
}

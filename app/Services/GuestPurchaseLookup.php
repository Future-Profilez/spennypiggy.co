<?php

namespace App\Services;

use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\StripePaymentItems;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * "Where did my purchase go?" — for someone who never made an account.
 *
 * Guest checkout is allowed on Piggy Pot, Wishes and the Piggy Bank, so a real supporter
 * can pay a creator and hold nothing but a receipt email. Lose that email — deleted, or
 * filed in spam — and there was **no way back to the content at all**: they cannot sign
 * in, because there is nothing to sign in to. Every one of those became a support ticket.
 *
 * This finds those purchases by email and re-renders them, gated exactly as the thank-you
 * page is: the reward headline always, the paid content only once the money has cleared.
 */
class GuestPurchaseLookup
{
    /**
     * Where a GUEST purchase can legitimately live.
     *
     * ⚠️ Shop, Paid Tasks, Bills and Memberships are deliberately ABSENT. All four force
     * login at checkout (`!Auth::check()` → redirect), so a row there carrying a guest
     * email is an anomaly — and serving its content on the strength of an email would be
     * a way around the account gate those four checkouts exist to enforce.
     *
     *   email  — column holding the guest's address
     *   status — column holding the payment state
     *   model  — the item this payment bought
     *   fk     — column pointing at that item
     *   parent — [table, foreign key] when email and status live on a parent row
     */
    private const SOURCES = [
        'piggy_pot' => [
            'model_class' => PiggyPotContribution::class,
            'table' => 'piggy_pot_contributions',
            'email' => 'guest_email',
            'status' => 'status',
            'item' => PiggyPot::class,
            'fk' => 'piggy_pot_id',
            'amount' => 'total_paid',
            'label' => 'Piggy Pot',
        ],
        'tip' => [
            'model_class' => TipGoalsPayment::class,
            'table' => 'tip_goals_payments',
            'email' => 'guest_email',
            'status' => 'status',
            'item' => TipGoal::class,
            'fk' => 'tip_goal_id',
            'amount' => 'total_paid',
            'label' => 'Piggy Bank',
        ],
        'wish_subscription' => [
            'model_class' => WishItemSubscription::class,
            'table' => 'wish_item_subscriptions',
            'email' => 'guest_email',
            'status' => 'status',
            'item' => WishItem::class,
            'fk' => 'wish_item_id',
            'amount' => 'total_paid',
            'label' => 'Wish',
        ],
        'wish' => [
            'model_class' => StripePaymentItems::class,
            'table' => 'stripe_payment_items',
            'email' => 'guest_email',
            'status' => 'payment_status',
            'item' => WishItem::class,
            'fk' => 'wish_item_id',
            'amount' => 'total_paid',
            'label' => 'Wish',
            // A cart line item: the guest's address and the payment state live on the
            // parent payment row, not on the line.
            'parent' => ['stripe_payment_details', 'stripe_payment_detail_id'],
        ],
    ];

    /**
     * Money has cleared — the content can be handed over.
     *
     * Same list as `ThankYouController::PAID`. These two are the only surfaces that hand
     * paid content to someone who is not signed in, and they must agree.
     */
    public const PAID = ['paid', 'succeeded', 'completed', 'completed_accepted', 'delivered', 'paid_out'];

    /** A bank debit (SEPA/ACH) the supporter HAS authorised, still clearing. */
    public const PENDING = ['processing', 'pending', 'unpaid'];

    /** Newest first, capped — a lookup page is not a full purchase history. */
    public const LIMIT = 50;

    /**
     * Does this address have anything at all?
     *
     * ⚠️ The CALLER must never let the answer reach the browser. It decides whether an
     * email is sent, and nothing else — see GuestPurchaseController for why.
     */
    public function hasPurchases(string $email): bool
    {
        return $this->rows($email, 1) !== [];
    }

    /**
     * Every guest purchase for this address, ready to render.
     *
     * @return array<int,array<string,mixed>>
     */
    public function for(string $email): array
    {
        $rows = $this->rows($email, self::LIMIT);

        usort($rows, fn ($a, $b) => ($b['purchased_at'] ?? '') <=> ($a['purchased_at'] ?? ''));

        return array_slice($rows, 0, self::LIMIT);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function rows(string $email, int $limit): array
    {
        $email = strtolower(trim($email));

        if ($email === '') {
            return [];
        }

        $out = [];

        foreach (self::SOURCES as $key => $source) {
            try {
                foreach ($this->rowsFor($key, $source, $email, $limit) as $row) {
                    $out[] = $row;
                }
            } catch (Throwable $e) {
                // One source failing must not answer a supporter with "you have no
                // purchases" — which is the one wrong thing this page can say.
                Log::error('Guest purchase lookup: source failed', ['source' => $key, 'error' => $e->getMessage()]);
            }

            if (count($out) >= $limit) {
                break;
            }
        }

        return $out;
    }

    /**
     * @param  array<string,mixed>  $source
     * @return array<int,array<string,mixed>>
     */
    private function rowsFor(string $key, array $source, string $email, int $limit): array
    {
        $model = $source['model_class'];
        $table = $source['table'];
        $parent = $source['parent'] ?? null;
        $emailTable = $parent ? $parent[0] : $table;

        // ⚠️ `stripe_payment_details.guest_email` is in the model's $fillable and is
        // declared by NO migration, so a database built from migrations alone does not
        // have it. Reading it unguarded is a SQL error that takes the page down.
        if (! Schema::hasColumn($emailTable, $source['email'])) {
            return [];
        }

        $query = $model::query();

        if ($parent) {
            $query->join($parent[0], $parent[0].'.id', '=', $table.'.'.$parent[1])
                ->select($table.'.*', $parent[0].'.'.$source['email'].' as lookup_email', $parent[0].'.'.$source['status'].' as lookup_status');
        } else {
            $query->select($table.'.*', $table.'.'.$source['email'].' as lookup_email', $table.'.'.$source['status'].' as lookup_status');
        }

        // Case-insensitive: an address typed at checkout and an address typed into this
        // form are the same address whatever the capitals.
        $rows = $query
            ->whereRaw('LOWER('.$emailTable.'.'.$source['email'].') = ?', [$email])
            ->orderByDesc($table.'.id')
            ->limit($limit)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        // ⚠️ `withTrashed()`. All six item models soft-delete, and a creator taking a
        // listing down does not un-buy it — the supporter still paid, and the name,
        // creator and reward are all still on the row. Without this a soft-deleted
        // listing renders as a nameless card with the bare type label for a title.
        $itemQuery = $source['item']::query();

        if (in_array(SoftDeletes::class, class_uses_recursive($source['item']), true)) {
            $itemQuery->withTrashed();
        }

        $items = $itemQuery
            ->whereIn('id', $rows->pluck($source['fk'])->filter()->unique()->all())
            ->get()
            ->keyBy('id');

        $out = [];

        foreach ($rows as $row) {
            $item = $items->get($row->{$source['fk']});
            $status = strtolower((string) $row->lookup_status);

            $settled = in_array($status, self::PAID, true);
            $awaiting = ! $settled && in_array($status, self::PENDING, true);

            $out[] = $this->render($key, $source, $row, $item, $settled, $awaiting);
        }

        return $out;
    }

    /**
     * One purchase, as the supporter should see it.
     *
     * @param  array<string,mixed>  $source
     * @return array<string,mixed>
     */
    private function render(string $key, array $source, Model $row, ?Model $item, bool $settled, bool $awaiting): array
    {
        $creator = $item?->user ?? null;
        $reward = $item ? RewardService::for($item) : null;

        // 🚨 The headline and description describe the purchase and are always safe. The
        // CONTENT is withheld until the money has cleared — this page is reachable by
        // anyone holding the link, and handing over a paid file on money that has not
        // settled is the one thing it must never do.
        if ($reward && ! $settled) {
            $reward['media'] = null;
            $reward['text'] = null;
            $reward['link'] = null;
        }

        return [
            'key' => $key.':'.$row->id,
            // ⚠️ The listing this paid for is gone from the database. The purchase is
            // still real and is still shown — hiding money someone spent is the worst
            // answer this page could give — but it has no title, no creator and no
            // reward, so the card must say so rather than render an empty shell.
            'item_missing' => $item === null,
            'type' => $key,
            'type_label' => $source['label'],
            // ⚠️ When the listing is gone there is no name anywhere — `stripe_payment_items`
            // and `wish_item_subscriptions` store none, and neither does `deliverables`.
            // So the card says "Removed listing" rather than printing the bare type label,
            // which reads as the listing having been called "Wish".
            'title' => $this->titleOf($item) ?: ($item === null ? 'Removed listing' : $source['label']),
            'creator' => $creator ? [
                'name' => $creator->name,
                'username' => $creator->username,
                'avatar_url' => $creator->avatar_url ?? null,
            ] : null,
            // ⚠️ `?:`, not `??`. Older rows carry `total_paid = 0` with the real figure in
            // `amount` — a null-coalesce keeps the zero and every one of those purchases
            // renders as £0.00. Same `total_paid ?: amount` convention the Purchase Hub
            // and the CSV export already use.
            'amount' => ($row->{$source['amount']} ?: $row->amount) ?: null,
            'currency' => strtoupper((string) ($row->currency ?: 'GBP')),
            'purchased_at' => optional($row->created_at)->toIso8601String(),
            'settled' => $settled,
            // Distinguishes "your bank is still confirming" from "this did not go
            // through" — different copy, and only one of them is the supporter's problem.
            'awaiting_settlement' => $awaiting,
            'reward' => $reward,
        ];
    }

    private function titleOf(?Model $item): ?string
    {
        if (! $item) {
            return null;
        }

        foreach (['title', 'wishname', 'name'] as $column) {
            $value = trim((string) ($item->{$column} ?? ''));

            if ($value !== '') {
                return $value;
            }
        }

        return null;
    }
}

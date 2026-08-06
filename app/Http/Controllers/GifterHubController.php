<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\SavedItem;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\StripePaymentItems;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\WishItem;
use App\Services\Ledger\LedgerRules;
use App\Services\NotificationDeliveryService;
use App\Services\VipScoreService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Self-service buyer/supporter hub ("My Purchases").
 *
 * Unlike the existing gifter* methods on ProfileController (which resolve the
 * buyer from a {username} URL param), this controller ALWAYS treats the buyer
 * as Auth::user(). Four sections:
 *   1. media_library  — every media-bearing purchase (wish / shop / task / piggy-pot)
 *   2. subscriptions  — active recurring entitlements (membership / bill)
 *   3. unlocked       — one-time content entitlements (lifetime access) + tips
 *   4. spend_summary  — gross spend, converted to the buyer's display currency
 *
 * All amounts are converted server-side. All media UUIDs are emitted as
 * fully-qualified https://ucarecdn.com/<uuid>/ URLs (JS has no builder).
 */
class GifterHubController extends Controller
{
    private const MEDIA_PER_PAGE = 30;

    public function index(Request $request)
    {
        $buyer = Auth::user();
        $display = $buyer->default_currency ?: 'GBP';

        $sources = $this->loadSources($buyer);

        // The media library paginates, so search/filter/sort MUST run server-side over
        // the whole set — a client-side filter over the loaded page silently claims
        // "no matches" for anything on page 2+.
        $media = $this->applyMediaQuery($this->buildMediaLibrary($sources), $request);
        $page = max(1, (int) $request->input('page', 1));
        [$mediaPage, $pagination] = $this->paginate($media, $page, self::MEDIA_PER_PAGE);

        return Inertia::render('gifter/Hub', array_merge([
            'display_currency' => $display,
            'media_library' => $mediaPage,
            'media_pagination' => $pagination,
            'media_types' => $this->mediaTypeCounts($sources),
            'subscriptions' => $this->buildSubscriptions($sources),
            'unlocked' => $this->buildUnlocked($sources),
            'spend_summary' => $this->buildSpendSummary($buyer, $sources, $display),
        ], $this->surfaced($buyer, $sources, $display)));
    }

    /**
     * Full hub payload as JSON (all four sections) for the profile "Purchases" tab.
     */
    public function data(Request $request)
    {
        $buyer = Auth::user();
        $display = $buyer->default_currency ?: 'GBP';
        $sources = $this->loadSources($buyer);

        $media = $this->buildMediaLibrary($sources);
        [$mediaPage, $pagination] = $this->paginate($media, 1, self::MEDIA_PER_PAGE);

        return response()->json(array_merge([
            'status' => true,
            'display_currency' => $display,
            'media_library' => $mediaPage,
            'media_pagination' => $pagination,
            'media_types' => $this->mediaTypeCounts($sources),
            'subscriptions' => $this->buildSubscriptions($sources),
            'unlocked' => $this->buildUnlocked($sources),
            'spend_summary' => $this->buildSpendSummary($buyer, $sources, $display),
        ], $this->surfaced($buyer, $sources, $display)));
    }

    /**
     * Additions that surface existing-but-hidden backends + relationship rollup:
     * supporter VIP status, certificate wallet, delivery tracking, per-creator rollup.
     */
    private function surfaced($buyer, array $sources, string $display): array
    {
        return [
            'supporter_status' => app(VipScoreService::class)->for($buyer),
            'receipts' => $this->buildReceipts($buyer),
            'incoming' => $this->buildIncoming($buyer),
            'creators' => $this->buildCreators($sources, $display, $buyer),
            'saved' => $this->buildSaved($buyer),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Saved items (save-for-later wishlist) */
    /* ----------------------------------------------------------------- */

    private function buildSaved($buyer): array
    {
        $rows = SavedItem::where('user_id', $buyer->id)->latest()->limit(100)->get();
        if ($rows->isEmpty()) {
            return [];
        }

        // Bulk-load the referenced items per type, then resolve title + creator.
        $ids = [];
        foreach ($rows as $r) {
            $ids[$r->product_type][] = $r->item_id;
        }

        $load = fn ($model, $type, $rel) => empty($ids[$type])
            ? collect()
            : $model::whereIn('id', $ids[$type])->with($rel)->get()->keyBy('id');

        $items = [
            'wish' => $load(WishItem::class, 'wish', 'user'),
            'shop' => $load(Shop::class, 'shop', 'user'),
            'membership' => $load(Membership::class, 'membership', 'user'),
            'bill' => $load(Bills::class, 'bill', 'user'),
            'piggypot' => $load(PiggyPot::class, 'piggypot', 'user'),
            'task' => $load(Task::class, 'task', 'creator'),
        ];

        // [title, owner, price, unavailable-reason]. A buy-later list without a price
        // or a sold-out flag can't be acted on — the buyer has to open each item to
        // find out whether buying is still possible.
        $resolve = [
            'wish' => fn ($i) => [$i->wishname, $i->user, $i->price, (int) $i->is_approved === 1 ? null : ((int) $i->is_approved === 2 ? 'Rejected' : 'Under review')],
            'shop' => fn ($i) => [$i->name, $i->user, $i->price, $this->shopUnavailable($i)],
            'membership' => fn ($i) => [$i->level, $i->user, $i->price, $i->approved ? null : 'Under review'],
            'bill' => fn ($i) => [$i->name, $i->user, $i->price, $i->approved ? null : 'Under review'],
            'piggypot' => fn ($i) => [$i->title, $i->user, null, $i->status === 'moderation_hold' ? 'Under review' : null],
            'task' => fn ($i) => [$i->title, $i->creator, $i->price, (int) $i->is_approved === 1 ? null : ((int) $i->is_approved === 2 ? 'Rejected' : 'Under review')],
        ];

        $out = [];
        foreach ($rows as $r) {
            $item = $items[$r->product_type][$r->item_id] ?? null;
            if (! $item || empty($resolve[$r->product_type])) {
                continue; // item deleted since saving
            }
            [$title, $owner, $price, $unavailable] = $resolve[$r->product_type]($item);
            if (! $owner) {
                continue;
            }
            $out[] = [
                'id' => "saved:{$r->id}",
                'product_type' => $r->product_type,
                'item_id' => $r->item_id,
                'title' => $title ?: 'Content',
                'owner' => $this->ownerBlock($owner),
                'price' => $price !== null ? (float) $price : null,
                'currency' => $item->currency ?? ($owner->default_currency ?: 'GBP'),
                'unavailable_reason' => $unavailable,
                'open_link' => $this->openLink($owner, $this->pageFor($r->product_type)),
                'saved_at' => $this->ts($r->created_at),
            ];
        }

        return $out;
    }

    /** slot_limitation IS remaining stock (the server decrements it per sale). */
    private function shopUnavailable(Shop $shop): ?string
    {
        if ($shop->is_suspended) {
            return 'Unavailable';
        }
        if (! $shop->approved || ! $shop->status) {
            return 'Under review';
        }
        if ($shop->slot_limitation !== null && (int) $shop->slot_limitation <= 0) {
            return 'Sold out';
        }

        return null;
    }

    /* ----------------------------------------------------------------- */
    /* Receipts (certificate wallet) */
    /* ----------------------------------------------------------------- */

    private function buildReceipts($buyer): array
    {
        $out = [];

        $delis = Deliverable::where('gifter_id', $buyer->id)
            ->whereNotNull('certificate_url')
            ->with(['creator', 'wishItem', 'bill', 'membership', 'task', 'shop'])
            ->latest()->limit(80)->get();

        foreach ($delis as $d) {
            // Per-transaction reward: what did this purchase actually unlock?
            // Wishes carry reward_body (text/link message) and reward_url (direct link).
            // Shop items carry reward_file_url. Tasks carry deliverable_content.
            // We surface all of them so the frontend can show contextual "What you got".
            [$rewardText, $rewardUrl, $rewardType] = $this->resolveDeliverableReward($d);

            $out[] = [
                'id' => "deliverable:{$d->id}",
                'source_type' => $this->deliverableCat($d->product_type),
                'title' => $this->deliverableTitle($d) ?: 'Purchase',
                'owner' => $this->ownerBlock($d->creator),
                'amount' => (float) ($d->transaction_amount ?: 0),
                'currency' => $d->payment_currency ?: 'GBP',
                'date' => $this->ts($d->created_at),
                'certificate_url' => $d->certificate_url,
                // Reward fields — null when the purchase type has no digital reward
                'reward_text' => $rewardText,
                'reward_url' => $rewardUrl,
                'reward_type' => $rewardType, // 'link' | 'text' | 'file' | null
            ];
        }

        $tips = TipGoalsPayment::where('user_id', $buyer->id)
            ->whereNotNull('certificate_url')
            ->with(['creator', 'tipGoal'])
            ->latest()->limit(80)->get();

        foreach ($tips as $t) {
            if (! $t->creator) {
                continue;
            }
            // Tips unlock the tipGoal's exclusive content (reward_url on the goal)
            $rewardUrl = $t->tipGoal?->reward_url ?: null;
            $rewardText = $t->tipGoal?->reward_body ?: $t->tipGoal?->reward_description ?: null;

            $out[] = [
                'id' => "tip:{$t->id}",
                'source_type' => 'tip',
                'title' => $t->tipGoal?->name ?: 'Exclusive content',
                'owner' => $this->ownerBlock($t->creator),
                'amount' => (float) ($t->total_paid ?: $t->amount ?: 0),
                'currency' => $t->currency ?: 'GBP',
                'date' => $this->ts($t->created_at),
                'certificate_url' => $t->certificate_url,
                'reward_text' => $rewardText,
                'reward_url' => $rewardUrl,
                'reward_type' => $rewardUrl ? 'link' : ($rewardText ? 'text' : null),
            ];
        }

        usort($out, fn ($a, $b) => strcmp((string) $b['date'], (string) $a['date']));

        return $out;
    }

    /**
     * Resolve what a completed deliverable actually unlocked for the buyer.
     *
     * Returns [$rewardText, $rewardUrl, $rewardType].
     * - Wish: reward_body (message/text) or reward_url (external link)
     * - Shop: reward_file_url (digital download)
     * - Task: deliverable_content (file/link uploaded by creator)
     */
    private function resolveDeliverableReward(Deliverable $d): array
    {
        switch ($d->product_type) {
            case 'wish':
                $wish = $d->wishItem;
                if (! $wish) {
                    return [null, null, null];
                }
                $url = $wish->reward_url ?: null;
                $text = $wish->reward_body ?: $wish->reward_description ?: null;
                $type = $url ? 'link' : ($text ? 'text' : null);

                return [$text, $url, $type];

            case 'shop_item':
                $shop = $d->shop;
                $url = $shop?->reward_file_url ?: null;

                return [null, $url, $url ? 'file' : null];

            case 'task':
                $task = $d->task;
                $url = $task?->deliverable_content ?: null;
                // If it looks like a URL/link rather than a file UUID, treat as link
                $isFile = $url && $this->looksLikeFile($url);

                return [null, $url, $url ? ($isFile ? 'file' : 'link') : null];

            default:
                return [null, null, null];
        }
    }

    /* ----------------------------------------------------------------- */
    /* Incoming (in-progress delivery tracking) */
    /* ----------------------------------------------------------------- */

    private function buildIncoming($buyer): array
    {
        // Capped like the other hub sections (receipts cap at 80, media
        // paginates) so a buyer with many outstanding deliverables can't load
        // an unbounded set into every hub view.
        $rows = Deliverable::where('gifter_id', $buyer->id)
            ->whereNotIn('status', ['delivered', 'refunded'])
            ->with(['creator', 'wishItem', 'bill', 'membership', 'task', 'shop'])
            ->latest()->limit(80)->get();

        // Task deliverables carry an ACTION for the buyer (accept the work, releasing
        // escrow). Without the purchase uuid the hub can only link away to the profile,
        // which is not where that action lives — so resolve them in one batched query.
        $taskOrderIds = $rows->where('product_type', 'task')->pluck('order_id')->filter()->all();
        $taskPurchases = $taskOrderIds
            ? TaskPurchase::whereIn('id', $taskOrderIds)->get()->keyBy('id')
            : collect();

        $out = [];
        foreach ($rows as $d) {
            if (! $d->creator) {
                continue;
            }
            $type = $this->deliverableCat($d->product_type);
            $overdue = $d->due_at && Carbon::parse($d->due_at)->isPast() && $d->status !== 'delivered';
            $purchase = $d->product_type === 'task' ? ($taskPurchases[$d->order_id] ?? null) : null;

            $out[] = [
                'id' => "incoming:{$d->id}",
                'source_type' => $type,
                'title' => $this->deliverableTitle($d) ?: 'Purchase',
                'owner' => $this->ownerBlock($d->creator),
                'status' => $d->status,
                'is_physical' => $d->product_type === 'shop_item',
                'is_overdue' => (bool) $overdue,
                'courier' => $d->courier_name,
                'tracking_id' => $d->tracking_id,
                'eta' => $this->ts($d->expected_delivery_date),
                'due_at' => $this->ts($d->due_at),
                'created_at' => $this->ts($d->created_at),
                'waiting_days' => $d->created_at ? Carbon::parse($d->created_at)->diffInDays(now()) : null,
                // Escrow release: only the supporter can accept, and only once the
                // creator has actually delivered proof.
                'task_uuid' => $purchase?->uuid,
                'can_accept' => $purchase && in_array($purchase->status, ['delivered', 'escalated'], true),
                'creator_username' => $d->creator->username,
                'support_source' => $d->product_type,
                'support_source_id' => (string) $d->id,
                'open_link' => $this->openLink($d->creator, $this->pageFor($type)),
            ];
        }

        return $out;
    }

    private function deliverableCat(?string $productType): string
    {
        return [
            'wish' => 'wish', 'bill' => 'bill', 'membership' => 'membership',
            'task' => 'task', 'shop_item' => 'shop',
        ][$productType] ?? 'wish';
    }

    private function deliverableTitle(Deliverable $d): ?string
    {
        switch ($d->product_type) {
            case 'wish':       return $d->wishItem?->wishname;
            case 'bill':       return $d->bill?->name;
            case 'membership': return $d->membership?->level;
            case 'task':       return $d->task?->title;
            case 'shop_item':  return $d->shop?->name;
            default:           return null;
        }
    }

    private function pageFor(string $cat): string
    {
        return [
            'wish' => 'wishes', 'shop' => 'shop', 'task' => 'tasks',
            'piggypot' => 'piggy-pots', 'membership' => 'memberships',
            'bill' => 'bills', 'tip' => 'tips',
        ][$cat] ?? 'wishes';
    }

    /**
     * Ajax pagination for the media library (matches the gifter* JSON shape).
     *
     * Also serves search / type-filter / sort: the library is paginated, so filtering
     * on the client would only ever look at the rows already loaded.
     */
    public function feed(Request $request)
    {
        $buyer = Auth::user();
        $media = $this->applyMediaQuery($this->buildMediaLibrary($this->loadSources($buyer)), $request);
        $page = max(1, (int) $request->input('page', 1));
        [$mediaPage, $pagination] = $this->paginate($media, $page, self::MEDIA_PER_PAGE);

        return response()->json(array_merge([
            'status' => true,
            'medias' => $mediaPage,
            'total_matched' => count($media),
        ], $pagination));
    }

    /**
     * Search (title + creator), type filter, creator filter and sort over the built
     * media library. Applied before pagination so the counts a buyer sees are real.
     */
    private function applyMediaQuery(array $items, Request $request): array
    {
        $q = trim((string) $request->input('q', ''));
        $type = (string) $request->input('type', '');
        $creator = (string) $request->input('creator', '');
        $sort = (string) $request->input('sort', 'recent');

        if ($q !== '') {
            $needle = mb_strtolower($q);
            $items = array_values(array_filter($items, function ($i) use ($needle) {
                $hay = mb_strtolower(($i['title'] ?? '').' '.($i['owner']['username'] ?? ''));

                return str_contains($hay, $needle);
            }));
        }

        if ($type !== '') {
            $items = array_values(array_filter($items, fn ($i) => ($i['source_type'] ?? null) === $type));
        }

        if ($creator !== '') {
            $items = array_values(array_filter($items, fn ($i) => ($i['owner']['username'] ?? null) === $creator));
        }

        if ($sort === 'name') {
            usort($items, fn ($a, $b) => strcasecmp((string) $a['title'], (string) $b['title']));
        } elseif ($sort === 'oldest') {
            usort($items, fn ($a, $b) => strcmp((string) $a['purchased_at'], (string) $b['purchased_at']));
        }

        return $items;
    }

    /** Type counts across the WHOLE library, so filter chips don't lie on page 1. */
    private function mediaTypeCounts(array $sources): array
    {
        $counts = [];
        foreach ($this->buildMediaLibrary($sources) as $i) {
            $t = $i['source_type'] ?? 'wish';
            $counts[$t] = ($counts[$t] ?? 0) + 1;
        }

        return $counts;
    }

    /* ----------------------------------------------------------------- */
    /* Purchase export */
    /* ----------------------------------------------------------------- */

    /**
     * CSV of every purchase the buyer has made. Creators can already download an
     * earnings statement; a buyer had no way to get their own spend out at all
     * (expenses, tax, or just "prove what I paid").
     *
     * Amounts are emitted twice: as charged (original currency) and converted to the
     * buyer's display currency, because a mixed-currency total is meaningless without
     * both. Streamed so a long history never buffers into memory.
     */
    public function export(Request $request)
    {
        $buyer = Auth::user();
        $display = $buyer->default_currency ?: 'GBP';
        $rows = $this->buildExportRows($this->loadSources($buyer), $display);

        $filename = 'spennypiggy-purchases-'.Carbon::now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows, $display) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'Date', 'Type', 'Creator', 'Item', 'Amount charged', 'Currency',
                "Amount ({$display})", 'Status',
            ]);
            foreach ($rows as $r) {
                fputcsv($out, $r);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    private function buildExportRows(array $sources, string $display): array
    {
        $rows = [];

        $push = function ($type, $row, $title, $owner, $currency, $status) use (&$rows, $display) {
            $gross = (float) ($row->total_paid ?: $row->amount ?: 0);
            $rows[] = [
                $this->ts($row->created_at),
                $type,
                $this->csvSafe($owner?->username ? '@'.$owner->username : ''),
                $this->csvSafe($title ?: 'Content'),
                number_format($gross, 2, '.', ''),
                strtoupper($currency ?: 'GBP'),
                number_format($this->convert($currency, $gross, $display), 2, '.', ''),
                $this->csvSafe($status ?: ''),
            ];
        };

        foreach ($sources['wish'] as $r) {
            $push('Wish', $r, $r->wish?->wishname, $r->payment?->owner, $r->payment?->currency, $r->payment?->payment_status);
        }
        foreach ($sources['shop'] as $r) {
            $push('Shop', $r, $r->shop?->name, $r->shop?->user, $r->currency, $r->payment_status);
        }
        foreach ($sources['task'] as $r) {
            $push('Paid task', $r, $r->task?->title, $r->task?->creator, $r->currency, $r->status);
        }
        foreach ($sources['piggypot'] as $r) {
            $push('Piggy Pot', $r, $r->piggyPot?->title, $r->piggyPot?->user, $r->currency, $r->status);
        }
        foreach ($sources['tip'] as $r) {
            $push('Piggy Bank', $r, $r->tipGoal?->name ?: 'Exclusive content', $r->creator, $r->currency, $r->status);
        }
        foreach ($sources['membership'] as $r) {
            $push('Membership', $r, $r->membership?->level, $r->membership?->user, $r->currency, $r->status);
        }
        foreach ($sources['bill'] as $r) {
            $push('Subscription', $r, $r->bill?->name, $r->bill?->user, $r->currency, $r->status);
        }

        usort($rows, fn ($a, $b) => strcmp((string) $b[0], (string) $a[0]));

        return $rows;
    }

    /**
     * Neutralise spreadsheet formula injection.
     *
     * Item and creator names are free text written by another user. A title beginning
     * =, +, - or @ is executed as a formula the moment this export is opened in Excel
     * or Sheets — and a purchase history is exactly the kind of file people open there.
     */
    private function csvSafe(?string $value): string
    {
        $value = (string) $value;

        return $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)
            ? "'".$value
            : $value;
    }

    /* ----------------------------------------------------------------- */
    /* Source loading */
    /* ----------------------------------------------------------------- */

    private function loadSources($buyer): array
    {
        return [
            'wish' => StripePaymentItems::whereHas('payment', fn ($q) => $q->where('user_id', $buyer->id))
                ->with(['wish', 'payment.owner'])
                ->latest()->get(),

            'shop' => ShopPayment::where('user_id', $buyer->id)
                ->with(['shop.user'])
                ->latest()->get(),

            'task' => TaskPurchase::where('supporter_id', $buyer->id)
                ->with(['task.creator'])
                ->latest()->get(),

            'piggypot' => PiggyPotContribution::where('user_id', $buyer->id)
                ->with(['piggyPot.user'])
                ->latest()->get(),

            'tip' => TipGoalsPayment::where('user_id', $buyer->id)
                ->with(['creator', 'tipGoal'])
                ->latest()->get(),

            'membership' => MembershipPayment::where('user_id', $buyer->id)
                ->with(['membership.user'])
                ->latest()->get(),

            'bill' => BillPayment::where(function ($q) use ($buyer) {
                $q->where('user_id', $buyer->id)->orWhere('guest_email', $buyer->email);
            })->with(['bill.user'])->latest()->get(),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Section 1 — media library */
    /* ----------------------------------------------------------------- */

    private function buildMediaLibrary(array $sources): array
    {
        $items = [];

        // Wishes
        foreach ($sources['wish'] as $row) {
            $wish = $row->wish;
            $owner = $row->payment?->owner;
            if (! $wish || ! $owner || ! $this->paidOk($row->payment?->payment_status)) {
                continue;
            }
            $url = $wish->content_file_url ?: $wish->reward_url;
            if (! $url) {
                continue;
            }
            $items[] = $this->mediaItem(
                "wish:{$row->id}", 'wish', $wish->wishname, $url, $wish->content_file_type,
                $owner, $row->created_at, 'wishes'
            );
        }

        // Shop (digital deliverable only)
        foreach ($sources['shop'] as $row) {
            $shop = $row->shop;
            $owner = $shop?->user;
            if (! $shop || ! $owner || ! $this->paidOk($row->payment_status)) {
                continue;
            }
            $url = $shop->reward_file_url;
            if (! $url) {
                continue;
            }
            $items[] = $this->mediaItem(
                "shop:{$row->id}", 'shop', $shop->name, $url, $shop->reward_file_type,
                $owner, $row->created_at, 'shop'
            );
        }

        // Paid tasks (instant => creator pre-uploaded file; custom => delivered proof)
        foreach ($sources['task'] as $row) {
            $task = $row->task;
            $owner = $task?->creator;
            if (! $task || ! $owner || ! $this->paidOk($row->status)) {
                continue;
            }
            if ($task->type === 'instant') {
                $url = $task->deliverable_content;
                $type = $task->deliverable_content_type;
            } else {
                $proof = is_array($row->proof_content) ? $row->proof_content : [];
                $url = $proof['file'] ?? null;
                $type = $proof['mime_type'] ?? null;
            }
            if (! $url || ! $this->looksLikeFile($url)) {
                continue;
            }
            $items[] = $this->mediaItem(
                "task:{$row->id}", 'task', $task->title, $url, $type,
                $owner, $row->created_at, 'tasks'
            );
        }

        // Piggy Pot (required content product; no MIME column => infer from extension)
        foreach ($sources['piggypot'] as $row) {
            $pot = $row->piggyPot;
            $owner = $pot?->user;
            if (! $pot || ! $owner || ! $this->paidOk($row->status)) {
                continue;
            }
            $url = $this->ucPrefix($pot->content_file);
            if (! $url) {
                continue;
            }
            $items[] = $this->mediaItem(
                "piggypot:{$row->id}", 'piggypot', $pot->title, $url, null,
                $owner, $row->created_at, 'piggy-pots'
            );
        }

        usort($items, fn ($a, $b) => strcmp($b['purchased_at'], $a['purchased_at']));

        return $items;
    }

    private function mediaItem($id, $sourceType, $title, $rawUrl, $type, $owner, $createdAt, $page): array
    {
        $url = $this->ucPrefix($rawUrl);
        $mime = $this->isMime($type) ? $type : null;
        $kind = $this->resolveKind($type, $url);

        return [
            'id' => $id,
            'source_type' => $sourceType,
            'title' => $title ?: 'Content',
            'media_url' => $url,
            'media_kind' => $kind,
            'mime' => $mime,
            // Posters are resolved client-side by LazyVideo from the video URL via the
            // video_posters system; never pass the raw video URL as an <img> poster.
            'poster_url' => null,
            'owner' => $this->ownerBlock($owner),
            'purchased_at' => $this->ts($createdAt),
            'open_link' => $this->openLink($owner, $page),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Section 2 — active subscriptions */
    /* ----------------------------------------------------------------- */

    private function buildSubscriptions(array $sources): array
    {
        $subs = [];

        // Memberships — keep the latest row per membership. Ended/cancelled
        // ones stay listed (flagged is_active=false) so a supporter can still
        // see what they bought; dropping them made past purchases vanish.
        $byMembership = [];
        foreach ($sources['membership'] as $row) {
            if (! $row->membership || ! $row->membership->user) {
                continue;
            }
            $key = $row->membership_id;
            if (! isset($byMembership[$key]) || $row->created_at > $byMembership[$key]->created_at) {
                $byMembership[$key] = $row;
            }
        }
        foreach ($byMembership as $row) {
            $m = $row->membership;
            $subs[] = $this->subscriptionRow(
                'membership', $row, $m->level ?: 'Membership', $m->user, 'memberships', null
            );
        }

        // Bills — keep the latest row per bill (ended ones stay listed too).
        $byBill = [];
        foreach ($sources['bill'] as $row) {
            if (! $row->bill || ! $row->bill->user) {
                continue;
            }
            $key = $row->bills_id;
            if (! isset($byBill[$key]) || $row->created_at > $byBill[$key]->created_at) {
                $byBill[$key] = $row;
            }
        }
        foreach ($byBill as $row) {
            $bill = $row->bill;
            $subs[] = $this->subscriptionRow(
                'bill', $row, $bill->name ?: 'Subscription', $bill->user, 'bills', $bill->content_file_url ?: null
            );
        }

        // Active first, then ended (most recent first within each group).
        usort($subs, function ($a, $b) {
            if ($a['is_active'] !== $b['is_active']) {
                return $a['is_active'] ? -1 : 1;
            }

            return strcmp((string) ($b['started_at'] ?? ''), (string) ($a['started_at'] ?? ''));
        });

        return $subs;
    }

    /**
     * One subscription row, shared by memberships and bills.
     *
     * `is_canceling` is the load-bearing bit: a supporter who cancels keeps access until
     * the period ends, so the row must stay visible and say WHEN it ends. Hiding it (or
     * showing a renewal date it will never charge on) reads as "my access is already
     * gone" and generates a support ticket for a working feature.
     */
    private function subscriptionRow(string $type, $row, string $title, $owner, string $page, ?string $contentFile): array
    {
        $isActive = $this->isRecurringActive($row);
        $isCanceling = $isActive && (bool) ($row->cancel_at_period_end ?? false);

        return [
            'id' => "{$type}:{$row->id}",
            'raw_id' => $row->id,
            'is_active' => $isActive,
            'is_canceling' => $isCanceling,
            // A cancelled-at-period-end row can't be cancelled again, only resumed.
            'cancelable' => $isActive && ! $isCanceling && (bool) $row->stripe_id,
            'resumable' => $isCanceling && (bool) $row->stripe_id,
            'source_type' => $type,
            'title' => $title,
            'owner' => $this->ownerBlock($owner),
            'amount' => (float) $row->amount,
            'currency' => $row->currency ?: 'GBP',
            'recurring_type' => $row->recurring_type,
            // Renewal date only when it will actually renew; the same date is the
            // access-ends date once a cancellation is pending.
            'next_charge_at' => $isActive && ! $isCanceling ? $this->ts($row->upcoming_payment) : null,
            'ends_at' => $isCanceling ? $this->ts($row->upcoming_payment) : null,
            'last_charge_at' => $this->ts($row->created_at),
            'status' => $row->status,
            'started_at' => $this->ts($row->created_at),
            'content_file' => $contentFile,
            'open_link' => $this->openLink($owner, $page),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Creators rollup (per-creator relationship view) */
    /* ----------------------------------------------------------------- */

    private function buildCreators(array $sources, string $display, $buyer): array
    {
        $map = [];
        $buyerUsername = $buyer->username;

        $add = function ($owner, $type, $row, $currency, $active) use (&$map, $display, $buyerUsername) {
            if (! $owner || ! ($owner->id ?? null)) {
                return;
            }
            $id = $owner->id;
            if (! isset($map[$id])) {
                $map[$id] = [
                    'owner' => $this->ownerBlock($owner),
                    'total_spent' => 0.0,
                    'purchase_count' => 0,
                    'active_subs' => 0,
                    'types' => [],
                    'open_link' => $this->openLink($owner, 'wishes'),
                    'support_story_url' => $owner->username && $buyerUsername
                        ? "/support-story/{$owner->username}/{$buyerUsername}"
                        : null,
                ];
            }
            $gross = (float) ($row->total_paid ?: $row->amount ?: 0);
            if ($gross > 0) {
                $map[$id]['total_spent'] += $this->convert($currency, $gross, $display);
            }
            $map[$id]['purchase_count']++;
            $map[$id]['types'][$type] = true;
            if ($active) {
                $map[$id]['active_subs']++;
            }
        };

        foreach ($sources['wish'] as $r) {
            if ($this->paidOk($r->payment?->payment_status)) {
                $add($r->payment?->owner, 'wish', $r, $r->payment?->currency, false);
            }
        }
        foreach ($sources['shop'] as $r) {
            if ($this->paidOk($r->payment_status)) {
                $add($r->shop?->user, 'shop', $r, $r->currency, false);
            }
        }
        foreach ($sources['task'] as $r) {
            if ($this->paidOk($r->status)) {
                $add($r->task?->creator, 'task', $r, $r->currency, false);
            }
        }
        foreach ($sources['piggypot'] as $r) {
            if ($this->paidOk($r->status)) {
                $add($r->piggyPot?->user, 'piggypot', $r, $r->currency, false);
            }
        }
        foreach ($sources['tip'] as $r) {
            if ($this->paidOk($r->status)) {
                $add($r->creator, 'tip', $r, $r->currency, false);
            }
        }
        foreach ($sources['membership'] as $r) {
            if ($this->paidOk($r->status)) {
                $add($r->membership?->user, 'membership', $r, $r->currency, $this->isRecurringActive($r));
            }
        }
        foreach ($sources['bill'] as $r) {
            if ($this->paidOk($r->status)) {
                $add($r->bill?->user, 'bill', $r, $r->currency, $this->isRecurringActive($r));
            }
        }

        $out = array_map(function ($c) {
            $c['total_spent'] = round($c['total_spent'], 2);
            $c['type_count'] = count($c['types']);
            unset($c['types']);

            return $c;
        }, array_values($map));

        usort($out, fn ($a, $b) => $b['total_spent'] <=> $a['total_spent']);

        return $out;
    }

    /* ----------------------------------------------------------------- */
    /* Section 3 — unlocked content (one-time, lifetime access) */
    /* ----------------------------------------------------------------- */

    private function buildUnlocked(array $sources): array
    {
        $out = [];

        foreach ($sources['wish'] as $row) {
            $owner = $row->payment?->owner;
            if (! $row->wish || ! $owner || ! $this->paidOk($row->payment?->payment_status)) {
                continue;
            }
            $out[] = $this->unlockedItem("wish:{$row->id}", 'wish', $row->wish->wishname, $owner, $row->created_at, 'wishes', $row->session_id);
        }
        foreach ($sources['shop'] as $row) {
            $owner = $row->shop?->user;
            if (! $row->shop || ! $owner || ! $this->paidOk($row->payment_status)) {
                continue;
            }
            $out[] = $this->unlockedItem("shop:{$row->id}", 'shop', $row->shop->name, $owner, $row->created_at, 'shop', $row->session_id);
        }
        foreach ($sources['task'] as $row) {
            $owner = $row->task?->creator;
            if (! $row->task || ! $owner || ! $this->paidOk($row->status)) {
                continue;
            }
            $out[] = $this->unlockedItem("task:{$row->id}", 'task', $row->task->title, $owner, $row->created_at, 'tasks', $row->stripe_session_id);
        }
        foreach ($sources['piggypot'] as $row) {
            $owner = $row->piggyPot?->user;
            if (! $row->piggyPot || ! $owner || ! $this->paidOk($row->status)) {
                continue;
            }
            $out[] = $this->unlockedItem("piggypot:{$row->id}", 'piggypot', $row->piggyPot->title, $owner, $row->created_at, 'piggy-pots', $row->session_id);
        }
        foreach ($sources['tip'] as $row) {
            $owner = $row->creator;
            if (! $owner || ! $this->paidOk($row->status)) {
                continue;
            }
            $title = $row->tipGoal?->name ?: 'Exclusive content';
            $out[] = $this->unlockedItem("tip:{$row->id}", 'tip', $title, $owner, $row->created_at, 'tips', $row->session_id);
        }

        usort($out, fn ($a, $b) => strcmp($b['unlocked_at'], $a['unlocked_at']));

        $this->attachDeliveryStatus($out);

        return $out;
    }

    private function unlockedItem($id, $sourceType, $title, $owner, $createdAt, $page, $sessionId = null): array
    {
        // One-time content purchases grant lifetime access to the buyer's library.
        return [
            'id' => $id,
            'source_type' => $sourceType,
            'title' => $title ?: 'Content',
            'owner' => $this->ownerBlock($owner),
            'unlocked_at' => $this->ts($createdAt),
            'is_active' => true,
            'expires_at' => null,
            'open_link' => $this->openLink($owner, $page),
            // Carried only far enough to key the delivery-status lookup below —
            // never sent to the frontend (see attachDeliveryStatus).
            '_session_id' => $sessionId,
        ];
    }

    /**
     * "Were you told about this?" for every one-time purchase on the hub — the
     * buyer's OWN messages only. Mutates `$items` in place, batched into ONE
     * delivery-log query for the whole list rather than one per card.
     *
     * The `/history` feed and the creator ledger already show this; the hub
     * was the one purchase surface that did not, despite being exactly where a
     * buyer goes to ask "did I actually get a receipt for this?".
     */
    private function attachDeliveryStatus(array &$items): void
    {
        $sessionIds = collect($items)->pluck('_session_id')->filter()->unique()->values()->all();

        $delivery = $sessionIds === []
            ? []
            : app(NotificationDeliveryService::class)->forSessionIds(Auth::id(), $sessionIds);

        foreach ($items as &$item) {
            $sessionId = $item['_session_id'] ?? null;
            unset($item['_session_id']);
            $item['notifications'] = $sessionId ? ($delivery[$sessionId] ?? null) : null;
        }
        unset($item);
    }

    /* ----------------------------------------------------------------- */
    /* Section 4 — spend summary */
    /* ----------------------------------------------------------------- */

    /**
     * Spend is read from the LEDGER, not from the seven payment tables.
     *
     * This hub used to sum `total_paid ?: amount` straight off each payment row while
     * Support History summed the ledger's gross — two implementations of "what this
     * person has spent", which disagreed whenever a row was refunded, still settling,
     * or priced differently in the two places. The ledger is what the creator side,
     * the payout engine and Support History all read, so the buyer reads it too.
     *
     * Rows the ledger has not caught up with yet are still counted (see
     * unsyncedSpend()) — a purchase must never be missing from the buyer's own record
     * because a background command has not run.
     */
    private function buildSpendSummary($buyer, array $sources, string $display): array
    {
        $byType = [
            'wish' => 0.0, 'shop' => 0.0, 'task' => 0.0,
            'piggypot' => 0.0, 'membership' => 0.0, 'bill' => 0.0, 'tip' => 0.0,
        ];
        $count = 0;
        $thisMonth = 0.0;
        $creators = [];
        $refunded = 0.0;
        $refundedCount = 0;
        $pending = 0.0;
        $pendingCount = 0;
        $monthStart = Carbon::now()->startOfMonth();

        // Rolling 12 months, seeded so a quiet month renders as a zero bar rather than
        // disappearing (a gap in a timeline reads as missing data, not as "spent nothing").
        $byMonth = [];
        for ($i = 11; $i >= 0; $i--) {
            $byMonth[Carbon::now()->startOfMonth()->subMonths($i)->format('Y-m')] = 0.0;
        }

        $add = function (string $type, float $value, $date, $creatorId) use (
            &$byType, &$count, &$thisMonth, &$creators, &$byMonth, $monthStart
        ) {
            if ($value <= 0) {
                return;
            }
            $byType[$type] += $value;
            $count++;
            if ($creatorId) {
                $creators[$creatorId] = true;
            }
            if ($date) {
                $date = Carbon::parse($date);
                if ($date >= $monthStart) {
                    $thisMonth += $value;
                }
                $key = $date->format('Y-m');
                if (array_key_exists($key, $byMonth)) {
                    $byMonth[$key] += $value;
                }
            }
        };

        $ledgerRows = FinancialTransaction::where('supporter_id', $buyer->id)
            ->where('type', 'income')
            ->whereIn('status', LedgerRules::VISIBLE_STATUSES)
            ->get([
                'id', 'user_id', 'source_type', 'source_id', 'status', 'currency',
                'gross_amount', 'net_amount', 'vat_amount', 'platform_fee', 'stripe_fee',
                'transaction_date', 'created_at',
            ]);

        $seen = [];

        foreach ($ledgerRows as $ft) {
            $type = self::LEDGER_TYPE_MAP[$ft->source_type] ?? null;
            if ($type === null) {
                continue;
            }

            $seen[$ft->source_type.'#'.$ft->source_id] = true;

            $value = $this->convert($ft->currency, LedgerRules::buyerPaid($ft), $display);
            $date = $ft->transaction_date ?: $ft->created_at;
            $status = (string) $ft->status;

            // Money that came back is reported separately, never netted off the total.
            // A supporter needs to see both "you spent £120" and "£20 of it was refunded";
            // a single blended figure answers neither question.
            if (in_array($status, LedgerRules::REVERSED_STATUSES, true)) {
                if ($status !== 'failed') {
                    $refunded += $value;
                    $refundedCount++;
                }

                continue;
            }

            if (in_array($status, LedgerRules::IN_FLIGHT_STATUSES, true)) {
                $pending += $value;
                $pendingCount++;

                continue;
            }

            $add($type, $value, $date, $ft->user_id);
        }

        // Anything the ledger has no row for yet.
        $unsynced = $this->unsyncedSpend($sources, $seen, $display, $add);

        $byType = array_map(fn ($v) => round($v, 2), $byType);

        $lastMonthKey = Carbon::now()->startOfMonth()->subMonth()->format('Y-m');

        return [
            'currency' => $display,
            'total_spent' => round(array_sum($byType), 2),
            'by_type' => $byType,
            'by_month' => array_map(
                fn ($k) => ['month' => $k, 'total' => round($byMonth[$k], 2)],
                array_keys($byMonth)
            ),
            'this_month' => round($thisMonth, 2),
            'last_month' => round($byMonth[$lastMonthKey] ?? 0, 2),
            'purchase_count' => $count,
            'creators_supported' => count($creators),
            'refunded_total' => round($refunded, 2),
            'refunded_count' => $refundedCount,
            'pending_total' => round($pending, 2),
            'pending_count' => $pendingCount,
            'awaiting_ledger_count' => $unsynced,
        ];
    }

    /** Ledger source_type → the hub's own product key. */
    private const LEDGER_TYPE_MAP = [
        StripePaymentItems::class => 'wish',
        ShopPayment::class => 'shop',
        TaskPurchase::class => 'task',
        PiggyPotContribution::class => 'piggypot',
        MembershipPayment::class => 'membership',
        BillPayment::class => 'bill',
        TipGoalsPayment::class => 'tip',
    ];

    /**
     * Count purchases the ledger has not recorded yet.
     *
     * `finance:sync-transactions` reconciles every 30 minutes, so a payment whose
     * webhook did not write a ledger row is invisible to Support History until it
     * runs. The buyer's own record must not have that hole — their money left their
     * account, and "where is my purchase?" is the single worst question this page can
     * provoke. These rows are added to the totals and reported as a count so the
     * `finance:audit-ledger` command has something to reconcile against.
     *
     * @param  array<string, bool>  $seen  keys "SourceClass#id" already in the ledger
     */
    private function unsyncedSpend(array $sources, array $seen, string $display, callable $add): int
    {
        $missing = 0;

        $walk = function (string $type, string $class, iterable $rows, callable $status, callable $currency, callable $creator) use (&$missing, $seen, $display, $add) {
            foreach ($rows as $row) {
                if (isset($seen[$class.'#'.$row->id])) {
                    continue;
                }
                if (! $this->paidOk($status($row))) {
                    continue;
                }

                $gross = (float) ($row->total_paid ?: $row->amount ?: 0);
                if ($gross <= 0) {
                    continue;
                }

                $missing++;
                $add($type, $this->convert($currency($row), $gross, $display), $row->created_at, $creator($row));
            }
        };

        $walk('wish', StripePaymentItems::class, $sources['wish'],
            fn ($r) => $r->payment?->payment_status,
            fn ($r) => $r->payment?->currency,
            fn ($r) => $r->payment?->owner?->id);

        $walk('shop', ShopPayment::class, $sources['shop'],
            fn ($r) => $r->payment_status,
            fn ($r) => $r->currency,
            fn ($r) => $r->shop?->user?->id);

        $walk('task', TaskPurchase::class, $sources['task'],
            fn ($r) => $r->status,
            fn ($r) => $r->currency,
            fn ($r) => $r->task?->creator?->id);

        $walk('piggypot', PiggyPotContribution::class, $sources['piggypot'],
            fn ($r) => $r->status,
            fn ($r) => $r->currency,
            fn ($r) => $r->piggyPot?->user?->id);

        $walk('membership', MembershipPayment::class, $sources['membership'],
            fn ($r) => $r->status,
            fn ($r) => $r->currency,
            fn ($r) => $r->membership?->user?->id);

        $walk('bill', BillPayment::class, $sources['bill'],
            fn ($r) => $r->status,
            fn ($r) => $r->currency,
            fn ($r) => $r->bill?->user?->id);

        $walk('tip', TipGoalsPayment::class, $sources['tip'],
            fn ($r) => $r->status,
            fn ($r) => $r->currency,
            fn ($r) => $r->creator?->id);

        return $missing;
    }

    /* ----------------------------------------------------------------- */
    /* Helpers */
    /* ----------------------------------------------------------------- */

    /** Cached currency rates (avoids Helpers::priceFormat's 2 DB hits per row). */
    private array $ratesCache = [];

    private function rates(): array
    {
        if (empty($this->ratesCache)) {
            $this->ratesCache = Currency::whereNotNull('conversion_rate')
                ->pluck('conversion_rate', 'ISO')
                ->mapWithKeys(fn ($r, $iso) => [strtoupper($iso) => (float) $r])
                ->toArray();
        }

        return $this->ratesCache;
    }

    /** GBP-pivot conversion, matching Helpers::priceFormat but rate-cached. */
    private function convert(?string $from, float $amount, string $to): float
    {
        $from = strtoupper($from ?: 'GBP');
        $to = strtoupper($to);
        if ($from === $to) {
            return round($amount, 2);
        }
        $rates = $this->rates();
        $rf = $rates[$from] ?? 0;
        $rt = $rates[$to] ?? 0;
        if ($rf <= 0 || $rt <= 0) {
            return round($amount, 2);
        }

        return round(($amount / $rf) * $rt, 2);
    }

    private function ownerBlock($user): array
    {
        return [
            'name' => $user->name ?? '',
            'avatar' => $user->avatar_url ?? null,
            'cover' => $user->cover_url ?? null,
            'username' => $user->username ?? null,
            'stripe_details_submitted' => (bool) ($user->stripe_details_submitted ?? false),
        ];
    }

    private function openLink($owner, string $page): ?string
    {
        $username = $owner->username ?? null;

        return $username ? "/{$username}?page={$page}" : null;
    }

    private function ucPrefix(?string $v): ?string
    {
        if (empty($v)) {
            return null;
        }
        if (str_starts_with($v, 'http://') || str_starts_with($v, 'https://')) {
            return $v;
        }

        return 'https://ucarecdn.com/'.$v.'/';
    }

    private function isMime(?string $type): bool
    {
        return $type && str_contains($type, '/');
    }

    private function looksLikeFile(?string $v): bool
    {
        if (empty($v)) {
            return false;
        }

        return str_starts_with($v, 'http://')
            || str_starts_with($v, 'https://')
            || (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i', $v);
    }

    /**
     * Resolve a coarse media_kind from a MIME string, a task enum, or a URL extension.
     */
    private function resolveKind(?string $type, ?string $url): string
    {
        $t = strtolower((string) $type);

        if ($this->isMime($t)) {
            if (str_starts_with($t, 'image/')) {
                return 'image';
            }
            if (str_starts_with($t, 'video/')) {
                return 'video';
            }
            if (str_starts_with($t, 'audio/')) {
                return 'audio';
            }
            if ($t === 'application/pdf') {
                return 'pdf';
            }

            return 'other';
        }

        // Coarse enums (shop default 'image', task instant text/image/voice/pdf/badge).
        switch ($t) {
            case 'image': return 'image';
            case 'video': return 'video';
            case 'audio':
            case 'voice': return 'audio';
            case 'pdf': return 'pdf';
            case 'text':
            case 'badge': return 'other';
        }

        return $this->kindFromUrl($url);
    }

    private function kindFromUrl(?string $url): string
    {
        if (! $url) {
            return 'other';
        }
        $path = strtolower(parse_url($url, PHP_URL_PATH) ?: $url);
        if (preg_match('/\.(mp4|mov|webm|m4v|avi)\/?$/', $path)) {
            return 'video';
        }
        if (preg_match('/\.(jpe?g|png|gif|webp|avif|heic)\/?$/', $path)) {
            return 'image';
        }
        if (preg_match('/\.(mp3|wav|m4a|ogg)\/?$/', $path)) {
            return 'audio';
        }
        if (preg_match('/\.pdf\/?$/', $path)) {
            return 'pdf';
        }

        return 'other';
    }

    private function ts($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return Carbon::parse($value)->format('Y-m-d H:i:s');
    }

    private function paidOk($status): bool
    {
        if (empty($status)) {
            return true; // legacy rows with no status column (e.g. wish line items)
        }
        $s = strtolower((string) $status);
        $blocked = [
            'refunded', 'failed', 'cancelled', 'canceled', 'disputed', 'expired',
            'pending', 'initiated', 'processing', 'created', 'unpaid', 'requires_payment',
        ];

        return ! in_array($s, $blocked, true);
    }

    /**
     * Recurring entitlement is active when paid, set to continue, and not ended.
     */
    private function isRecurringActive($row): bool
    {
        if (strtolower((string) $row->status) !== 'paid') {
            return false;
        }
        if ($row->recurring_for !== 'continue') {
            return false;
        }

        return empty($row->end) || Carbon::parse($row->end) >= Carbon::now();
    }

    private function paginate(array $items, int $page, int $perPage): array
    {
        $total = count($items);
        $lastPage = max(1, (int) ceil($total / $perPage));
        $slice = array_slice($items, ($page - 1) * $perPage, $perPage);

        return [array_values($slice), [
            'last_page' => $lastPage,
            'current_page' => $page,
            'total' => $total,
            'per_page' => $perPage,
        ]];
    }
}

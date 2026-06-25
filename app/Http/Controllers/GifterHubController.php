<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\SavedItem;
use App\Models\Shop;
use App\Models\StripePaymentItems;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\WishItem;
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

        $media = $this->buildMediaLibrary($sources);
        $page = max(1, (int) $request->input('page', 1));
        [$mediaPage, $pagination] = $this->paginate($media, $page, self::MEDIA_PER_PAGE);

        return Inertia::render('gifter/Hub', array_merge([
            'display_currency' => $display,
            'media_library'    => $mediaPage,
            'media_pagination' => $pagination,
            'subscriptions'    => $this->buildSubscriptions($sources),
            'unlocked'         => $this->buildUnlocked($sources),
            'spend_summary'    => $this->buildSpendSummary($sources, $display),
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
            'status'           => true,
            'display_currency' => $display,
            'media_library'    => $mediaPage,
            'media_pagination' => $pagination,
            'subscriptions'    => $this->buildSubscriptions($sources),
            'unlocked'         => $this->buildUnlocked($sources),
            'spend_summary'    => $this->buildSpendSummary($sources, $display),
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
            'receipts'         => $this->buildReceipts($buyer),
            'incoming'         => $this->buildIncoming($buyer),
            'creators'         => $this->buildCreators($sources, $display, $buyer),
            'saved'            => $this->buildSaved($buyer),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Saved items (save-for-later wishlist)                             */
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
            'wish'       => $load(WishItem::class, 'wish', 'user'),
            'shop'       => $load(Shop::class, 'shop', 'user'),
            'membership' => $load(Membership::class, 'membership', 'user'),
            'bill'       => $load(Bills::class, 'bill', 'user'),
            'piggypot'   => $load(PiggyPot::class, 'piggypot', 'user'),
            'task'       => $load(Task::class, 'task', 'creator'),
        ];

        $resolve = [
            'wish'       => fn ($i) => [$i->wishname, $i->user],
            'shop'       => fn ($i) => [$i->name, $i->user],
            'membership' => fn ($i) => [$i->level, $i->user],
            'bill'       => fn ($i) => [$i->name, $i->user],
            'piggypot'   => fn ($i) => [$i->title, $i->user],
            'task'       => fn ($i) => [$i->title, $i->creator],
        ];

        $out = [];
        foreach ($rows as $r) {
            $item = $items[$r->product_type][$r->item_id] ?? null;
            if (!$item || empty($resolve[$r->product_type])) {
                continue; // item deleted since saving
            }
            [$title, $owner] = $resolve[$r->product_type]($item);
            if (!$owner) {
                continue;
            }
            $out[] = [
                'id'           => "saved:{$r->id}",
                'product_type' => $r->product_type,
                'item_id'      => $r->item_id,
                'title'        => $title ?: 'Content',
                'owner'        => $this->ownerBlock($owner),
                'open_link'    => $this->openLink($owner, $this->pageFor($r->product_type)),
                'saved_at'     => $this->ts($r->created_at),
            ];
        }

        return $out;
    }

    /* ----------------------------------------------------------------- */
    /* Receipts (certificate wallet)                                     */
    /* ----------------------------------------------------------------- */

    private function buildReceipts($buyer): array
    {
        $out = [];

        $delis = Deliverable::where('gifter_id', $buyer->id)
            ->whereNotNull('certificate_url')
            ->with(['creator', 'wishItem', 'bill', 'membership', 'task', 'shop'])
            ->latest()->limit(80)->get();

        foreach ($delis as $d) {
            $out[] = [
                'id'              => "deliverable:{$d->id}",
                'source_type'     => $this->deliverableCat($d->product_type),
                'title'           => $this->deliverableTitle($d) ?: 'Purchase',
                'owner'           => $this->ownerBlock($d->creator),
                'amount'          => (float) ($d->transaction_amount ?: 0),
                'currency'        => $d->payment_currency ?: 'GBP',
                'date'            => $this->ts($d->created_at),
                'certificate_url' => $d->certificate_url,
            ];
        }

        $tips = TipGoalsPayment::where('user_id', $buyer->id)
            ->whereNotNull('certificate_url')
            ->with(['creator', 'tipGoal'])
            ->latest()->limit(80)->get();

        foreach ($tips as $t) {
            if (!$t->creator) {
                continue;
            }
            $out[] = [
                'id'              => "tip:{$t->id}",
                'source_type'     => 'tip',
                'title'           => $t->tipGoal?->name ?: 'Exclusive content',
                'owner'           => $this->ownerBlock($t->creator),
                'amount'          => (float) ($t->total_paid ?: $t->amount ?: 0),
                'currency'        => $t->currency ?: 'GBP',
                'date'            => $this->ts($t->created_at),
                'certificate_url' => $t->certificate_url,
            ];
        }

        usort($out, fn ($a, $b) => strcmp((string) $b['date'], (string) $a['date']));

        return $out;
    }

    /* ----------------------------------------------------------------- */
    /* Incoming (in-progress delivery tracking)                          */
    /* ----------------------------------------------------------------- */

    private function buildIncoming($buyer): array
    {
        $rows = Deliverable::where('gifter_id', $buyer->id)
            ->whereNotIn('status', ['delivered', 'refunded'])
            ->with(['creator', 'wishItem', 'bill', 'membership', 'task', 'shop'])
            ->latest()->get();

        $out = [];
        foreach ($rows as $d) {
            if (!$d->creator) {
                continue;
            }
            $type = $this->deliverableCat($d->product_type);
            $overdue = $d->due_at && Carbon::parse($d->due_at)->isPast() && $d->status !== 'delivered';
            $out[] = [
                'id'          => "incoming:{$d->id}",
                'source_type' => $type,
                'title'       => $this->deliverableTitle($d) ?: 'Purchase',
                'owner'       => $this->ownerBlock($d->creator),
                'status'      => $d->status,
                'is_physical' => $d->product_type === 'shop_item',
                'is_overdue'  => (bool) $overdue,
                'courier'     => $d->courier_name,
                'tracking_id' => $d->tracking_id,
                'eta'         => $this->ts($d->expected_delivery_date),
                'due_at'      => $this->ts($d->due_at),
                'created_at'  => $this->ts($d->created_at),
                'open_link'   => $this->openLink($d->creator, $this->pageFor($type)),
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
     */
    public function feed(Request $request)
    {
        $buyer = Auth::user();
        $media = $this->buildMediaLibrary($this->loadSources($buyer));
        $page = max(1, (int) $request->input('page', 1));
        [$mediaPage, $pagination] = $this->paginate($media, $page, self::MEDIA_PER_PAGE);

        return response()->json(array_merge([
            'status' => true,
            'medias' => $mediaPage,
        ], $pagination));
    }

    /* ----------------------------------------------------------------- */
    /* Source loading                                                    */
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
    /* Section 1 — media library                                         */
    /* ----------------------------------------------------------------- */

    private function buildMediaLibrary(array $sources): array
    {
        $items = [];

        // Wishes
        foreach ($sources['wish'] as $row) {
            $wish = $row->wish;
            $owner = $row->payment?->owner;
            if (!$wish || !$owner || !$this->paidOk($row->payment?->payment_status)) {
                continue;
            }
            $url = $wish->content_file_url ?: $wish->reward_url;
            if (!$url) {
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
            if (!$shop || !$owner || !$this->paidOk($row->payment_status)) {
                continue;
            }
            $url = $shop->reward_file_url;
            if (!$url) {
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
            if (!$task || !$owner || !$this->paidOk($row->status)) {
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
            if (!$url || !$this->looksLikeFile($url)) {
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
            if (!$pot || !$owner || !$this->paidOk($row->status)) {
                continue;
            }
            $url = $this->ucPrefix($pot->content_file);
            if (!$url) {
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
            'id'           => $id,
            'source_type'  => $sourceType,
            'title'        => $title ?: 'Content',
            'media_url'    => $url,
            'media_kind'   => $kind,
            'mime'         => $mime,
            // Posters are resolved client-side by LazyVideo from the video URL via the
            // video_posters system; never pass the raw video URL as an <img> poster.
            'poster_url'   => null,
            'owner'        => $this->ownerBlock($owner),
            'purchased_at' => $this->ts($createdAt),
            'open_link'    => $this->openLink($owner, $page),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Section 2 — active subscriptions                                  */
    /* ----------------------------------------------------------------- */

    private function buildSubscriptions(array $sources): array
    {
        $subs = [];

        // Memberships — keep the latest active row per membership.
        $byMembership = [];
        foreach ($sources['membership'] as $row) {
            if (!$this->isRecurringActive($row) || !$row->membership || !$row->membership->user) {
                continue;
            }
            $key = $row->membership_id;
            if (!isset($byMembership[$key]) || $row->created_at > $byMembership[$key]->created_at) {
                $byMembership[$key] = $row;
            }
        }
        foreach ($byMembership as $row) {
            $m = $row->membership;
            $subs[] = [
                'id'             => "membership:{$row->id}",
                'raw_id'         => $row->id,
                'cancelable'     => (bool) $row->stripe_id,
                'source_type'    => 'membership',
                'title'          => $m->level ?: 'Membership',
                'owner'          => $this->ownerBlock($m->user),
                'amount'         => (float) $row->amount,
                'currency'       => $row->currency ?: 'GBP',
                'recurring_type' => $row->recurring_type,
                'next_charge_at' => $this->ts($row->upcoming_payment),
                'status'         => $row->status,
                'started_at'     => $this->ts($row->created_at),
                'content_file'   => null,
                'open_link'      => $this->openLink($m->user, 'memberships'),
            ];
        }

        // Bills — keep the latest active row per bill.
        $byBill = [];
        foreach ($sources['bill'] as $row) {
            if (!$this->isRecurringActive($row) || !$row->bill || !$row->bill->user) {
                continue;
            }
            $key = $row->bills_id;
            if (!isset($byBill[$key]) || $row->created_at > $byBill[$key]->created_at) {
                $byBill[$key] = $row;
            }
        }
        foreach ($byBill as $row) {
            $bill = $row->bill;
            $subs[] = [
                'id'             => "bill:{$row->id}",
                'raw_id'         => $row->id,
                'cancelable'     => (bool) $row->stripe_id,
                'source_type'    => 'bill',
                'title'          => $bill->name ?: 'Subscription',
                'owner'          => $this->ownerBlock($bill->user),
                'amount'         => (float) $row->amount,
                'currency'       => $row->currency ?: 'GBP',
                'recurring_type' => $row->recurring_type,
                'next_charge_at' => $this->ts($row->upcoming_payment),
                'status'         => $row->status,
                'started_at'     => $this->ts($row->created_at),
                'content_file'   => $bill->content_file_url ?: null,
                'open_link'      => $this->openLink($bill->user, 'bills'),
            ];
        }

        return $subs;
    }

    /* ----------------------------------------------------------------- */
    /* Creators rollup (per-creator relationship view)                   */
    /* ----------------------------------------------------------------- */

    private function buildCreators(array $sources, string $display, $buyer): array
    {
        $map = [];
        $buyerUsername = $buyer->username;

        $add = function ($owner, $type, $row, $currency, $active) use (&$map, $display, $buyerUsername) {
            if (!$owner || !($owner->id ?? null)) {
                return;
            }
            $id = $owner->id;
            if (!isset($map[$id])) {
                $map[$id] = [
                    'owner'             => $this->ownerBlock($owner),
                    'total_spent'       => 0.0,
                    'purchase_count'    => 0,
                    'active_subs'       => 0,
                    'types'             => [],
                    'open_link'         => $this->openLink($owner, 'wishes'),
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
    /* Section 3 — unlocked content (one-time, lifetime access)          */
    /* ----------------------------------------------------------------- */

    private function buildUnlocked(array $sources): array
    {
        $out = [];

        foreach ($sources['wish'] as $row) {
            $owner = $row->payment?->owner;
            if (!$row->wish || !$owner || !$this->paidOk($row->payment?->payment_status)) {
                continue;
            }
            $out[] = $this->unlockedItem("wish:{$row->id}", 'wish', $row->wish->wishname, $owner, $row->created_at, 'wishes');
        }
        foreach ($sources['shop'] as $row) {
            $owner = $row->shop?->user;
            if (!$row->shop || !$owner || !$this->paidOk($row->payment_status)) {
                continue;
            }
            $out[] = $this->unlockedItem("shop:{$row->id}", 'shop', $row->shop->name, $owner, $row->created_at, 'shop');
        }
        foreach ($sources['task'] as $row) {
            $owner = $row->task?->creator;
            if (!$row->task || !$owner || !$this->paidOk($row->status)) {
                continue;
            }
            $out[] = $this->unlockedItem("task:{$row->id}", 'task', $row->task->title, $owner, $row->created_at, 'tasks');
        }
        foreach ($sources['piggypot'] as $row) {
            $owner = $row->piggyPot?->user;
            if (!$row->piggyPot || !$owner || !$this->paidOk($row->status)) {
                continue;
            }
            $out[] = $this->unlockedItem("piggypot:{$row->id}", 'piggypot', $row->piggyPot->title, $owner, $row->created_at, 'piggy-pots');
        }
        foreach ($sources['tip'] as $row) {
            $owner = $row->creator;
            if (!$owner || !$this->paidOk($row->status)) {
                continue;
            }
            $title = $row->tipGoal?->name ?: 'Exclusive content';
            $out[] = $this->unlockedItem("tip:{$row->id}", 'tip', $title, $owner, $row->created_at, 'tips');
        }

        usort($out, fn ($a, $b) => strcmp($b['unlocked_at'], $a['unlocked_at']));

        return $out;
    }

    private function unlockedItem($id, $sourceType, $title, $owner, $createdAt, $page): array
    {
        // One-time content purchases grant lifetime access to the buyer's library.
        return [
            'id'          => $id,
            'source_type' => $sourceType,
            'title'       => $title ?: 'Content',
            'owner'       => $this->ownerBlock($owner),
            'unlocked_at' => $this->ts($createdAt),
            'is_active'   => true,
            'expires_at'  => null,
            'open_link'   => $this->openLink($owner, $page),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Section 4 — spend summary                                         */
    /* ----------------------------------------------------------------- */

    private function buildSpendSummary(array $sources, string $display): array
    {
        $byType = [
            'wish' => 0.0, 'shop' => 0.0, 'task' => 0.0,
            'piggypot' => 0.0, 'membership' => 0.0, 'bill' => 0.0, 'tip' => 0.0,
        ];
        $count = 0;
        $thisMonth = 0.0;
        $creators = [];
        $monthStart = Carbon::now()->startOfMonth();

        $add = function ($type, $row, $currency, $owner) use (&$byType, &$count, &$thisMonth, &$creators, $display, $monthStart) {
            $gross = (float) ($row->total_paid ?: $row->amount ?: 0);
            if ($gross <= 0) {
                return;
            }
            $value = $this->convert($currency, $gross, $display);
            $byType[$type] += $value;
            $count++;
            if ($owner) {
                $creators[$owner->id ?? $owner] = true;
            }
            if ($row->created_at && $row->created_at >= $monthStart) {
                $thisMonth += $value;
            }
        };

        foreach ($sources['wish'] as $row) {
            if (!$this->paidOk($row->payment?->payment_status)) {
                continue;
            }
            $add('wish', $row, $row->payment?->currency, $row->payment?->owner);
        }
        foreach ($sources['shop'] as $row) {
            if (!$this->paidOk($row->payment_status)) {
                continue;
            }
            $add('shop', $row, $row->currency, $row->shop?->user);
        }
        foreach ($sources['task'] as $row) {
            if (!$this->paidOk($row->status)) {
                continue;
            }
            $add('task', $row, $row->currency, $row->task?->creator);
        }
        foreach ($sources['piggypot'] as $row) {
            if (!$this->paidOk($row->status)) {
                continue;
            }
            $add('piggypot', $row, $row->currency, $row->piggyPot?->user);
        }
        foreach ($sources['membership'] as $row) {
            if (!$this->paidOk($row->status)) {
                continue;
            }
            $add('membership', $row, $row->currency, $row->membership?->user);
        }
        foreach ($sources['bill'] as $row) {
            if (!$this->paidOk($row->status)) {
                continue;
            }
            $add('bill', $row, $row->currency, $row->bill?->user);
        }
        foreach ($sources['tip'] as $row) {
            if (!$this->paidOk($row->status)) {
                continue;
            }
            $add('tip', $row, $row->currency, $row->creator);
        }

        $byType = array_map(fn ($v) => round($v, 2), $byType);

        return [
            'currency'           => $display,
            'total_spent'        => round(array_sum($byType), 2),
            'by_type'            => $byType,
            'this_month'         => round($thisMonth, 2),
            'purchase_count'     => $count,
            'creators_supported' => count($creators),
        ];
    }

    /* ----------------------------------------------------------------- */
    /* Helpers                                                           */
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
            'name'                    => $user->name ?? '',
            'avatar'                  => $user->avatar_url ?? null,
            'cover'                   => $user->cover_url ?? null,
            'username'                => $user->username ?? null,
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
        return 'https://ucarecdn.com/' . $v . '/';
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
            if (str_starts_with($t, 'image/')) return 'image';
            if (str_starts_with($t, 'video/')) return 'video';
            if (str_starts_with($t, 'audio/')) return 'audio';
            if ($t === 'application/pdf') return 'pdf';
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
        if (!$url) {
            return 'other';
        }
        $path = strtolower(parse_url($url, PHP_URL_PATH) ?: $url);
        if (preg_match('/\.(mp4|mov|webm|m4v|avi)\/?$/', $path)) return 'video';
        if (preg_match('/\.(jpe?g|png|gif|webp|avif|heic)\/?$/', $path)) return 'image';
        if (preg_match('/\.(mp3|wav|m4a|ogg)\/?$/', $path)) return 'audio';
        if (preg_match('/\.pdf\/?$/', $path)) return 'pdf';
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
        return !in_array($s, $blocked, true);
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
            'last_page'    => $lastPage,
            'current_page' => $page,
            'total'        => $total,
            'per_page'     => $perPage,
        ]];
    }
}

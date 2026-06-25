<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
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

        return Inertia::render('gifter/Hub', [
            'display_currency' => $display,
            'media_library'    => $mediaPage,
            'media_pagination' => $pagination,
            'subscriptions'    => $this->buildSubscriptions($sources),
            'unlocked'         => $this->buildUnlocked($sources),
            'spend_summary'    => $this->buildSpendSummary($sources, $display),
        ]);
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

        return response()->json([
            'status'           => true,
            'display_currency' => $display,
            'media_library'    => $mediaPage,
            'media_pagination' => $pagination,
            'subscriptions'    => $this->buildSubscriptions($sources),
            'unlocked'         => $this->buildUnlocked($sources),
            'spend_summary'    => $this->buildSpendSummary($sources, $display),
        ]);
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
            $from = $currency ?: 'GBP';
            $value = ($from === $display) ? $gross : (float) Helpers::priceFormat($from, $gross, $display);
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

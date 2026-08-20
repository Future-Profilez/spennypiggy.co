<?php

namespace App\Services;

use App\Helpers;
use App\Models\AbandonedCheckout;
use App\Models\FinancialTransaction;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Services\Ledger\LedgerRules;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Turns a creator's own sales history into things they can act on: who their
 * best supporters are, who is drifting away, and what to do about it.
 *
 * The dashboard already shows *what was earned*. This answers *what to do next*.
 *
 * Every supporter-facing suggestion is advisory only — the platform never
 * exposes a supporter's contact details to a creator, and the copy says so.
 */
class CreatorOpportunityService
{
    /**
     * Statuses that keep a row out of "has this creator ever sold one of these".
     *
     * ⚠️ DELIBERATELY LOOSER THAN THE MONEY GATE and used for nothing else. A
     * bank payment still settling means the creator DOES sell memberships, so
     * telling them to "offer a membership" would be wrong. Every figure that is
     * money goes through `LedgerRules::countedScope()` instead — see
     * `incomeQuery()`.
     */
    private const SOLD_EXCLUDED_STATUSES = ['disputed', 'refunded', 'review_hold', 'pending', 'failed'];

    /** Spend (GBP, lifetime) at which a supporter is worth a personal thank-you. */
    private const HIGH_VALUE_GBP = 250.0;

    /** Lifetime spend (GBP) that marks a supporter as "Platinum" — a money tier,
     *  matching the client's Platinum concept, NOT the engagement Level. */
    private const PLATINUM_SPEND_GBP = 500.0;

    /** Days of silence before an established supporter counts as at risk. */
    private const AT_RISK_DAYS = 30;

    /** Last purchase this many days ago = "cooling" — drifting but not yet lost. */
    private const COOLING_DAYS = 30;

    /** Engagement-Level score cut-offs (mirror VipScoreService::TIERS). */
    private const LEVEL5_MIN = 90;

    private const LEVEL4_MIN = 70;

    private const LEVEL3_MIN = 50;

    /**
     * 🚨 TWO DIFFERENT NUMBERS, AND THIS SCREEN NEEDS BOTH.
     *
     * `EARNED_EXPR` is `LedgerRules::creatorGross()` — net + VAT, what the sale is
     * worth to the CREATOR. That is what "revenue by feature" means.
     *
     * `SPEND_EXPR` is `LedgerRules::buyerPaid()` — what the SUPPORTER was charged.
     * That is what "lifetime spend" means, and it is the figure on the
     * supporter's own bank statement. This screen used to label the creator's
     * gross as a supporter's "spend", which understates every top-supporter row
     * by the whole fee stack and disagrees with the supporter's own Purchase Hub.
     *
     * Neither is retyped here — both come from `LedgerRules`, so the SQL a total
     * is built from and the PHP a single row is read with cannot drift.
     */
    private const EARNED_EXPR = LedgerRules::CREATOR_GROSS_SQL;

    private const SPEND_EXPR = LedgerRules::BUYER_PAID_SQL;

    /**
     * 🚨 ROW 8 OF THE BRIEF, VERBATIM, AND IT IS A PRIVACY CONTROL — not a nicety.
     *
     * The platform never hands a creator a supporter's email or any other contact
     * detail (supporter privacy: display name or Anonymous, amount, country). So
     * every action that says "contact this person" has to say HOW, and the answer
     * is the creator's own audience, not ours. Without this line the obvious next
     * question is "how?", and the obvious wrong answer is "show me their email".
     *
     * One constant, so the wording cannot drift between the five actions that
     * carry it. Transcribed word for word from the Developer Master Plan,
     * 19 Aug 2026, §C row 8.
     */
    public const SOCIAL_CHANNELS_PROMPT = 'Consider contacting this supporter through your social channels if appropriate.';

    /** VIP lookups are a query each, so only the top slice gets enriched. */
    private const VIP_ENRICH_LIMIT = 10;

    /** How far back the abandoned-checkout panel looks. */
    private const ABANDONED_WINDOW_DAYS = 30;

    /** Rows listed individually under the abandoned-checkout headline figures. */
    private const ABANDONED_LIST_LIMIT = 8;

    /** Listings examined per type for the performance panel. Only 5 a side are shown. */
    private const LISTING_SCAN_LIMIT = 60;

    public function __construct(private VipScoreService $vip) {}

    /**
     * Base income-ledger query.
     *
     * 🚨 THE GATE IS `LedgerRules::countedScope()`, NOT A LOCAL STATUS LIST. This
     * method used to carry its own `whereNotIn(status, [...])`, which admitted
     * `processing` rows (bank money that has not settled) and applied no
     * fulfilment gate at all — so the Opportunity Centre reported a bigger pot of
     * money than the earnings dashboard beside it and than the payout run that
     * actually pays. One ledger, four surfaces; this is the fourth.
     */
    private function incomeQuery(User $creator)
    {
        return LedgerRules::countedScope(
            FinancialTransaction::query()
                ->where('user_id', $creator->id)
                ->where('type', 'income')
        );
    }

    /** Convert a minor-unit-free amount between currencies (same-currency = no-op). */
    private function convert(float $amount, ?string $from, string $to): float
    {
        $from = strtoupper($from ?: 'GBP');

        return $from === $to ? $amount : (float) Helpers::priceFormat($from, $amount, $to);
    }

    /** Format an amount in the creator's display currency for alert/action copy. */
    private function fmtMoney(float $amount, string $currency): string
    {
        return ($currency === 'GBP' ? '£' : '').number_format($amount, 2).($currency !== 'GBP' ? ' '.$currency : '');
    }

    /** Everything the Opportunity Centre renders, in one call. */
    public function for(User $creator, string $currency = 'GBP'): array
    {
        $supporters = $this->supporters($creator, $currency);
        $retention = $this->retention($creator);
        $alerts = $this->alerts($creator, $supporters, $retention, $currency);

        return [
            'currency' => $currency,
            'supporters' => $supporters->take(self::VIP_ENRICH_LIMIT)->values()->all(),
            'tiers' => $this->tierDistribution($supporters),
            'revenue_by_type' => $this->revenueByType($creator, $currency),
            'retention' => $retention,
            'alerts' => $alerts,
            'abandoned' => $this->abandonedCheckouts($creator, $currency),
            'listings' => $this->listingPerformance($creator),
            'actions' => $this->suggestedActions($creator, $supporters, $retention, $currency),
            'totals' => [
                'supporters' => $supporters->count(),
                // What supporters have PAID (LedgerRules::buyerPaid) …
                'lifetime_value' => round((float) $supporters->sum('lifetime_spent'), 2),
                'monthly_value' => round((float) $supporters->sum('monthly_spent'), 2),
                // … and what the creator KEPT on the same purchases
                // (LedgerRules::creatorGross). Reported side by side rather than
                // as one blended figure: a single number here would have to be
                // labelled either "spent" or "earned" and would be wrong for the
                // other reading, which is the confusion this pair removes.
                'lifetime_earned' => round((float) $supporters->sum('lifetime_earned'), 2),
                'average_supporter_value' => $supporters->isEmpty()
                    ? 0.0
                    : round((float) $supporters->sum('lifetime_spent') / $supporters->count(), 2),
            ],
        ];
    }

    /**
     * Checkouts opened against this creator's listings and never completed.
     *
     * The only demand-side signal the creator gets: someone wanted this, reached the
     * payment screen, and stopped. A listing that collects abandonments is usually
     * priced wrong or described badly — that is actionable in a way "you earned £X"
     * is not.
     *
     * ⚠️ **No supporter identity leaves this method.** Not the email, not a name, not
     * a user id — the platform never hands a creator a supporter's contact details,
     * and an abandoned checkout is a weaker relationship than a completed purchase,
     * not a stronger one. Counts, amounts and the listing only.
     */
    public function abandonedCheckouts(User $creator, string $currency = 'GBP'): array
    {
        $since = now()->subDays(self::ABANDONED_WINDOW_DAYS);

        $rows = AbandonedCheckout::query()
            ->where('creator_id', $creator->id)
            ->where('created_at', '>=', $since)
            ->whereNull('recovered_at')
            // Anything still open is either in flight or waiting on its reminder;
            // 'expired' and 'unrecoverable' are genuinely lost. Both count as
            // "did not buy". A row closed 'paid' is excluded by recovered_at.
            ->orderByDesc('created_at')
            ->get(['id', 'product_type', 'item_id', 'amount_minor', 'currency', 'created_at', 'reminder_count']);

        $recovered = AbandonedCheckout::where('creator_id', $creator->id)
            ->where('created_at', '>=', $since)
            ->whereNotNull('recovered_at')
            ->count();

        $value = 0.0;
        $items = [];

        foreach ($rows as $row) {
            $from = strtoupper($row->currency ?: 'GBP');
            $amount = (float) $row->amount_minor / 100;
            $converted = $from === $currency ? $amount : (float) Helpers::priceFormat($from, $amount, $currency);

            $value += $converted;

            if (count($items) < self::ABANDONED_LIST_LIMIT) {
                $items[] = [
                    'id' => $row->id,
                    'type' => $row->product_type,
                    'label' => AbandonedCheckoutService::moduleLabel($row->product_type),
                    'title' => $this->abandonedItemTitle($row),
                    'amount' => round($converted, 2),
                    'reminded' => (int) $row->reminder_count > 0,
                    'when' => optional($row->created_at)->toDateTimeString(),
                ];
            }
        }

        $total = $rows->count() + $recovered;

        return [
            'window_days' => self::ABANDONED_WINDOW_DAYS,
            'count' => $rows->count(),
            'value' => round($value, 2),
            'recovered' => $recovered,
            // Share of started checkouts that went on to complete. Null rather than 0
            // when nothing was started — "no data" and "nobody bought" are different.
            'recovery_rate' => $total > 0 ? round(($recovered / $total) * 100, 1) : null,
        ] + ['items' => $items];
    }

    /**
     * Which listings are working, and which are not — ranked.
     *
     * The per-item line on the shop dashboard answers "how is THIS one doing". This
     * answers the question that only appears when you look at everything at once:
     * which listing deserves more attention, and which one is quietly doing nothing.
     * A creator comparing eight cards by eye will not spot it.
     *
     * Two lists, because the two ends need opposite actions:
     *  - **working** — worth more of the creator's promotion
     *  - **stuck** — seen and not bought, or not seen at all; each with its own fix
     */
    public function listingPerformance(User $creator): array
    {
        $funnels = app(ItemFunnelService::class);

        $rows = [];

        foreach ([['shop', Shop::class, 'name'], ['task', Task::class, 'title']] as [$type, $model, $titleColumn]) {
            // ⚠️ Capped. Only ten rows are ever rendered, and without a limit a creator
            // with a large catalogue pulled every listing and computed a full funnel
            // for each — five queries per type over hundreds of rows — to then slice to
            // five. Newest first, because a listing nobody has touched in years is not
            // what this panel is for.
            $query = $model::query()->where($type === 'shop' ? 'user_id' : 'creator_id', $creator->id);

            if ($type === 'shop') {
                $query->where('approved', 1)->where('status', 1)->where('is_suspended', 0);
            } else {
                $query->where('is_approved', 1)->where('is_suspended', 0);
            }

            $items = $query->select('id', $titleColumn)
                ->latest('id')
                ->limit(self::LISTING_SCAN_LIMIT)
                ->get();

            if ($items->isEmpty()) {
                continue;
            }

            $data = $funnels->forItems($type, $items->pluck('id')->all());

            foreach ($items as $item) {
                $funnel = $data[$item->id] ?? null;

                if (! $funnel) {
                    continue;
                }

                $rows[] = [
                    'type' => $type,
                    'id' => $item->id,
                    'title' => (string) $item->{$titleColumn},
                    'viewers' => $funnel['viewers'],
                    'started' => $funnel['started'],
                    'sold' => $funnel['sold'],
                    'view_state' => $funnel['view_state'],
                    'view_to_sale' => $funnel['view_to_sale'],
                    // Names the problem, so the panel does not make the creator work it
                    // out from three numbers.
                    'diagnosis' => $this->listingDiagnosis($funnel),
                ];
            }
        }

        $working = array_values(array_filter($rows, fn ($r) => $r['sold'] > 0));
        usort($working, fn ($a, $b) => $b['sold'] <=> $a['sold']);

        // Only listings we can actually say something about. A listing with no sales
        // AND no view data is not "stuck" — it is unmeasured, and telling a creator to
        // fix it would be guessing.
        $stuck = array_values(array_filter(
            $rows,
            fn ($r) => $r['sold'] === 0 && $r['view_state'] !== 'unknown'
        ));
        usort($stuck, fn ($a, $b) => $b['viewers'] <=> $a['viewers']);

        return [
            'window_days' => ItemFunnelService::WINDOW_DAYS,
            'working' => array_slice($working, 0, 5),
            'stuck' => array_slice($stuck, 0, 5),
            'total' => count($rows),
        ];
    }

    /** One sentence naming what is wrong with a listing, or what is right. */
    private function listingDiagnosis(array $funnel): string
    {
        if ($funnel['sold'] > 0) {
            return 'Selling';
        }

        if ($funnel['view_state'] === 'none') {
            return 'Nobody is finding it — share the link';
        }

        if ($funnel['started'] > 0) {
            return 'Reached checkout and stopped — check the total at payment';
        }

        if (($funnel['viewers'] ?? 0) >= 10) {
            return 'Seen but not clicked through — usually price or description';
        }

        return 'Not enough traffic yet to tell';
    }

    /** Listing name behind an abandoned checkout, or null when it was a basket. */
    private function abandonedItemTitle(AbandonedCheckout $row): ?string
    {
        try {
            $item = app(AbandonedCheckoutService::class)->itemFor($row);

            if (! $item) {
                return null;
            }

            foreach (['wishname', 'name', 'title'] as $column) {
                $value = trim((string) ($item->{$column} ?? ''));

                if ($value !== '') {
                    return $value;
                }
            }

            return null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * How the creator's supporters spread across the platform engagement Levels, over
     * ALL of them (not just the displayed slice) — one batched lookup, so the
     * "tier mix" is honest rather than a sample of the top few.
     */
    private function tierDistribution($supporters): array
    {
        // Level list (label/icon/colour) read straight from VipScoreService — the
        // single source — so this bar can never drift from the badges it mirrors.
        $levels = VipScoreService::levels();
        $counts = array_fill_keys(array_column($levels, 'level'), 0);

        // Counted from the already-enriched supporter set — every supporter now
        // carries its engagement Level, so no second VIP lookup is needed.
        foreach ($supporters as $row) {
            $level = $row['vip']['level'] ?? null;
            if (isset($counts[$level])) {
                $counts[$level]++;
            }
        }

        return collect($levels)
            ->map(fn ($t) => [
                'level' => $t['level'],
                'count' => $counts[$t['level']],
                'color' => $t['color'],
                'icon' => $t['icon'],
            ])
            ->values()
            ->all();
    }

    /**
     * Where the money comes from, split by feature — Memberships, Bills, Wishes,
     * Tasks, Shop, Piggy Pot, Tips. Grouped from the income ledger by source_type,
     * summed net + VAT, converted per currency (a raw cross-currency SUM would add
     * pounds to yen). Every feature is returned even at zero, so a creator can see
     * what they are NOT selling — that is itself an opportunity.
     */
    public function revenueByType(User $creator, string $currency = 'GBP'): array
    {
        /*
         * class basename → [display label, colour, icon, in-product name].
         *
         * The labels are the client's own feature names from the 19 Aug Developer
         * Master Plan (row 2), which asks for "current feature names in the UI;
         * internal keys can keep old names" — so the source_type keys are
         * untouched and only what a creator reads has changed.
         *
         * ⚠️ The fourth element is the name in the creator's OWN NAVIGATION, and it
         * is not decoration. A creator whose menu says "Bills" and whose earnings
         * screen says "Recurring Content" has to work out that those are the same
         * product; the sub-label removes that step. Where the two agree it is null
         * and nothing extra renders.
         *
         * 🚨 `TipGoalsPayment` stays "Piggy Bank". The brief's row 2 lists this
         * feature as "Tips", and tip/donation vocabulary is banned outright on
         * every user-facing surface by the Stripe content-first compliance rule —
         * a standing prohibition beats a row label, exactly as it did for the A3
         * ad page. `CreatorOpportunityTest` pins it (`assertArrayNotHasKey('Tips')`).
         */
        $map = [
            'MembershipPayment' => ['Memberships', '#8b5cf6', '⭐', null],
            'BillPayment' => ['Recurring Content', '#3b82f6', '📄', 'Bills'],
            'StripePaymentItems' => ['Sell Exclusive Content', '#05EFB8', '🛒', 'Wishlist'],
            'WishItemSubscription' => ['Sell Exclusive Content', '#05EFB8', '🛒', 'Wishlist'],
            'TaskPurchase' => ['Paid Tasks', '#f59e0b', '✅', null],
            'ShopPayment' => ['Shop', '#f97316', '🛍️', 'Sell Something'],
            'PiggyPotContribution' => ['Content Goals', '#ec4899', '🐷', 'Piggy Pots'],
            'TipGoalsPayment' => ['Piggy Bank', '#FF007F', '🔓', null],
        ];

        // Seed every feature at zero, in display order.
        $totals = [];
        foreach ($map as [$label, $color, $icon, $product]) {
            $totals[$label] ??= [
                'label' => $label,
                'product' => $product,
                'total' => 0.0,
                'count' => 0,
                'color' => $color,
                'icon' => $icon,
            ];
        }

        $rows = $this->incomeQuery($creator)
            ->select(
                'source_type',
                'currency',
                DB::raw('SUM('.self::EARNED_EXPR.') as total'),
                DB::raw('COUNT(*) as cnt'),
            )
            ->groupBy('source_type', 'currency')
            ->get();

        foreach ($rows as $row) {
            $class = class_basename($row->source_type);
            if (! isset($map[$class])) {
                continue;
            }

            $label = $map[$class][0];
            $converted = $this->convert((float) $row->total, $row->currency, $currency);

            $totals[$label]['total'] += $converted;
            $totals[$label]['count'] += (int) $row->cnt;
        }

        return collect($totals)
            ->map(fn ($t) => [
                'label' => $t['label'],
                'product' => $t['product'],
                'total' => round($t['total'], 2),
                'count' => $t['count'],
                'color' => $t['color'],
                'icon' => $t['icon'],
            ])
            ->values()
            ->all();
    }

    /**
     * Per-supporter lifetime picture: total spent, purchase count, first and
     * last purchase, average order value — and an engagement Level for the top few.
     */
    public function supporters(User $creator, string $currency = 'GBP')
    {
        // Boundary for "spend this calendar month", used alongside the lifetime total.
        $monthStart = now()->startOfMonth()->toDateTimeString();

        $rows = $this->incomeQuery($creator)
            ->whereNotNull('supporter_id')
            ->select(
                'supporter_id',
                'currency',
                DB::raw('SUM('.self::SPEND_EXPR.') as spend_total'),
                DB::raw('SUM('.self::EARNED_EXPR.') as earned_total'),
                DB::raw('COUNT(*) as purchases'),
                DB::raw('MIN(transaction_date) as first_purchase'),
                DB::raw('MAX(transaction_date) as last_purchase'),
            )
            ->selectRaw(
                'SUM(CASE WHEN transaction_date >= ? THEN '.self::SPEND_EXPR.' ELSE 0 END) as month_total',
                [$monthStart]
            )
            ->groupBy('supporter_id', 'currency')
            ->get();

        $bySupporter = [];

        foreach ($rows as $row) {
            $id = (int) $row->supporter_id;
            $converted = $this->convert((float) $row->spend_total, $row->currency, $currency);
            $earnedConverted = $this->convert((float) $row->earned_total, $row->currency, $currency);
            $monthConverted = $this->convert((float) $row->month_total, $row->currency, $currency);

            if (! isset($bySupporter[$id])) {
                $bySupporter[$id] = [
                    'supporter_id' => $id,
                    'lifetime_spent' => 0.0,
                    'lifetime_earned' => 0.0,
                    'monthly_spent' => 0.0,
                    'purchases' => 0,
                    'first_purchase' => $row->first_purchase,
                    'last_purchase' => $row->last_purchase,
                ];
            }

            $bySupporter[$id]['lifetime_spent'] += $converted;
            $bySupporter[$id]['lifetime_earned'] += $earnedConverted;
            $bySupporter[$id]['monthly_spent'] += $monthConverted;
            $bySupporter[$id]['purchases'] += (int) $row->purchases;

            if ($row->first_purchase < $bySupporter[$id]['first_purchase']) {
                $bySupporter[$id]['first_purchase'] = $row->first_purchase;
            }

            if ($row->last_purchase > $bySupporter[$id]['last_purchase']) {
                $bySupporter[$id]['last_purchase'] = $row->last_purchase;
            }
        }

        $collection = collect($bySupporter)
            ->sortByDesc('lifetime_spent')
            ->values();

        // Names/avatars only for the slice we actually display — loading every
        // supporter's user row would be wasteful, and only the top rows render.
        $topIds = $collection->take(self::VIP_ENRICH_LIMIT)->pluck('supporter_id')->all();
        // ⚠️ `country` is here because supporter privacy on this screen is exactly
        // three things — display name (or Anonymous), amount, country — and the
        // brief names all three. It is NOT a licence to widen the select: an
        // email address must never reach a creator, which is what row 8's
        // social-channels prompt exists to answer instead.
        $users = User::whereIn('id', $topIds)->get(['id', 'name', 'username', 'avatar', 'country'])->keyBy('id');

        // Engagement Level for EVERY supporter, in ONE batched call (six source
        // queries total, regardless of count — not per supporter). Enriching all
        // of them lets the tier mix and the Platinum/VIP alerts see the whole set,
        // not just the top ten by spend — a high-engagement Platinum can rank low
        // on lifetime spend and would otherwise be missed.
        $badges = $this->vip->badgesFor($collection->pluck('supporter_id')->all());

        return $collection->map(function ($row, $index) use ($users, $currency, $badges) {
            $user = $users->get($row['supporter_id']);
            $last = $row['last_purchase'] ? Carbon::parse($row['last_purchase']) : null;

            $row['name'] = $user->name ?? null;
            $row['username'] = $user->username ?? null;
            $row['avatar'] = $user->avatar ?? null;
            $row['country'] = $user->country ?? null;
            $row['currency'] = $currency;
            // 🚨 `lifetime_spent` is what the SUPPORTER was charged; `lifetime_earned`
            // is what the creator kept on those same purchases. The screen shows the
            // first as "spent with you" and the second as "you earned" — labelling
            // either with the other's word is the confusion `LedgerRules` exists to
            // stop, and the two figures differ by the whole fee stack.
            $row['lifetime_spent'] = round($row['lifetime_spent'], 2);
            $row['lifetime_earned'] = round($row['lifetime_earned'], 2);
            $row['monthly_spent'] = round($row['monthly_spent'], 2);
            $row['average_order_value'] = $row['purchases'] > 0
                ? round($row['lifetime_spent'] / $row['purchases'], 2)
                : 0.0;
            $row['days_since_last_purchase'] = $last ? (int) $last->diffInDays(now()) : null;
            $row['at_risk'] = $row['days_since_last_purchase'] !== null
                && $row['days_since_last_purchase'] >= self::AT_RISK_DAYS
                && $row['purchases'] > 1;

            $row['vip'] = $badges[$row['supporter_id']] ?? null;

            return $row;
        });
    }

    /**
     * Supporter movement over the last 30 days.
     *
     * - new: first ever purchase landed in the window
     * - returning: bought in the window and had bought before it
     * - reactivated: returning, but their previous purchase was >60 days before
     * - cooling: last purchase 30–60 days ago — drifting, not yet lost
     * - lost: silent for 60+ days
     */
    public function retention(User $creator): array
    {
        $windowStart = now()->subDays(self::COOLING_DAYS);
        $dormantCutoff = now()->subDays(60);

        $rows = $this->incomeQuery($creator)
            ->whereNotNull('supporter_id')
            ->select(
                'supporter_id',
                DB::raw('MIN(transaction_date) as first_purchase'),
                DB::raw('MAX(transaction_date) as last_purchase'),
            )
            ->groupBy('supporter_id')
            ->get();

        $new = $returning = $reactivated = $cooling = $lost = 0;
        $reactivatedIds = [];

        foreach ($rows as $row) {
            $first = Carbon::parse($row->first_purchase);
            $last = Carbon::parse($row->last_purchase);

            if ($last->lt($windowStart)) {
                // Silent 60+ days = lost; 30–60 days = cooling (still winnable).
                if ($last->lt($dormantCutoff)) {
                    $lost++;
                } else {
                    $cooling++;
                }

                continue;
            }

            if ($first->gte($windowStart)) {
                $new++;

                continue;
            }

            $returning++;

            // Bought again after a long silence — worth treating differently
            // from a steady regular.
            $previous = $this->incomeQuery($creator)
                ->where('supporter_id', $row->supporter_id)
                ->where('transaction_date', '<', $windowStart)
                ->max('transaction_date');

            if ($previous && Carbon::parse($previous)->lt($dormantCutoff)) {
                $reactivated++;
                $reactivatedIds[] = (int) $row->supporter_id;
            }
        }

        return [
            'new' => $new,
            'returning' => $returning,
            'reactivated' => $reactivated,
            'cooling' => $cooling,
            // Who they are, so alerts can single out the valuable ones. The
            // page already lists these supporters, so no new exposure.
            'reactivated_ids' => $reactivatedIds,
            'lost' => $lost,
            'window_days' => self::COOLING_DAYS,
        ];
    }

    /** A single purchase this big is an event in itself, GBP-equivalent. */
    private const BIG_PURCHASE_GBP = 100.0;

    /** Notable changes worth surfacing at the top of the page. */
    public function alerts(User $creator, $supporters, array $retention, string $currency = 'GBP'): array
    {
        $alerts = [];
        $windowStart = now()->subDays($retention['window_days'] ?? self::COOLING_DAYS);

        // Thresholds are defined in GBP but supporter spend is in the display
        // currency — convert once so a non-GBP creator's alerts don't misfire.
        $highValue = $this->convert(self::HIGH_VALUE_GBP, 'GBP', $currency);
        $platinum = $this->convert(self::PLATINUM_SPEND_GBP, 'GBP', $currency);

        // Level 4+ (engagement score ≥ 70) — filter on score, not the label, so a
        // future rename of the levels can't silently break these alerts.
        $topTier = $supporters->filter(
            fn ($s) => (float) ($s['vip']['score'] ?? 0) >= self::LEVEL4_MIN
        );

        if ($topTier->isNotEmpty()) {
            $alerts[] = [
                'key' => 'top_tier_supporters',
                'severity' => 'good',
                'title' => 'You have top-tier supporters',
                'detail' => $topTier->count().' of your supporters are Level 4 or 5 on the platform.',
            ];
        }

        $atRisk = $supporters->where('at_risk', true);

        if ($atRisk->isNotEmpty()) {
            $alerts[] = [
                'key' => 'supporters_at_risk',
                'severity' => 'warning',
                'title' => 'Regular supporters have gone quiet',
                'detail' => $atRisk->count().' supporter(s) who used to buy regularly have not bought in over 30 days.',
            ];
        }

        if ($retention['new'] > 0) {
            $alerts[] = [
                'key' => 'new_supporters',
                'severity' => 'good',
                'title' => 'New supporters this month',
                'detail' => $retention['new'].' supporter(s) bought from you for the first time.',
            ];
        }

        // New whale: someone whose FIRST purchase was inside the window and who
        // has already passed the high-value line. They arrived spending big —
        // the moment to make them feel seen.
        $newWhales = $supporters->filter(
            fn ($s) => ($s['lifetime_spent'] ?? 0) >= $highValue
                && ! empty($s['first_purchase'])
                && Carbon::parse($s['first_purchase'])->gte($windowStart)
        );

        if ($newWhales->isNotEmpty()) {
            $alerts[] = [
                'key' => 'new_whale',
                'severity' => 'good',
                'title' => 'A big supporter arrived this month',
                'detail' => $newWhales->count().' new supporter(s) have already passed '
                    .$this->fmtMoney($highValue, $currency).' in purchases within their first month.',
            ];
        }

        // New Platinum: a high-SPEND supporter (client's Platinum is a money tier,
        // not the engagement Level) whose first purchase landed in the window.
        $newPlatinum = $supporters->filter(
            fn ($s) => ($s['lifetime_spent'] ?? 0) >= $platinum
                && ! empty($s['first_purchase'])
                && Carbon::parse($s['first_purchase'])->gte($windowStart)
        );

        if ($newPlatinum->isNotEmpty()) {
            $alerts[] = [
                'key' => 'new_platinum',
                'severity' => 'good',
                'title' => 'A new Platinum supporter',
                'detail' => $newPlatinum->count().' supporter(s) have already spent over '
                    .$this->fmtMoney($platinum, $currency).' with you within their first month.',
            ];
        }

        // Returning whale: a high-value supporter who came back after 60+ days
        // of silence. Different from a steady regular — they nearly left.
        $reactivatedIds = $retention['reactivated_ids'] ?? [];

        $returningWhales = $supporters->filter(
            fn ($s) => in_array((int) $s['supporter_id'], $reactivatedIds, true)
                && ($s['lifetime_spent'] ?? 0) >= $highValue
        );

        if ($returningWhales->isNotEmpty()) {
            $alerts[] = [
                'key' => 'returning_whale',
                'severity' => 'good',
                'title' => 'A big supporter came back',
                'detail' => $returningWhales->count().' high-value supporter(s) returned after two months or more away.',
            ];
        }

        // High-value purchase: one single order past the line, inside the window.
        $big = $this->biggestRecentPurchaseGbp($creator, $windowStart);

        if ($big !== null && $big >= self::BIG_PURCHASE_GBP) {
            $alerts[] = [
                'key' => 'high_value_purchase',
                'severity' => 'good',
                'title' => 'A high-value purchase landed',
                'detail' => 'Your biggest single purchase in the last '.($retention['window_days'] ?? self::COOLING_DAYS)
                    .' days was '.$this->fmtMoney($this->convert($big, 'GBP', $currency), $currency).'.',
            ];
        }

        return $alerts;
    }

    /**
     * The largest single purchase in the window, converted to GBP.
     *
     * Max per currency first, then converted — a raw SQL MAX across currencies
     * would happily call 1,000 JPY bigger than 100 GBP.
     */
    private function biggestRecentPurchaseGbp(User $creator, $windowStart): ?float
    {
        $rows = $this->incomeQuery($creator)
            ->whereNotNull('supporter_id')
            ->where('transaction_date', '>=', $windowStart)
            ->select('currency', DB::raw('MAX('.self::SPEND_EXPR.') as biggest'))
            ->groupBy('currency')
            ->get();

        $best = null;

        foreach ($rows as $row) {
            $gbp = $this->convert((float) $row->biggest, $row->currency, 'GBP');

            if ($best === null || $gbp > $best) {
                $best = $gbp;
            }
        }

        return $best;
    }

    /**
     * Concrete next steps, ordered by value.
     *
     * Deliberately advisory: the platform does not hand a creator a supporter's
     * contact details, so anything outbound is framed as "through your own
     * channels, if appropriate".
     */
    public function suggestedActions(User $creator, $supporters, array $retention, string $currency = 'GBP'): array
    {
        $actions = [];

        // GBP thresholds vs display-currency spend — convert once (see alerts()).
        $highValueThreshold = $this->convert(self::HIGH_VALUE_GBP, 'GBP', $currency);
        $platinumThreshold = $this->convert(self::PLATINUM_SPEND_GBP, 'GBP', $currency);

        $highValue = $supporters->firstWhere(
            fn ($s) => $s['lifetime_spent'] >= $highValueThreshold && ! $s['at_risk']
        );

        if ($highValue) {
            $actions[] = [
                'key' => 'thank_high_value',
                'title' => 'Thank your top supporter',
                'detail' => ($highValue['name'] ?? 'A supporter').' has spent '
                    .$this->fmtMoney((float) $highValue['lifetime_spent'], $currency)
                    .' with you across '.$highValue['purchases'].' purchase(s). A personal thank-you goes a long way.',
                'hint' => self::SOCIAL_CHANNELS_PROMPT,
            ];
        }

        $atRisk = $supporters->where('at_risk', true)->first();

        if ($atRisk) {
            $actions[] = [
                'key' => 'win_back',
                'title' => 'Win back a lapsed supporter',
                'detail' => ($atRisk['name'] ?? 'A supporter').' last bought '
                    .$atRisk['days_since_last_purchase'].' days ago after '.$atRisk['purchases'].' purchase(s).',
                'hint' => 'Posting new content is the most reliable way to bring regulars back.',
            ];
        }

        if ($retention['new'] > 0) {
            $actions[] = [
                'key' => 'welcome_new',
                'title' => 'Welcome your new supporters',
                'detail' => $retention['new'].' supporter(s) bought from you for the first time this month.',
                'hint' => 'First-time buyers who hear from a creator are far more likely to buy again.',
            ];
        }

        // Contact a Platinum supporter — a high-SPEND supporter (client's Platinum
        // is a money tier). Called out separately from a general follow-up.
        $platinumSupporter = $supporters->first(
            fn ($s) => ($s['lifetime_spent'] ?? 0) >= $platinumThreshold
        );

        if ($platinumSupporter) {
            $actions[] = [
                'key' => 'contact_platinum',
                'title' => 'Contact your Platinum supporter',
                'detail' => ($platinumSupporter['name'] ?? 'A supporter').' has spent '
                    .$this->fmtMoney((float) $platinumSupporter['lifetime_spent'], $currency)
                    .' with you — one of your most valuable supporters.',
                'hint' => self::SOCIAL_CHANNELS_PROMPT,
            ];
        }

        // Follow up with an engaged VIP (Level 3, score 50–69) who is still active
        // — a nudge keeps them climbing toward the top levels.
        $goldSupporter = $supporters->first(
            fn ($s) => (float) ($s['vip']['score'] ?? 0) >= self::LEVEL3_MIN
                && (float) ($s['vip']['score'] ?? 0) < self::LEVEL4_MIN
                && ! $s['at_risk']
        );

        if ($goldSupporter) {
            $actions[] = [
                'key' => 'follow_up_vip',
                'title' => 'Follow up with a VIP',
                'detail' => ($goldSupporter['name'] ?? 'A supporter').' is a Level 3 supporter across '
                    .$goldSupporter['purchases'].' purchase(s).',
                'hint' => self::SOCIAL_CHANNELS_PROMPT,
            ];
        }

        // Product mix: what to promote (already selling) vs what to start (never
        // sold). $sold drives both branches, so it is fetched once.
        $sold = $this->soldProductTypes($creator);

        // Encourage upgrades where a membership already exists — distinct from
        // "offer a membership" below, which is for creators with none.
        if (in_array('MembershipPayment', $sold, true)) {
            $actions[] = [
                'key' => 'upgrade_membership',
                'title' => 'Encourage a membership upgrade',
                'detail' => 'You already have members. A higher tier with more content is the simplest way to lift recurring income.',
                'hint' => 'Add a premium tier, then tell existing members what they unlock by upgrading.',
            ];
        }

        // Promote an existing wishlist — distinct from "add a wishlist item"
        // below, which is for creators who have never published one.
        if (WishItem::where('user_id', $creator->id)->where('is_approved', 1)->exists()) {
            $actions[] = [
                'key' => 'promote_wishlist',
                'title' => 'Promote your wishlist',
                'detail' => 'You have wishlist items published. Sharing them turns interest into a sale.',
                'hint' => 'Point supporters at your wishlist through your own channels, if appropriate.',
            ];
        }

        // Nudge the creator toward products they haven't published, because an
        // empty product type is revenue that simply cannot happen.
        foreach ($this->missingProductTypes($sold) as $type) {
            $actions[] = [
                'key' => 'publish_'.$type['key'],
                'title' => $type['title'],
                'detail' => $type['detail'],
                'hint' => $type['hint'],
            ];
        }

        return $actions;
    }

    /** Distinct product types (class basenames) this creator has ever sold. */
    private function soldProductTypes(User $creator): array
    {
        return FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->whereNotIn('status', self::SOLD_EXCLUDED_STATUSES)
            ->distinct()
            ->pluck('source_type')
            ->map(fn ($t) => class_basename($t))
            ->all();
    }

    /** Product types this creator has never sold — each is unrealised revenue. */
    private function missingProductTypes(array $sold): array
    {
        $suggestions = [];

        if (! in_array('MembershipPayment', $sold, true)) {
            $suggestions[] = [
                'key' => 'membership',
                'title' => 'Offer a membership',
                'detail' => 'You have not sold a membership yet. Recurring content turns one-off buyers into steady income.',
                'hint' => 'A membership needs at least one on-platform content benefit to publish.',
            ];
        }

        if (! in_array('StripePaymentItems', $sold, true)) {
            $suggestions[] = [
                'key' => 'wish',
                'title' => 'Add a wishlist item',
                'detail' => 'Wishlist items are the quickest one-off content sale to set up.',
                'hint' => 'Each item needs a content deliverable, not just a goal.',
            ];
        }

        return $suggestions;
    }
}

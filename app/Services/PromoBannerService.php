<?php

namespace App\Services;

use App\Models\CreatorBioLink;
use App\Models\FastStartBonusPayout;
use App\Models\GrowthBonusProfile;
use App\Models\User;
use App\Support\SubscriptionPlan;
use App\Support\VerifiedBadge;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

/**
 * Resolves the promo deck for one viewer.
 *
 * Definitions live in `config/promos.php`; everything that needs the database —
 * "has this creator sold yet", "do they already have a badge" — lives here, keyed
 * by the same array key. Split that way because the config file is cacheable and
 * this is not.
 *
 * 🚨 NOTHING ON THIS PATH MAY THROW. The deck is built inside
 * HandleInertiaRequests::share(), which runs on every single Inertia response —
 * a failure here would take down every page on the site to hide a marketing
 * card. Same house pattern as VisitTracker and the security observers: catch
 * \Throwable, log a warning, return an empty deck. A page with no promos is a
 * page; a page with an exception is not.
 */
class PromoBannerService
{
    /**
     * @return array{autoplay_ms:int, banners:array<int, array<string, mixed>>}
     */
    public function for(?User $user, array $context = []): array
    {
        try {
            $ttl = (int) config('promos.cache_ttl', 300);

            // ⚠️ The cache key carries the viewer AND the two context values the
            // deck branches on. Without them a creator who has just made their
            // first sale would keep being shown "free until your first sale" for
            // the rest of the TTL — off a key that says nothing changed.
            $key = 'promos:v1:'.($user?->id ?? 'guest')
                .':'.(int) ($context['has_ever_sold'] ?? 0)
                .':'.(int) ($context['is_creator'] ?? 0);

            $banners = $ttl > 0
                ? Cache::remember($key, $ttl, fn () => $this->resolve($user, $context))
                : $this->resolve($user, $context);

            return [
                'autoplay_ms' => (int) config('promos.autoplay_ms', 6000),
                'banners' => $banners,
            ];
        } catch (\Throwable $e) {
            Log::warning('Promo deck could not be built', [
                'user_id' => $user?->id,
                'error' => $e->getMessage(),
            ]);

            return ['autoplay_ms' => 6000, 'banners' => []];
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolve(?User $user, array $context): array
    {
        $role = $user ? (int) $user->role : null;
        $deck = [];

        foreach ((array) config('promos.banners', []) as $key => $promo) {
            if (! $this->audienceMatches($promo['audience'] ?? 'both', $role)) {
                continue;
            }

            // A logged-out visitor is shown the whole deck. Eligibility answers
            // "have you already done this" — a question with no meaning for
            // someone without an account, and these cards are advertising the
            // features TO them.
            if ($user && ! $this->isEligible($key, $user, $context)) {
                continue;
            }

            if (($card = $this->card($key, $promo, $user)) !== null) {
                $deck[] = $card;
            }
        }

        foreach ((array) config('promos.announcements', []) as $key => $promo) {
            if (! $this->audienceMatches($promo['audience'] ?? 'both', $role)) {
                continue;
            }

            if (! $this->isLive($promo)) {
                continue;
            }

            if (($card = $this->card($key, $promo, $user)) !== null) {
                $deck[] = $card;
            }
        }

        // Highest priority first. The frontend still opens on a weighted-random
        // pick, but a sorted deck means swiping forward walks down the list
        // rather than wandering.
        usort($deck, fn ($a, $b) => $b['priority'] <=> $a['priority']);

        return $deck;
    }

    /**
     * Shapes one config entry into the payload the frontend renders.
     *
     * Returns null for a promo pointing at a route that does not exist, rather
     * than letting `route()` throw. A typo in a config key should cost one
     * missing card, not the whole page.
     */
    private function card(string $key, array $promo, ?User $user = null): ?array
    {
        $href = $this->hrefFor($key, $user);

        if ($href === null && ! empty($promo['route'])) {
            if (! Route::has($promo['route'])) {
                Log::warning('Promo points at an unknown route', [
                    'promo' => $key,
                    'route' => $promo['route'],
                ]);

                return null;
            }

            $href = route($promo['route']);
        }

        if ($href === null && empty($promo['action'])) {
            return null;
        }

        return [
            'key' => $key,
            'priority' => (int) ($promo['priority'] ?? 1),
            'ground' => $promo['ground'] ?? 'pink',
            'accent' => $promo['accent'] ?? 'pink',
            'layout' => $promo['layout'] ?? 'statement',
            'art' => $promo['art'] ?? 'speech',
            'eyebrow' => $promo['eyebrow'] ?? '',
            'headline' => $promo['headline'] ?? '',
            'body' => $promo['body'] ?? '',
            'cta' => $this->ctaFor($key, $user) ?? $promo['cta'] ?? 'Open',
            'href' => $href,
            'action' => $promo['action'] ?? null,
            'facts' => $this->facts($key),
        ];
    }

    /**
     * The lifetime sales a referred creator must reach before the referrer is paid.
     *
     * ✅ Config-backed since 23 Aug 2026 — `config('referral.qualifying_gmv')` is the ONE
     * definition, shared with the qualification short-cut in `Helpers`, the progress bar
     * on the referral page and both counting queries in `ReferAndEarnController`. It used
     * to be a private const mirroring a hardcoded `1000` in that controller: a promo
     * promising £50 at a threshold the payout query disagreed with is worse than a promo
     * that says nothing.
     */
    private function referralQualifyingGmv(): float
    {
        return (float) config('referral.qualifying_gmv', 1000);
    }

    /**
     * Fast Start's figures, including the one worked example the card shows.
     *
     * ⚠️ The example base is a round illustrative number, and the card labels it as one.
     * It is NOT a threshold, a target or a minimum — Fast Start has none. Everything
     * derived from it uses the live rate, so the example can never quote a percentage the
     * payout job does not pay.
     *
     * ⚠️ Under TIERED pricing the rate and the whole example are omitted: there are three
     * rates by bracket and no single one to work a sum from. The card reads the absence
     * and falls back to describing the mechanic in words.
     *
     * @return array<string, string|null>
     */
    private function fastStartFacts(): array
    {
        $tiered = (bool) config('fast_start_bonus.bonus.enable_tiered', false);
        $rate = (float) config('fast_start_bonus.bonus.flat_rate', 0.05);

        $facts = [
            'rate' => $tiered ? null : $this->percent($rate),
            'window' => (int) config('fast_start_bonus.bonus.window_days', 30).' days',
            'paid_after' => (int) config('fast_start_bonus.bonus.settlement_buffer_days', 7).' days',
        ];

        if (! $tiered) {
            $base = 1000.0;
            $facts['example_earned'] = '£'.number_format($base, 0);
            $facts['example_bonus'] = '£'.number_format($base * $rate, 0);
            $facts['example_total'] = '£'.number_format($base + ($base * $rate), 0);
        }

        return $facts;
    }

    /**
     * Growth Bonus figures, all read from `config/growth_bonus.php` — the same
     * ladder `GrowthBonusService` walks, so the card and the engine cannot
     * disagree about what the first step is or what the ceiling is.
     *
     * ⚠️ Returns an empty array when the ladder is empty or misconfigured, and
     * the card falls back to copy rather than printing "£0".
     *
     * @return array<string, string>
     */
    private function growthBonusFacts(): array
    {
        $ladder = (array) config('growth_bonus.ladder', []);

        if ($ladder === []) {
            return [];
        }

        $first = $ladder[0];
        $total = array_sum(array_column($ladder, 'amount'));

        return [
            'spend' => '£'.number_format((float) $first['gmv'], 0),
            'reward' => '£'.number_format((float) $first['amount'], 0),
            'total' => '£'.number_format((float) $total, 0),
            'window' => (int) config('growth_bonus.activation.window_days', 30).' days',
            'seats' => (string) (int) config('growth_bonus.limits.max_seats', 150),
            'steps' => (string) count($ladder),
        ];
    }

    private function percent(float $rate): string
    {
        return rtrim(rtrim(number_format($rate * 100, 1, '.', ''), '0'), '.').'%';
    }

    private function money(float $amount): string
    {
        $symbol = strtoupper((string) config('referral.currency', 'gbp')) === 'GBP' ? '£' : '';

        return $symbol.number_format($amount, 0);
    }

    /**
     * The real numbers a card puts on screen.
     *
     * 🚨 A FIGURE ON A PROMO CARD MUST COME FROM THE THING THAT ENFORCES IT, never
     * from the JSX. The first informative pass hardcoded "£6.99" as the creator
     * subscription price; the real default is `creator_subscription.price` = 8.99, so
     * the deck was quoting a price the platform does not charge, on the one card whose
     * entire subject is billing. Same reasoning as the founder figures: they are read
     * from `config/founder_bonus.php`, which is what `CheckFounderQualifications`
     * qualifies against, so the card and the job can never disagree.
     *
     * A key with no facts returns an empty array and its card falls back to copy.
     *
     * @return array<string, string>
     */
    private function facts(string $key): array
    {
        return match ($key) {
            'founder_bonus' => [
                'amount' => '£'.number_format(
                    (float) config('founder_bonus.qualification.min_first_30d_earnings', 2500),
                    0,
                ),
                'window' => (int) config('founder_bonus.qualification.qualification_period_days', 30).' days',
                'seats' => (string) (int) config('founder_bonus.limits.max_founder_seats', 150),
                // The bonus itself, not the threshold. `CheckFounderQualifications`
                // pays `calculateBonusAmount()` = earnings × this rate.
                'bonus_rate' => $this->percent((float) config('founder_bonus.bonus.bonus_percentage', 0.10)),
                'bonus_min' => '£'.number_format(
                    (float) config('founder_bonus.qualification.min_first_30d_earnings', 2500)
                        * (float) config('founder_bonus.bonus.bonus_percentage', 0.10),
                    0,
                ),
                'bonus_total' => '£'.number_format(
                    (float) config('founder_bonus.qualification.min_first_30d_earnings', 2500)
                        * (1 + (float) config('founder_bonus.bonus.bonus_percentage', 0.10)),
                    0,
                ),
            ],

            /*
             * ⚠️ The rate is omitted when TIERED mode is on — there is no single rate
             * to quote then (3% / 5% / 7% by bracket), and picking one would be wrong
             * for most creators. The card reads the absence and drops the figure.
             */
            /*
             * 🚨 THE WORKED EXAMPLE IS DERIVED FROM THE REAL RATE, NEVER TYPED.
             * "5% on top" answers nothing on its own — on top of what? — so the card
             * shows one worked sum instead. The base is illustrative and the card labels
             * it EXAMPLE; the bonus and the total are computed from the rate
             * `ProcessFastStartBonusPayouts` actually pays, so changing
             * `FAST_START_BONUS_RATE` moves every figure on the card with it.
             */
            'fast_start' => array_filter($this->fastStartFacts()),

            /*
             * The reward, and the lifetime GMV the referred creator has to sell
             * before it counts — both read from `config/referral.php`, which is
             * what the qualifying queries filter on.
             * 🚨 Quoting the reward without the threshold is the half of this offer
             * that gets a creator annoyed: they share the link, someone signs up, and
             * nothing arrives.
             */
            'refer_and_earn' => [
                'reward' => $this->money((float) config('referral.reward_amount', 50)),
                'threshold' => $this->money($this->referralQualifyingGmv()),
            ],

            'free_until_first_sale' => [
                'price' => SubscriptionPlan::formatted(),
                'currency' => SubscriptionPlan::currency(),
            ],

            /*
             * 🚨 THE FIRST RUNG AND THE TOTAL, BOTH DERIVED FROM THE LADDER
             * `GrowthBonusService` pays against — never typed. "Up to £1,000"
             * on its own is the same empty promise "5% on top" was: the card
             * shows the first step, because the first step is the one a creator
             * can act on today.
             *
             * ⚠️ `spend` is the GROSS customer-spend threshold, so the card
             * labels it as sales. Calling it earnings would overstate what a
             * creator keeps by the platform fee.
             */
            'growth_bonus' => $this->growthBonusFacts(),

            default => [],
        };
    }

    /**
     * A destination that depends on WHO is looking, overriding the config route.
     *
     * The link-in-bio promo is the case: a signed-in creator wants their own page —
     * the point of the promo is to see the thing they are being sold — while a
     * logged-out visitor has no page yet and wants the one that explains it. Sending
     * everyone to the editor put a visitor at a login wall and a creator two clicks
     * from their own link.
     *
     * ⚠️ Guarded on `Route::has` and on the username existing: a creator with no
     * username yet would otherwise produce a URL like `/bio` that resolves to nothing.
     */
    private function hrefFor(string $key, ?User $user): ?string
    {
        if ($key !== 'link_in_bio') {
            return null;
        }

        if ($user && filled($user->username) && Route::has('bio.show')) {
            return route('bio.show', ['username' => $user->username]);
        }

        return Route::has('creators.link-in-bio') ? route('creators.link-in-bio') : null;
    }

    /**
     * A label that has to match the destination `hrefFor()` chose.
     *
     * ⚠️ One label across two destinations is how a button starts lying: "Build my
     * page" sent a signed-in creator to a page they had already built, and a
     * logged-out visitor to an explainer rather than a builder. The label and the URL
     * are decided in the same place so they cannot drift.
     */
    private function ctaFor(string $key, ?User $user): ?string
    {
        if ($key !== 'link_in_bio') {
            return null;
        }

        return $user && filled($user->username) ? 'See my page' : 'How it works';
    }

    private function audienceMatches(string $audience, ?int $role): bool
    {
        if ($audience === 'both' || $role === null) {
            return true;
        }

        return $audience === ($role === 1 ? 'creator' : 'gifter');
    }

    private function isLive(array $promo): bool
    {
        $now = Carbon::now();

        if (! empty($promo['starts_at']) && $now->lt(Carbon::parse($promo['starts_at']))) {
            return false;
        }

        if (! empty($promo['ends_at']) && $now->gte(Carbon::parse($promo['ends_at']))) {
            return false;
        }

        return true;
    }

    /**
     * 🚨 Eligibility outranks priority. A creator who has already made their
     * first sale must never be shown "free until your first sale", however high
     * it sits in the deck — a promo that describes a state the viewer has left
     * is the slider telling them something untrue about their own account.
     *
     * A key with no case here is always eligible.
     */
    private function isEligible(string $key, User $user, array $context): bool
    {
        $isCreator = (int) $user->role === 1;

        return match ($key) {
            'founder_bonus' => $isCreator && $this->founderWindowOpen($user),

            'fast_start' => $isCreator && ! $this->hasFastStartBonus($user),

            /*
             * 🚨 GATED ON THE FEATURE FLAG FIRST. The card's CTA points at
             * `growth.bonus`, which 404s while the scheme is dark — a promo
             * whose button leads to a missing page is worse than no promo.
             *
             * ⚠️ And only while there is still something to join or climb: a
             * creator who missed the window, or whose 12 months have run out,
             * is past this card. Same rule as `verified_badge`.
             */
            'growth_bonus' => $isCreator && $this->growthBonusOpen($user),

            'free_until_first_sale' => $isCreator
                && (bool) ($context['free_until_first_sale'] ?? false)
                && ! (bool) ($context['has_ever_sold'] ?? false),

            // 🚨 Only once an admin has APPROVED the profile — see
            // VerifiedBadge::awaitingIdentityCheck(). The old rule was
            // `tierFor() === NONE`, which is the state of an unapproved account, so
            // this card was shown to exactly the creators who cannot act on it.
            'verified_badge' => $isCreator && VerifiedBadge::awaitingIdentityCheck($user),

            /*
             * 🚨 ONLY WHILE THERE IS SOMETHING TO DO. The card asks a creator to
             * add their birthday and opt in; once they have, it describes a state
             * they have left — the same fault the `verified_badge` rule was fixed
             * for. `birthday_month` is checked as well as the switch because
             * ProfileController refuses the opt-in when no date is on file, so the
             * switch alone can read true with nothing behind it.
             */
            'birthday_discovery' => $isCreator
                && ! ((bool) $user->birthday_discovery_opt_in && $user->birthday_month !== null),

            /*
             * 🚨 ONLY WHILE THERE IS SOMETHING TO BUILD. The card's headline and copy are
             * a pitch — "paste one address in your bio" — so a creator who has already
             * built their page is being sold something they own. Same rule the
             * `verified_badge` and `birthday_discovery` cards were both corrected for: a
             * card describing a state the viewer has left is the deck telling them
             * something untrue about their own account.
             *
             * ⚠️ The CTA adapting per viewer (`See my page` vs `How it works`) is NOT a
             * substitute for this — it changes the button while the headline still sells.
             */
            'link_in_bio' => $isCreator && ! $this->hasBioLinks($user),

            'refer_and_earn' => $isCreator,

            'supporter_wall' => ! $isCreator,

            default => true,
        };
    }

    /**
     * The founder window is the creator's first N days on Stripe Connect.
     *
     * Keyed to `stripe_connected_at` and not to registration, matching
     * CheckFounderQualifications — a creator cannot earn before they can be paid,
     * so a window that starts at signup would be partly spent before it could be
     * used. Someone already a founder, or who has been marked as having missed
     * the window, is past this card either way.
     */
    private function founderWindowOpen(User $user): bool
    {
        if ((bool) $user->is_founder || $user->founder_missed_at !== null) {
            return false;
        }

        if (! $user->stripe_connected_at) {
            return false;
        }

        $days = (int) config('founder_bonus.qualification.qualification_period_days', 30);

        return Carbon::parse($user->stripe_connected_at)->addDays($days)->isFuture();
    }

    /**
     * Is the Growth Bonus still something this creator can act on?
     *
     * Dark scheme → no. No profile row yet → yes, they are inside their
     * activation window by definition (the daily evaluator creates the row;
     * a creator it has not reached yet is still a candidate). A `missed` or
     * `expired` profile → no.
     *
     * ⚠️ Reads the profile through the relation rather than the service so this
     * costs one query, not a full ledger recompute — the deck is built on every
     * Inertia response.
     */
    private function growthBonusOpen(User $user): bool
    {
        if (! config('growth_bonus.enabled', false)) {
            return false;
        }

        if (! app(GrowthBonusService::class)->eligibleForScheme($user)) {
            return false;
        }

        $status = GrowthBonusProfile::query()
            ->where('creator_id', $user->id)
            ->value('status');

        return ! in_array($status, [
            GrowthBonusProfile::STATUS_MISSED,
            GrowthBonusProfile::STATUS_EXPIRED,
        ], true);
    }

    private function hasBioLinks(User $user): bool
    {
        return CreatorBioLink::query()->where('user_id', $user->id)->exists();
    }

    private function hasFastStartBonus(User $user): bool
    {
        return FastStartBonusPayout::query()
            ->where('creator_uuid', $user->uuid)
            ->where('status', 'paid')
            ->exists();
    }
}

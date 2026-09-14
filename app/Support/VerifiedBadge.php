<?php

namespace App\Support;

use App\Models\User;

/**
 * The ONE definition of who is verified, and at which tier.
 *
 * Before this, eight surfaces each answered the question themselves and no two
 * agreed: the profile header drew a blue `#1d3ef8` tick, the right rail a green
 * `#12A150` one, discover cards `#3BA3FF`, the leaderboard brand pink, and
 * `Components/Avatar` a green-400 — five colours for one idea, three of which
 * are not in the palette at all. Some checked `role == 1 && profile_status_lock
 * == 2`, one checked the column alone, and one read an ad-hoc `is_verified`
 * field that duplicated it.
 *
 * Two tiers, and the difference is what the platform has actually confirmed:
 *
 *  - BASIC (grey)  — an admin reviewed and approved this person's profile.
 *                    Every approved account gets it, gifter or creator.
 *  - CREATOR (pink) — that, AND Stripe has verified their identity, AND their
 *                    Connect onboarding is finished. It marks a creator the
 *                    platform can actually pay, which is a materially stronger
 *                    claim than "their photo is fine".
 *
 * ⚠️ A creator who is approved but has not finished identity or Connect keeps
 * the grey badge (client decision, 5 Aug 2026). Approval is a real milestone
 * and showing nothing for it leaves a creator with no sign that the review they
 * waited on ever happened; pink is then the next step rather than the only one.
 */
class VerifiedBadge
{
    public const NONE = null;

    public const BASIC = 'basic';

    public const CREATOR = 'creator';

    /**
     * `users.profile_status_lock` values.
     * 0 = rejected · 1 = pending · 2 = approved.
     */
    private const PROFILE_APPROVED = 2;

    /** `users.identity_status`: 1 = Stripe verified. */
    private const IDENTITY_VERIFIED = 1;

    /** `users.identity_admin_status`: 2 = an admin rejected the check. */
    private const IDENTITY_ADMIN_REJECTED = 2;

    /**
     * Every column the tier is derived from.
     *
     * 🚨 A payload builder that does not select these renders a verified
     * creator as unverified — silently, because a missing attribute reads as
     * null and null is not approved. Most builders use an explicit `->select()`
     * (Discovery, the leaderboard, the post feeds), so ADD THIS LIST to any new
     * one. `tests/Feature/VerifiedBadgeTest.php` asserts the live builders do.
     */
    /**
     * 🚨 EVERY COLUMN `for()` READS. A select that takes some of these and not
     * the rest does not error — an unloaded attribute reads as NULL — so the
     * badge silently downgrades or vanishes, which is the shape of fault that
     * hid `SaveButton`'s dead `is_saved` prop for months.
     */
    public const COLUMNS = [
        'role',
        'suspended_account',
        'profile_status_lock',
        'identity_status',
        'identity_admin_status',
        'stripe_details_submitted',
        // The supporter tier's whole basis since 12 Sep 2026.
        'is_500_limit_exceeded',
    ];

    /**
     * The tier for a user, or null when they have no badge.
     *
     * Accepts a model or a plain array so a payload row that was never
     * hydrated (a `DB::table` result, a mapped array) can be answered too.
     *
     * @param  User|array<string, mixed>|null  $user
     */
    public static function tierFor($user): ?string
    {
        if (! $user) {
            return self::NONE;
        }

        $get = static fn (string $key) => is_array($user)
            ? ($user[$key] ?? null)
            : $user->{$key} ?? null;

        // 🚨 A suspended account never carries a badge, whatever else is true.
        // The badge is the platform vouching for someone; it must not keep
        // doing that for an account the platform has switched off.
        if ((int) $get('suspended_account') === 1) {
            return self::NONE;
        }

        /*
         * 🚨 A GIFTER'S BADGE IS WHAT THEY HAVE SPENT, NOT AN APPROVAL
         * (client direction, 12 Sep 2026). It used to be `profile_status_lock = 2`
         * — the verdict of the £500 address review — and that whole check was
         * removed the same day: there is no gifter verification, no card check
         * and no spend gate left, so a lock that nothing ever sets again would
         * have meant no supporter could ever carry a badge.
         *
         * `is_500_limit_exceeded` is written by `Helpers` when a supporter's
         * lifetime spend passes £500. It is the ONE thing left that the badge
         * can honestly stand for on a supporter: this person has actually
         * backed creators, at scale. Recognition, never a gate — nothing reads
         * it to refuse a purchase any more, and nothing may start to.
         */
        if ((int) $get('role') !== 1) {
            return (int) $get('is_500_limit_exceeded') === 1 ? self::BASIC : self::NONE;
        }

        /*
         * ⚠️ The lock still governs the CREATOR badge, and it has to: it is the
         * one record that their profile is live rather than drafting or pulled
         * back by a check.
         */
        if ((int) $get('profile_status_lock') !== self::PROFILE_APPROVED) {
            return self::NONE;
        }

        return self::isPayable($get) ? self::CREATOR : self::BASIC;
    }

    /* 🚨 `awaitingIdentityCheck()` IS GONE (11 Sep 2026, client D5/Q20). It answered
       "should we pitch the ID check to this creator" — and there is no ID check to
       pitch. Its only caller was the `verified_badge` promo card, removed with it. */

    /**
     * Stripe has verified this creator AND their Connect onboarding is done.
     *
     * ⚠️ Deliberately NOT `User::isFullyVerified()` or
     * `CreatorActivityService::isFullyVerified()`. Both of those are payment
     * gates (the grace period, the content gate), both are currently
     * short-circuited to `role == 1` with their real rule commented out, and
     * reusing either would tie a cosmetic badge to whether the platform lets
     * someone sell. They are left exactly as they are.
     *
     * @param  callable(string): mixed  $get
     */
    private static function isPayable(callable $get): bool
    {
        /*
         * 🚨 THE IDENTITY CLAUSES ARE GONE (11 Sep 2026, client D5/Q20). Spenny Piggy
         * runs no identity check, so "we have identified this person" is no longer
         * something the platform can claim — and a badge that keeps claiming it after
         * the check was removed would be the strongest untrue statement on the site.
         *
         * ⚠️ The higher tier now means what it can still honestly mean: this creator has
         * completed Stripe Connect onboarding and can actually be paid. Stripe's own KYC
         * sits behind that, which is the only identity assurance either of us has.
         */
        return (int) $get('stripe_details_submitted') === 1;
    }

    /**
     * What the badge says when someone hovers or a screen reader reads it.
     *
     * The two tiers must not both read "Verified": the whole reason there are
     * two is that they mean different things, and a tooltip is the only place
     * that difference is ever spelled out.
     */
    public static function labelFor(?string $tier): ?string
    {
        /*
         * 🚨 THE CREATOR LABEL SAID "identity confirmed" UNTIL 11 Sep 2026, AND BY
         * THEN IT WAS FALSE. `isPayable()` above dropped its identity clauses the
         * same day — Spenny Piggy runs no identity check at all now — so the badge
         * was the platform telling every visitor it had confirmed who somebody is,
         * on the strength of a check it had stopped performing. That method's own
         * docblock calls this out as the strongest untrue statement the site could
         * make; the label is the only place a visitor ever reads the claim, so it
         * is the half that mattered.
         *
         * ⚠️ Stripe's own KYC does sit behind Connect onboarding, but it is STRIPE's
         * assurance and not ours to describe as identity confirmation.
         */
        return match ($tier) {
            self::CREATOR => 'Verified creator — payouts set up with Stripe',
            /*
             * ⚠️ ONE LABEL, TWO POPULATIONS. A supporter earns it by spending
             * over £500; a creator holds it while their profile is live and
             * Connect is not finished. Both are "checked, not yet the pink
             * one", and splitting the wording would mean the tier no longer
             * names one thing.
             */
            self::BASIC => 'Verified profile — checks passed',
            default => null,
        };
    }
}

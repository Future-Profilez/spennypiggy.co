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
    public const COLUMNS = [
        'role',
        'suspended_account',
        'profile_status_lock',
        'identity_status',
        'identity_admin_status',
        'stripe_details_submitted',
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

        if ((int) $get('profile_status_lock') !== self::PROFILE_APPROVED) {
            return self::NONE;
        }

        if ((int) $get('role') !== 1) {
            // A gifter's badge is the approval, and there is nothing above it —
            // they have no identity check and no Connect account to finish.
            return self::BASIC;
        }

        return self::isPayable($get) ? self::CREATOR : self::BASIC;
    }

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
        // An admin rejection of the identity check outranks Stripe's pass —
        // somebody looked at it and said no.
        if ((int) $get('identity_admin_status') === self::IDENTITY_ADMIN_REJECTED) {
            return false;
        }

        if ((int) $get('identity_status') !== self::IDENTITY_VERIFIED) {
            return false;
        }

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
        return match ($tier) {
            self::CREATOR => 'Verified creator — identity confirmed and payouts set up',
            self::BASIC => 'Verified — profile reviewed and approved',
            default => null,
        };
    }
}

<?php

namespace App\Support;

use App\Models\SocialLinks;
use App\Models\User;

/**
 * "Is this profile asset live to the public right now?"
 *
 * That is the only question that decides whether an edit becomes a reviewable
 * change (the live value is protected) or is written straight to the column
 * (there is nothing public to protect).
 *
 * 🚨 `profile_status_lock == 2` is the WRONG test and was the first thing tried.
 * A creator at lock 1 can have `avatar_approved = 1`, and that photo IS public —
 * `User::profileMediaVisible()` checks the per-asset flag and nothing else. Gating
 * on the profile would overwrite a live photo for every creator who happens to be
 * mid-review, which is precisely the case this exists to prevent.
 *
 * ⚠️ This mirrors `CreatorReviewService::flagState()` in the admin app: a value
 * that exists, with its flag at 1. Keep the two in step — one decides what the
 * public sees, the other decides what the reviewer is told, and they must not
 * disagree about the same asset.
 */
class ProfileAssetVisibility
{
    /*
     * 🚨 `isLive()` STOOD HERE AND IS GONE (11 Sep 2026). It answered "is this asset
     * published, so an edit to it has to go through review instead of overwriting it"
     * — and nothing goes through review any more. Every save writes straight through
     * and records what changed; see App\Support\ProfileAutoApproval.
     */

    private static function flagIsLive(mixed $value, mixed $flag): bool
    {
        if (blank($value)) {
            return false;
        }

        return (int) $flag === 1;
    }

    /**
     * `social_links` is one row per user with one status for the whole row, so the
     * handles are live together or not at all.
     */
    private static function socialsAreLive(User $user): bool
    {
        $links = SocialLinks::where('user_id', $user->id)->first();

        if (! $links || (int) $links->status !== 1) {
            return false;
        }

        return self::hasAnyHandle($links);
    }

    /**
     * The platform columns, as `SocialLinksController` writes them.
     *
     * ⚠️ A row of nothing but nulls is not "approved handles" — it is a creator who
     * has never filled them in, and treating it as live would park their first save
     * in the review queue as an edit to something that was never published.
     */
    public const HANDLE_COLUMNS = [
        // ⚠️ Every column the table HAS, not just the three now accepted: a
        // creator verified on a retired platform still has a live handle, and
        // reading their row as empty would treat their next edit as a first
        // submission rather than as a change to something published.
        'twitter', 'instagram', 'tiktok', 'facebook', 'youtube', 'twitch', 'tumblr',
        'reddit', 'discord', 'onlyfans', 'loyalfans', 'fansly', 'manyvids', 'other',
    ];

    public static function hasAnyHandle(?SocialLinks $links): bool
    {
        if (! $links) {
            return false;
        }

        foreach (self::HANDLE_COLUMNS as $column) {
            if (filled($links->{$column})) {
                return true;
            }
        }

        return false;
    }
}

<?php

namespace App\Support;

use App\Mail\ProfileApprovalStatusMail;
use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Rules\NoContactDetails;
use App\Services\CreatorJourneyService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

/**
 * A creator's profile approves ITSELF — a person only ever sees what the checks hold.
 *
 * 🚨 NO ADMIN IN THE ONBOARDING PATH (10 Sep 2026, client direction). Photo, bio and
 * handles used to wait for a reviewer; `profile_status_lock` went 0 → 1 (Submit) → 2 (an
 * admin). Now each asset is judged by the same automated checks the reviewer's console
 * was already running, the moment it is saved, and the profile activates (0 → 2) on its
 * own the instant all three are clean. There is no Submit button. Lock 1 is a state no
 * new creator reaches.
 *
 * 🚨 THIS IS THE ONE DECISION POINT. Five things write an approval flag — the profile
 * form (bio, avatar), the socials form, the media scan's clean result, the gifter→creator
 * conversion, and the legacy-population sweep — and every one of them calls in here.
 * Five separate judgements is five answers about what "clean" means.
 *
 * What CAN be judged by a machine, and is:
 *   · bio       — banned wording (ContentWording), contact details / links (NoContactDetails)
 *   · handles   — known platform, https, no shortener, not already on another creator
 *   · photo     — Rekognition (CheckMediaModeration, async; this class writes the result)
 *
 * What CANNOT, and where it went:
 *   · "is this really the person the handles say?" — that is the human identity sign-off
 *     at the PAYOUT gate (`PayoutEligibility`), where a reviewer compares the profile
 *     photo, the socials and the passport together. Onboarding asks nobody.
 *
 * ⚠️ THE TRADE, STATED: an impersonator can now build a page and take money. They cannot
 * withdraw it. Same trade the identity change made, deliberately, in the same week.
 *
 * ⚠️ A held asset holds ITSELF ONLY. The creator is told which one and why, keeps
 * editing everything else, and re-saving that asset re-judges it. Nothing here suspends,
 * locks or delists — account-level action stays a human decision (client §13).
 */
class ProfileAutoApproval
{
    /** Link shorteners hide the destination from moderation and the supporter. */
    public const SHORTENERS = [
        'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly',
        'is.gd', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'linktr.ee',
    ];

    /* -----------------------------------------------------------------
     | Judgements — null means clean, a string is the creator-facing reason
     | ----------------------------------------------------------------- */

    /**
     * Is this bio publishable as written?
     *
     * ⚠️ The SAME two rules the form's validator runs (`NoExpenseOrBrandName`,
     * `NoContactDetails`), asked again here so a bio that reaches us any other way — a
     * change request, the sweep, the conversion — meets the same bar. A short bio is
     * not refused: that is advice (ProfileSelfCheck), not a hold.
     */
    public static function judgeBio(?string $bio): ?string
    {
        $text = trim((string) $bio);

        if ($text === '') {
            return null;
        }

        if ($match = ContentWording::firstMatch($text)) {
            return $match['message'] ?? ('Your bio uses "'.$match['term'].'", which we cannot publish. '
                .'Describe what supporters get from you as content, a membership or a creator service.');
        }

        return NoContactDetails::firstMatch($text);
    }

    /**
     * Are these handles publishable as written?
     *
     * @param  array<string, ?string>  $handles  platform => value, nulls allowed
     * @param  int|null  $excludeUserId  the owner, so their own row is not a "duplicate"
     */
    public static function judgeSocials(array $handles, ?int $excludeUserId = null): ?string
    {
        $anyFilled = false;

        foreach ($handles as $platform => $value) {
            $value = trim((string) $value);

            if ($value === '') {
                continue;
            }

            $anyFilled = true;

            if (! in_array($platform, SocialLinks::ACCEPTED_PLATFORMS, true)) {
                return 'Only Instagram, X and TikTok handles can be added.';
            }

            $lower = strtolower($value);

            foreach (self::SHORTENERS as $shortener) {
                if (str_contains($lower, $shortener)) {
                    return 'Your '.ucfirst($platform).' link uses a shortened address, which hides where it goes. '
                        .'Paste the real profile link or just the handle.';
                }
            }

            if (preg_match('#^http://#i', $value)) {
                return 'Your '.ucfirst($platform).' link is an http:// address. Please use https:// or just the handle.';
            }

            /*
             * 🚨 THE ONE CHECK THAT LOOKS OUTSIDE THIS ROW. Two creators claiming the
             * same Instagram is the automated shape of impersonation, and the only one
             * a machine can see at signup. The first claimant keeps it; the second is
             * told, and can take it to support. ⚠️ Compared on the NORMALISED handle so
             * "@jane", "jane" and "instagram.com/jane" collide.
             */
            $normalised = SocialHandle::normalise($platform, $value);

            if ($normalised !== null && self::handleTakenElsewhere($platform, $normalised, $excludeUserId)) {
                return 'That '.ucfirst($platform).' account is already linked to another Spenny Piggy creator. '
                    .'If it is yours, message support from the chat bubble and we will sort it out.';
            }
        }

        // No handle at all is "not yet", never a refusal — the journey step covers it.
        return null;
    }

    /* -----------------------------------------------------------------
     | Applying a clean verdict
     | ----------------------------------------------------------------- */

    /**
     * A change request that passed every check: apply it and close it as approved.
     *
     * ⚠️ Mirrors the admin app's `ProfileChangeService::approve()` — copy onto live, close
     * the request, set the asset's approved flag — with NO admin id. `decided_by_admin_id`
     * null + status approved is how the daily report tells a machine decision from a
     * person's (client direction: auto-apply, but show it).
     *
     * ⚠️ A verdict landing on a request that is no longer pending changes nothing: an
     * admin may have decided in the window, or the creator may have superseded it.
     */
    public static function applyChange(ProfileChangeRequest $change): bool
    {
        if (! $change->isPending()) {
            return false;
        }

        $user = $change->user;

        if (! $user) {
            return false;
        }

        DB::transaction(function () use ($change, $user) {
            $change->applyProposed($user);
            $change->close(ProfileChangeRequest::STATUS_APPROVED, null, null);
            self::markApproved($user->fresh(), $change->asset);
        });

        self::activateIfComplete($user->fresh());

        return true;
    }

    /**
     * Set one asset's approved flag on the live row.
     *
     * ⚠️ `DB::table`, not `save()`: `users.updated_at` orders the admin creator-review
     * queue and keys the public profile cache, and an automated approval a second after
     * upload must not reshuffle a reviewer's list or expire a cache for a photo that has
     * not changed.
     */
    public static function markApproved(User $user, string $asset): void
    {
        switch ($asset) {
            case ProfileChangeRequest::ASSET_AVATAR:
                DB::table('users')->where('id', $user->id)->update(['avatar_approved' => 1]);
                break;

            case ProfileChangeRequest::ASSET_COVER:
                DB::table('users')->where('id', $user->id)->update(['cover_approved' => 1]);
                break;

            case ProfileChangeRequest::ASSET_BIO:
                DB::table('users')->where('id', $user->id)->update(['bio_approved' => 1]);
                break;

            case ProfileChangeRequest::ASSET_SOCIALS:
                DB::table('social_links')->where('user_id', $user->id)->whereNull('deleted_at')
                    ->update(['status' => SocialLinks::STATUS_APPROVED, 'reason' => null]);
                break;
        }
    }

    /**
     * The profile goes live on its own the moment all three assets are approved.
     *
     * 🚨 `profile_status_lock` 0 → 2 WITH NO PERSON INVOLVED. Lock 2 is what puts a
     * creator in Discover, search and trending, lists their items, shows the badge and
     * unlocks Stripe Connect — everything the old Submit-and-wait held back.
     *
     * ⚠️ Never 2 → anything. A creator already live who edits an asset is handled by the
     * change-request path (the published version stays up); a creator an admin has
     * rejected is at lock 0 with a reason, and re-saving the asset they were told about
     * brings them back through here. Lock 1 is not read — no new creator reaches it.
     *
     * ⚠️ `DB::table` for the same `updated_at` reason as `markApproved()`.
     */
    public static function activateIfComplete(User $user): bool
    {
        if ((int) ($user->role ?? 0) !== 1) {
            return false;
        }

        if ((int) ($user->profile_status_lock ?? 0) === 2) {
            return false;
        }

        if ((int) ($user->suspended_account ?? 0) === 1) {
            return false;
        }

        if (! self::isComplete($user)) {
            return false;
        }

        $write = [
            'profile_status_lock' => 2,
            'profile_reject_reason' => null,
        ];

        /*
         * 🚨 WHEN THE PROFILE WENT LIVE, IN THE SAME STATEMENT AS THE LOCK.
         * The admin Daily Review feed dates a new creator profile by this, so a
         * creator who signed up weeks ago and completes their photo and bio
         * today appears in TODAY's feed instead of in no source at all. Writing
         * it separately would let one succeed and the other fail, leaving a live
         * profile the feed still cannot see.
         *
         * ⚠️ Guarded: the column is this app's migration and a deploy can
         * legitimately reach this line first. Absent, the feed falls back to
         * `created_at` — exactly what it did before.
         *
         * ⚠️ Only ever stamped on the 0 → 2 transition, which this method has
         * already established. It is not "last approved".
         */
        if (Schema::hasColumn('users', 'profile_activated_at')) {
            $write['profile_activated_at'] = now();
        }

        DB::table('users')->where('id', $user->id)->update($write);

        Log::info('Profile auto-activated', ['user_id' => $user->id]);

        try {
            if ($user->email && (int) ($user->notification_send ?? 1) !== 0) {
                Mail::to($user->email)->queue(new ProfileApprovalStatusMail($user->fresh(), true));
            }
        } catch (\Throwable $e) {
            Log::warning('Queueing profile approval mail failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        try {
            app(CreatorJourneyService::class)->syncStep($user->fresh());
        } catch (\Throwable $e) {
            // The activation is the fact; the journey pointer is a cache of it and the
            // hourly sync will catch up. Never let a bookkeeping failure undo a go-live.
            Log::warning('Journey sync after auto-activation failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        return true;
    }

    /**
     * Photo present and approved, bio present and approved, at least one handle approved.
     *
     * ⚠️ PRESENCE AND APPROVAL BOTH. The admin queue's `whereProfileComplete()` reads
     * presence only, because it was asking "is there anything to review"; this asks "is
     * every reviewable thing cleared", which is the stricter question and the right one
     * for going live.
     */
    public static function isComplete(User $user): bool
    {
        if (blank($user->avatar) || (int) ($user->avatar_approved ?? 0) !== 1) {
            return false;
        }

        if (blank($user->bio) || (int) ($user->bio_approved ?? 0) !== 1) {
            return false;
        }

        $links = SocialLinks::where('user_id', $user->id)->whereNull('deleted_at')->first();

        if (! $links || (int) ($links->status ?? 0) !== SocialLinks::STATUS_APPROVED) {
            return false;
        }

        return ProfileAssetVisibility::hasAnyHandle($links);
    }

    /** Which assets are still holding the profile back — for the creator's own screen. */
    public static function holding(User $user): array
    {
        $held = [];

        if (filled($user->avatar) && (int) ($user->avatar_approved ?? 0) !== 1) {
            $held[] = ProfileChangeRequest::ASSET_AVATAR;
        }

        if (filled($user->bio) && (int) ($user->bio_approved ?? 0) !== 1) {
            $held[] = ProfileChangeRequest::ASSET_BIO;
        }

        $links = SocialLinks::where('user_id', $user->id)->whereNull('deleted_at')->first();

        if ($links && ProfileAssetVisibility::hasAnyHandle($links) && (int) ($links->status ?? 0) !== SocialLinks::STATUS_APPROVED) {
            $held[] = ProfileChangeRequest::ASSET_SOCIALS;
        }

        return $held;
    }

    private static function handleTakenElsewhere(string $platform, string $normalised, ?int $excludeUserId): bool
    {
        $query = SocialLinks::query()
            ->whereNull('deleted_at')
            ->whereHas('user', fn ($q) => $q->where('role', 1)->whereNull('deleted_at'));

        if ($excludeUserId) {
            $query->where('user_id', '!=', $excludeUserId);
        }

        // Compare normalised-to-normalised: stored values may be a full URL, an @handle
        // or a bare handle depending on when and where they were saved.
        return $query->whereNotNull($platform)->get(['id', $platform])
            ->contains(fn ($row) => SocialHandle::normalise($platform, $row->{$platform}) === $normalised);
    }
}

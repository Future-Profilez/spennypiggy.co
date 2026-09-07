<?php

namespace App\Support;

use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\CreatorSetupService;
use Illuminate\Support\Facades\Log;

/**
 * "Everything we asked of you is done — now put three things up for sale."
 *
 * The creator's setup ends on a silence. The ID check passes, the last step on the journey
 * card disappears, and nothing tells them the waiting is over or what the next move is —
 * so a creator who has just cleared the hardest part of onboarding is left reading a page
 * that looks exactly like the one they were reading before. This payload is what turns that
 * moment into a moment: a full-screen "you are ready" the first time, and a small standing
 * count of listings until the page is worth sharing.
 *
 * 🚨 TWO SEPARATE FLAGS, AND THEY ARE NOT THE SAME QUESTION. `celebrate` is a one-time
 * event and is spent for ever the first time it is answered. `show_progress` is a state and
 * comes back on every load until the target is met. Collapsing them would either repeat the
 * confetti on every visit or hide the count the moment the popup is closed, and the popup
 * closing is precisely when the creator needs the count.
 *
 * 🚨 THE CALLER GATES ON OWNERSHIP. `/{username}` is both the creator's dashboard and their
 * public profile, and this describes what one specific account has left to do. Everything
 * here is built only when the viewer IS the profile — the same rule `profile_self_check`
 * and `growth_bonus_panel` follow, and the documented reason `SuspendedBanner` carries an
 * owner gate of its own.
 *
 * ⚠️ Null means "there is nothing to say to this viewer", never "this creator has nothing
 * left to do". A fan, a visitor, a suspended account and a creator still mid-setup all get
 * null, and they are different situations with the same answer.
 */
class SetupCelebrationPayload
{
    /**
     * @return array{celebrate: bool, show_progress: bool, listings: int, target: int, remaining: int}|null
     */
    public static function for(User $creator, bool $isEmulated = false): ?array
    {
        try {
            return self::build($creator, $isEmulated);
        } catch (\Throwable $e) {
            // 🚨 NOTHING ON THIS PATH MAY THROW. This is built inline — not behind a closure
            // — in the owner branch of `/{username}`, which is the creator's own dashboard.
            // A failed count would otherwise turn a missing piece of decoration into a 500 on
            // the one page the creator uses. Losing the celebration costs a celebration.
            // Same house rule as GrowthBonusPanelPayload and VisitTracker.
            Log::warning('Setup celebration: failed to build payload', [
                'user_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * @return array{celebrate: bool, show_progress: bool, listings: int, target: int, remaining: int}|null
     */
    private static function build(User $creator, bool $isEmulated): ?array
    {
        // ⚠️ The cheap test first, and it is cheap on purpose: `setupComplete()` costs no
        // query at all (six column reads), so the creator who is still mid-setup — the
        // large majority — never reaches the listing count below.
        if (! app(CreatorJourneyService::class)->setupComplete($creator)) {
            return null;
        }

        $target = max(1, (int) config('creator_setup.listings_target', 3));
        $listings = app(CreatorSetupService::class)->listingCount($creator);

        // 🚨 AN ADMIN EMULATING A CREATOR MUST NEVER SPEND THE CELEBRATION. The popup
        // stamps itself as seen when it opens, so an admin opening a creator's page to
        // check something would silently consume the one celebration that creator was
        // ever going to get — and there is no way to give it back. The progress strip
        // is fine to show: it reads a count and writes nothing.
        $celebrate = ! $isEmulated && $creator->setup_celebrated_at === null;

        if (! $celebrate && $listings >= $target) {
            // Setup finished, target met, celebration already spent. Nothing to draw, and
            // returning an array of zeros would have the component decide that for itself.
            return null;
        }

        return [
            'celebrate' => $celebrate,
            'show_progress' => $listings < $target,
            'listings' => $listings,
            'target' => $target,
            'remaining' => max(0, $target - $listings),
        ];
    }
}

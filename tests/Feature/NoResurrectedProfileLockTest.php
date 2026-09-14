<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * `profile_status_lock = 1` NO LONGER EXISTS, AND NOTHING MAY WRITE IT AGAIN.
 *
 * Migration 2026_09_11_100000 resolved every row on its own merits to 0 (drafting)
 * or 2 (live). Those two are the whole vocabulary now: profiles approve themselves,
 * there is no Submit button and no review queue to wait in.
 *
 * 🚨 A WRITE OF 1 IS A SILENT DEMOTION, NOT A NO-OP. On a live creator it takes the
 * verified badge, drops them out of Discover, search and trending, and DELISTS EVERY
 * ITEM THEY SELL — and nothing on the site ever sets it back to 2, so the creator is
 * stranded until somebody runs a repair command by hand. Nothing errors, and the only
 * symptom is a creator quietly earning nothing.
 *
 * The live instance this was written for: `RegisteredUserController::cardVerificationSuccess`,
 * the £1 gifter card-verification return leg, which wrote
 * `['profile_status_lock' => 1, 'is_subscribed' => 1]` for WHOEVER completed it —
 * and `gifterCardVerification` has no role gate, so a creator could reach it.
 *
 * ⚠️ THIS IS A SOURCE SCAN ON PURPOSE. That method makes three live Stripe calls
 * before it reaches the write, and the suite's OfflineStripeHttpClient makes those
 * throw — so a route test cannot get there, and would pass against the bug.
 */
class NoResurrectedProfileLockTest extends TestCase
{
    /**
     * Files that write `users` columns on a path a creator can reach. Listed rather
     * than swept: a select carrying `profile_status_lock` is not a write, and a scan
     * of all of `app/` would flag every read.
     */
    private const WRITERS = [
        'app/Http/Controllers/Auth/RegisteredUserController.php',
        'app/Http/Controllers/Auth/SocialLinksController.php',
        'app/Http/Controllers/ProfileController.php',
        'app/Support/ProfileAutoApproval.php',
        'app/Support/GifterToCreator.php',
    ];

    /** Comments are blanked first — each fix left a note QUOTING the expression it removed. */
    private function code(string $relative): string
    {
        $path = base_path($relative);

        if (! is_file($path)) {
            return '';
        }

        $source = file_get_contents($path);
        $source = preg_replace('#/\*.*?\*/#s', '', $source);

        return preg_replace('#//[^\n]*#', '', $source);
    }

    public function test_nothing_writes_the_review_lock_value_again(): void
    {
        foreach (self::WRITERS as $file) {
            $code = $this->code($file);

            $this->assertDoesNotMatchRegularExpression(
                '/[\'"]profile_status_lock[\'"]\s*=>\s*1\b/',
                $code,
                $file.' writes profile_status_lock = 1. That state was removed on 11 Sep 2026 '
                    .'and a write of it demotes a live creator off Discover with nothing to set it back.'
            );

            $this->assertDoesNotMatchRegularExpression(
                '/->profile_status_lock\s*=\s*1\b/',
                $code,
                $file.' assigns profile_status_lock = 1 on the model. Same fault, different syntax.'
            );
        }
    }

    /**
     * The second half of the same line, and the more expensive one.
     *
     * `is_subscribed` is the CREATOR PLATFORM SUBSCRIPTION flag — every legitimate
     * writer is a Stripe subscription webhook or SubscriptionCheckoutService, and
     * UserProfileService reads it to decide whether a creator is paying. A £1 card
     * verification is not a subscription.
     */
    public function test_the_card_verification_leg_does_not_mark_an_account_subscribed(): void
    {
        $code = $this->code('app/Http/Controllers/Auth/RegisteredUserController.php');

        $this->assertDoesNotMatchRegularExpression(
            '/[\'"]is_subscribed[\'"]\s*=>\s*1\b/',
            $code,
            'RegisteredUserController marks an account subscribed. That flag belongs to the '
                .'Stripe subscription path, not to a card check.'
        );
    }

    /**
     * A CONTROL. Without it both assertions above pass just as happily against a
     * pattern that matches nothing at all — which is the way a source scan rots.
     */
    public function test_the_scan_still_recognises_the_fault_it_looks_for(): void
    {
        $planted = "<?php \$user->update(['profile_status_lock' => 1, 'is_subscribed' => 1]);";

        $this->assertMatchesRegularExpression('/[\'"]profile_status_lock[\'"]\s*=>\s*1\b/', $planted);
        $this->assertMatchesRegularExpression('/[\'"]is_subscribed[\'"]\s*=>\s*1\b/', $planted);
    }
}

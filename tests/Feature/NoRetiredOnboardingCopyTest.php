<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * 🚨 NOTHING MAY DESCRIBE THE ONBOARDING STEPS THAT WERE DELETED (11 Sep 2026).
 *
 * Profiles approve themselves and the identity check moved to the payout gate.
 * Both changes deleted a step, and a step that no longer exists leaves copy
 * behind in places no build can see: a help article, a mail template, a line in
 * a JSX page. Every one of those reads perfectly, renders perfectly, and tells a
 * creator to wait for something that is never coming — which is the precise
 * friction the simplification was for.
 *
 * This was not hypothetical. Found live on 11 Sep, AFTER the change shipped:
 * the gifter→creator page promising "your photo, bio and cover go back for
 * review", its confirmation e-mail saying the same, a whole help section headed
 * "3. Submit for review", and `how-do-i-start-selling` telling creators they
 * "cannot put anything up for sale until identity verification is done".
 *
 * ⚠️ IT SCANS CONTENT, NOT CODE. `resources/js`, `resources/views`, the help
 * seeders and `app/Mail` — the places a sentence reaches a person from. It is
 * deliberately NOT pointed at `app/` generally: `profile_status_lock` and the
 * review vocabulary legitimately survive in migrations, in the admin-facing
 * services and in the historical notes that explain why the state is gone.
 *
 * ⚠️ COMMENTS ARE BLANKED FIRST. Every fix left a note at the call site quoting
 * the wording it replaced — including this file's own docblock — so a raw scan
 * finds the very strings it is checking have gone. This is the third guard in
 * this codebase to need that (`BlockedPaymentReasonTest`, `NoWritingGetRoutesTest`).
 */
class NoRetiredOnboardingCopyTest extends TestCase
{
    /**
     * Each phrase, and why it is now false. The reason is in the failure
     * message: a guard that says only "banned string found" gets the string
     * deleted rather than the claim corrected.
     */
    private const RETIRED = [
        'review team' => 'profiles approve themselves — there is no profile review team',
        'our team checks' => 'the profile checks are automatic',
        'our team reviews' => 'the profile checks are automatic',
        'go back for review' => 'nothing goes back for review; assets are re-judged automatically',
        'goes to our review' => 'nothing goes to a reviewer; assets are judged automatically',
        'still in review' => 'there is no profile review state to be in',
        'before they go public' => 'a clean asset publishes on save, with nobody in the path',
        // Added 11 Sep 2026 after an audit found every one of these live: a phrase
        // blacklist misses synonyms, so this list grows whenever a sweep finds one.
        'submit for review' => 'there is no Submit and no review',
        'Submit for review' => 'there is no Submit and no review',
        'submit again' => 'there is nothing to submit — a save is re-checked automatically',
        'a person has approved' => 'nobody approves a profile',
        'completed by an admin' => 'no onboarding step is completed by an admin',
        'goes for review' => 'nothing goes for review; it is checked on save',
        'reviewed and approved' => 'a live profile passed automatic checks, nobody approved it',
        'admin approval' => 'there is no admin approval step',
        'waiting for approval' => 'nothing waits for approval',
        'waiting for admin approval' => 'nothing waits for approval',
        'once it is approved' => 'a clean asset is live on save',
        'waiting for a review' => 'there is no review to wait for',
    ];

    /**
     * 🚨 THESE NEED NO CONTEXT WINDOW, AND REQUIRING ONE HID A REAL FAULT.
     *
     * The window above exists to tell PROFILE review from LISTING review. An
     * identity-gate claim has no such ambiguity — there is exactly one ID check
     * and it gates the payout — so demanding a profile word near it only meant
     * missing them. `what-happens-after-approval` said "Nothing can be listed
     * until this is done" and sailed through the first version of this guard for
     * precisely that reason; it was found by a retrieval test instead.
     */
    private const RETIRED_ANYWHERE = [
        'until identity verification is done' => 'identity gates the PAYOUT, never publishing',
        'before they can earn' => 'identity gates withdrawal, not earning — do not conflate the two',
        'Nothing can be listed until' => 'identity does not gate listing; you can sell before it',
        'cannot be listed until' => 'identity does not gate listing; you can sell before it',
        'before you can list' => 'identity does not gate listing; you can sell before it',
        'until your identity' => 'identity gates the payout, never publishing',
    ];

    /**
     * 🚨 THE PHRASES ARE AMBIGUOUS ON THEIR OWN, AND THAT IS WHY THERE IS A WINDOW.
     *
     * LISTING moderation still exists and still has a human queue — a held task,
     * shop item or pot genuinely is read by a person, and `Tasks/Edit.jsx` is
     * right to say "resubmit for review". Only PROFILE review was deleted. A bare
     * phrase list cannot tell the two apart, so it flagged legitimate copy on its
     * first run — and a guard that cries wolf is one somebody deletes.
     *
     * A hit counts only when the surrounding lines are talking about the PROFILE.
     */
    private const PROFILE_WORDS = [
        'photo', 'bio', 'profile', 'avatar', 'banner', 'cover', 'handle', 'your page',
    ];

    /**
     * ⚠️ And never when they are talking about a LISTING. Checked second, so a
     * window naming both — "your listing, not your profile" — is left alone.
     */
    private const LISTING_WORDS = [
        'task', 'listing', 'item', 'shop', 'wish', 'membership', 'pot', 'post', 'product', 'upload',
    ];

    /**
     * 🚨 A CONTENT FILE, NOT A CODE FILE. See the docblock.
     *
     * @return array<int, string>
     */
    private function contentFiles(): array
    {
        $roots = [
            resource_path('js'),
            resource_path('views'),
            database_path('seeders'),
            app_path('Mail'),
            // `App\Support\ProfileSelfCheck` BUILDS creator-facing sentences; the first
            // version of this guard could not reach it (11 Sep 2026).
            app_path('Support'),
        ];

        $files = [];

        foreach ($roots as $root) {
            if (! is_dir($root)) {
                continue;
            }

            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if (! $file->isFile()) {
                    continue;
                }

                if (preg_match('/\.(jsx?|php|blade\.php)$/', $file->getFilename())) {
                    $files[] = $file->getPathname();
                }
            }
        }

        return $files;
    }

    /**
     * ⚠️ Blanks every comment form these files use before scanning — `//`,
     * `/* *\/`, `{/* *\/}` and Blade's `{{-- --}}`. Without it this test fails
     * on the notes left by the very fix it guards.
     */
    private function stripComments(string $source): string
    {
        /*
         * 🚨 BLANK A COMMENT, NEVER DELETE IT. A multi-line comment removed
         * outright takes its newlines with it, so every line number after it is
         * wrong — and a guard that names the wrong line sends the next person
         * to the wrong place, which is worse than naming none. Caught on this
         * test's own first run: it reported four hits and three of the line
         * numbers pointed at unrelated code.
         */
        $blank = fn (array $m) => str_repeat("\n", substr_count($m[0], "\n"));

        $source = preg_replace_callback('#\{\{--.*?--\}\}#s', $blank, $source);
        $source = preg_replace_callback('#\{/\*.*?\*/\}#s', $blank, $source);
        $source = preg_replace_callback('#/\*.*?\*/#s', $blank, $source);

        return preg_replace('#^\s*//.*$#m', '', $source);
    }

    public function test_no_user_facing_copy_describes_a_deleted_onboarding_step(): void
    {
        $found = [];

        foreach ($this->contentFiles() as $path) {
            $source = $this->stripComments((string) file_get_contents($path));
            $relative = str_replace(base_path().'/', '', $path);

            foreach (self::RETIRED_ANYWHERE as $phrase => $why) {
                foreach (explode("\n", $source) as $i => $line) {
                    if (str_contains($line, $phrase)) {
                        $found[] = sprintf('%s:%d — "%s" (%s)', $relative, $i + 1, $phrase, $why);
                    }
                }
            }

            foreach (self::RETIRED as $phrase => $why) {
                if (! str_contains($source, $phrase)) {
                    continue;
                }

                // Name the line, so the failure is actionable without a grep.
                $lines = explode("\n", $source);

                foreach ($lines as $i => $line) {
                    if (! str_contains($line, $phrase)) {
                        continue;
                    }

                    // ±2 lines: real copy wraps, and the subject of the sentence
                    // is regularly on the line above the claim about it.
                    $window = strtolower(implode(' ', array_slice($lines, max(0, $i - 2), 5)));

                    $aboutProfile = false;
                    foreach (self::PROFILE_WORDS as $word) {
                        if (str_contains($window, $word)) {
                            $aboutProfile = true;
                            break;
                        }
                    }

                    if (! $aboutProfile) {
                        continue;
                    }

                    foreach (self::LISTING_WORDS as $word) {
                        if (str_contains($window, $word)) {
                            continue 2;
                        }
                    }

                    $found[] = sprintf(
                        '%s:%d — "%s" (%s)',
                        $relative,
                        $i + 1,
                        $phrase,
                        $why
                    );
                }
            }
        }

        $this->assertSame(
            [],
            $found,
            "User-facing copy still describes an onboarding step that was deleted on 11 Sep 2026.\n\n"
            .implode("\n", $found)
            ."\n\nFix the CLAIM, do not delete the phrase from this guard. Profiles approve "
            .'themselves (App\\Support\\ProfileAutoApproval) and identity gates the payout '
            .'(App\\Support\\PayoutEligibility), not listing.'
        );
    }

    /**
     * The control. A guard whose corpus is empty passes for ever and proves
     * nothing — this asserts the scan is actually reading the files it claims to,
     * and reading them as CONTENT rather than as an empty list.
     */
    public function test_the_scan_actually_reads_the_content_files(): void
    {
        $files = $this->contentFiles();

        $this->assertGreaterThan(
            500,
            count($files),
            'The content scan found almost nothing — its roots or its extension filter are wrong.'
        );

        $seeder = collect($files)->first(
            fn ($p) => str_ends_with($p, 'database/seeders/HelpCentreSeeder.php')
        );

        $this->assertNotNull($seeder, 'The help seeder is not in the scanned set.');
        $this->assertStringContainsString(
            'how-do-i-start-selling',
            (string) file_get_contents($seeder),
            'The help seeder was read but does not look like the help seeder.'
        );
    }
}

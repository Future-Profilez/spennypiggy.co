<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * A creator is never told to wait for us.
 *
 * 🚨 CLIENT DIRECTION, 11 Sep 2026: *"review karegi team — ye creators steps par dikhana hi
 * nahi hai. Ye apna internal kaam hoga, so creator ke liye sab kuchh auto approved hai."*
 * Everything a creator does publishes itself; review is our internal work and is never drawn
 * on their screen as a queue they are sitting in.
 *
 * ⚠️ The fault this guards is not one bad sentence — it is DRIFT. The same state was called
 * "In review" on one card, "Pending Approval" on another, "Waiting for approval" on a third
 * and printed as the raw column `moderation_hold` on a fourth, so the product disagreed with
 * itself about what had happened to the creator's own work.
 *
 * 🚨 IT SCANS ONLY CREATOR-FACING CONTENT SURFACES. Money is a different thing and keeps its
 * own vocabulary: a payout under review, a disputed charge and a `review_hold` are real waits
 * on a real process, and calling those something softer would be the opposite fault.
 */
class NoCreatorReviewCopyTest extends TestCase
{
    /**
     * Files that draw a creator's own content state.
     *
     * ⚠️ A LIST, not a sweep of `resources/js`. A sweep would drag in the money screens, the
     * support ticket thread ("with our team" is true there — a person really is answering),
     * the admin pages and the dispute flow, and an allowlist of exceptions is where a rule
     * like this rots.
     */
    private const SURFACES = [
        'resources/js/Components/ItemStatusBadge.jsx',
        'resources/js/Components/TaskItem.jsx',
        'resources/js/Components/MembershipItem.jsx',
        'resources/js/Components/PiggyPots/PiggyPotsGrid.jsx',
        'resources/js/Components/PiggyPots/PiggyPotWidget.jsx',
        'resources/js/Components/Creator/ActivityStatusBanner.jsx',
        'resources/js/Pages/Tasks/Index.jsx',
        'resources/js/Pages/Profile/CreatorVerification.jsx',
        'resources/js/Pages/feed/Post.jsx',
        'resources/js/Pages/feed/PostDetail.jsx',
        'resources/js/Pages/Auth/Social.jsx',
        'resources/js/Pages/Auth/register/CreatorProfileStep.jsx',
    ];

    /**
     * Phrases that tell a creator somebody is going to look at their work.
     *
     * ⚠️ "Under review" is deliberately NOT here as a bare string — it is the correct words
     * for a payout hold, and one of these files may legitimately carry a money state. The
     * phrases are the ones that can only mean a moderation queue.
     */
    private const BANNED = [
        'pending approval',
        'pending admin review',
        'waiting for approval',
        'waiting for review',
        'wait for review',
        'once approved',
        'until it is approved',
        "until it's approved",
        'will be approved',
        'reviewed by our admin',
        'our team will review',
        'goes live once our team',
    ];

    /*
     * ⚠️ `moderation_hold` IS NOT ON THAT LIST, and the first version of this test had it
     * there. It fired on `<GetHelpButton code="moderation_hold">` — an internal ticket CODE,
     * not a word any creator reads. The real fault it was aimed at was `PiggyPotsGrid`
     * RENDERING the raw column as a status chip, and that is caught by the badge vocabulary
     * instead. A guard that fails on an internal identifier is a guard somebody deletes.
     */

    private function source(string $path): string
    {
        $source = file_get_contents(base_path($path));

        /*
         * ⚠️ COMMENTS BLANKED FIRST. Every one of these files now explains the change by
         * QUOTING the sentence it used to carry, so a raw scan finds exactly the strings it
         * is checking have gone — the documented trap this repo has hit three times.
         * Newline count is preserved so a reported line still points at real code.
         */
        return preg_replace_callback(
            '#/\*.*?\*/|//[^\n]*|\{/\*.*?\*/\}#s',
            fn ($m) => str_repeat("\n", substr_count($m[0], "\n")),
            $source
        );
    }

    public function test_no_creator_surface_tells_them_to_wait_for_a_person(): void
    {
        foreach (self::SURFACES as $path) {
            $source = strtolower($this->source($path));

            foreach (self::BANNED as $phrase) {
                $this->assertStringNotContainsString(
                    $phrase,
                    $source,
                    $path.' tells a creator their work is queued behind a person. Nothing '
                    .'waits for us any more: it publishes on save and a check retracts it. '
                    .'Say what to FIX, in the words ItemStatusBadge already uses.'
                );
            }
        }
    }

    public function test_the_scan_actually_reads_the_files(): void
    {
        // Without this the test above passes just as happily against a typo'd path.
        foreach (self::SURFACES as $path) {
            $this->assertNotSame(
                '',
                trim($this->source($path)),
                $path.' read as empty — the path is wrong, so it is guarding nothing.'
            );
        }
    }

    public function test_every_screen_that_asks_for_details_carries_the_same_warning(): void
    {
        /*
         * 🚨 THE ONE THING STANDING BETWEEN A FAKE PROFILE AND A LIVE PAGE. With nobody
         * approving anything up front, the consequence has to be stated where the details
         * are typed — and in the SAME words, or it reads as strict on one screen and
         * optional on the next.
         */
        foreach ([
            'resources/js/Pages/Auth/Social.jsx',
            'resources/js/Pages/Auth/register/CreatorProfileStep.jsx',
            'resources/js/Pages/account/EditProfile.jsx',
        ] as $path) {
            $source = $this->source($path);

            $this->assertStringContainsString(
                'REAL_DETAILS_WARNING',
                $source,
                $path.' asks a creator for their details and never says what happens if '
                .'they are not real. Import it from constants/accountIntegrity.js — one '
                .'wording, every screen.'
            );
        }
    }
}

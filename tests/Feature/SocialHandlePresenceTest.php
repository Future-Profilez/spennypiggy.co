<?php

namespace Tests\Feature;

use App\Models\SocialLinks;
use App\Models\User;
use App\Support\ProfileAssetVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 "Does this creator have a handle?" MUST HAVE ONE ANSWER.
 *
 * `CreatorVerification.jsx` derived its own, as
 * `Object.values(slinks).some(v => v !== null && v !== "")` — which walks EVERY
 * column on the row (`id`, `user_id`, `status`, `source`, the timestamps), so a
 * `social_links` row with all fourteen platforms blank answered TRUE. The creator
 * saw that step ticked and "Submit for review" unlocked, and the server refused
 * with a message naming a field their own screen said was done.
 *
 * The server-side half of that disagreement (`$user->socialLinks`, a relation that
 * does not exist, so the check was false for everybody) is pinned separately by
 * `SubmitProfileForReviewTest`. This pins the other half.
 */
class SocialHandlePresenceTest extends TestCase
{
    use RefreshDatabase;

    private function row(array $attributes = []): SocialLinks
    {
        $user = User::factory()->create(['role' => 1]);

        return SocialLinks::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 0,
        ], $attributes));
    }

    public function test_a_row_with_every_platform_blank_has_no_handle(): void
    {
        // The exact shape the old client check called "has socials".
        $links = $this->row();

        $this->assertFalse($links->has_any_handle);
        $this->assertFalse(ProfileAssetVisibility::hasAnyHandle($links));
    }

    public function test_a_row_with_one_handle_has_a_handle(): void
    {
        $this->assertTrue($this->row(['tiktok' => 'someone'])->has_any_handle);
    }

    /**
     * ⚠️ `ProfileAssetVisibility::HANDLE_COLUMNS`, never `ACCEPTED_PLATFORMS`. A
     * creator verified on a platform that has since been retired still HAS a
     * handle — reading their row as empty would treat their next edit as a first
     * submission rather than a change to something already published.
     */
    public function test_a_handle_on_a_retired_platform_still_counts(): void
    {
        $retired = array_diff(
            ProfileAssetVisibility::HANDLE_COLUMNS,
            SocialLinks::ACCEPTED_PLATFORMS
        );

        $this->assertNotEmpty($retired, 'no retired platform to test with');

        $this->assertTrue($this->row([reset($retired) => 'someone'])->has_any_handle);
    }

    public function test_the_flag_is_serialised_so_the_page_never_re_derives_it(): void
    {
        $this->assertArrayHasKey('has_any_handle', $this->row(['instagram' => 'x'])->toArray());
    }

    /**
     * The two halves are in different languages and neither the build nor any
     * scanner can see that they agree. Renaming the key server-side would leave a
     * checklist step permanently "todo" and the Submit button permanently locked —
     * indistinguishable from a creator who simply has not filled it in.
     */
    public function test_the_verification_page_reads_the_server_flag(): void
    {
        $jsx = file_get_contents(resource_path('js/Pages/Profile/CreatorVerification.jsx'));

        /*
         * ⚠️ BLANK THE COMMENTS FIRST. The note left at the call site explains the
         * bug by quoting the old expression, so a raw scan finds the very string it
         * is checking has gone — the documented trap this repo has hit before.
         */
        $code = preg_replace('#/\*.*?\*/#s', '', $jsx);
        $code = preg_replace('#^\s*//.*$#m', '', $code);

        $this->assertStringContainsString('has_any_handle', $code);
        $this->assertStringNotContainsString('Object.values(slinks)', $code);
    }
}

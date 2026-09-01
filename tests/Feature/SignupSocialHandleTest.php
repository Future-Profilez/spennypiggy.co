<?php

namespace Tests\Feature;

use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserVerificationStatus;
use App\Support\SocialHandle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The creator's social handle, captured at signup as a CONTACT route.
 *
 * 🚨 THE PLATFORM HOLDS A CREATOR'S E-MAIL AND NOTHING ELSE. A creator who stalls
 * during onboarding is unreachable by any other means, and measured on live data
 * (25 Aug 2026) only 3 of the 33 creators who signed up in the previous 90 days had a
 * handle on file at all. This field exists to close that — which is exactly why it must
 * never become a condition of opening an account.
 *
 * 🚨 It is the creator's SOCIAL ONBOARDING STEP, answered early — not a separate contact
 * field. `Profile/CreatorVerification.jsx` carries a real "Add a social handle" step and
 * locks "Submit for review" until the handles are approved, so the row is written exactly
 * as `SocialLinksController` writes it: `status = 0`, reviewed like any other, and the
 * verification row records the step. The creator gives their handle once.
 */
class SignupSocialHandleTest extends TestCase
{
    use RefreshDatabase;

    private function signupPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Person',
            'username' => 'testperson',
            'email' => 'test.person@gmail.com',
            'password' => 'Str0ng!Passw0rd',
            'password_confirmation' => 'Str0ng!Passw0rd',
            'role' => 1,
            'country' => 'GB',
            'country_code' => 'GB',
            'creator_email_receipt_ack' => 1,
        ], $overrides);
    }

    private function registered(): ?User
    {
        return User::where('email', 'test.person@gmail.com')->first();
    }

    /**
     * 🚨 `users.country` WAS NULL FOR EVERY CREATOR until 31 Aug 2026 — the form never
     * asked (`CredentialsStep` hid the picker behind `!isCreator`) and the server only
     * required it for supporters. Shipping zones, the Connect business type and the
     * checkout country match all read it.
     */
    public function test_a_creator_signup_records_the_iso_country(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'instagram',
            'social_handle' => 'testperson',
        ]));

        $this->assertSame('GB', $this->registered()?->country);
    }

    public function test_a_creator_cannot_sign_up_without_a_country(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'instagram',
            'social_handle' => 'testperson',
            'country' => null,
            'country_code' => null,
        ]))->assertSessionHasErrors('country');

        $this->assertNull($this->registered());
    }

    /**
     * 🚨 REQUIRED FOR A CREATOR (client decision, 25 Aug 2026).
     *
     * Not new friction — a creator already could not go live without an APPROVED
     * handle, because `Profile/CreatorVerification.jsx` locks "Submit for review"
     * until socials, photo and bio are approved. Asking here only moves it earlier.
     */
    public function test_a_creator_cannot_sign_up_without_a_handle(): void
    {
        $this->post(route('register'), $this->signupPayload())
            ->assertSessionHasErrors(['social_platform', 'social_handle']);

        $this->assertNull($this->registered());
    }

    /** ⚠️ A gifter is never asked — their form offers neither field. */
    public function test_a_gifter_can_sign_up_without_a_handle(): void
    {
        $this->post(route('register'), $this->signupPayload(['role' => 0]));

        $user = $this->registered();

        $this->assertNotNull($user);
        $this->assertDatabaseMissing('social_links', ['user_id' => $user->id]);
    }

    public function test_a_handle_is_stored_against_the_chosen_platform(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'instagram',
            'social_handle' => '@Jane.Doe',
        ]));

        $links = SocialLinks::where('user_id', $this->registered()->id)->first();

        $this->assertNotNull($links);
        // Lower-cased and stripped of the @ — handles are case-insensitive on all
        // three platforms, and a value stored as typed cannot be compared to another.
        $this->assertSame('jane.doe', $links->instagram);
        $this->assertNull($links->twitter);
        $this->assertNull($links->tiktok);
    }

    /**
     * 🚨 IT LANDS AS A NORMAL SUBMISSION AWAITING REVIEW — the same state a Creator
     * Studio save produces. `source` records where it came from and gates nothing;
     * an earlier version used it to hide these rows from the review queue, which
     * meant they could never be approved and the creator's own "Submit for review"
     * stayed locked for ever.
     */
    public function test_a_signup_handle_awaits_review_like_any_other(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'tiktok',
            'social_handle' => 'janedoe',
        ]));

        $links = SocialLinks::where('user_id', $this->registered()->id)->first();

        $this->assertSame(0, (int) $links->status, 'never published without review');
        $this->assertSame('signup', $links->source, 'provenance only');
    }

    /**
     * 🚨 THE POINT OF DOING IT AT SIGNUP: the social onboarding step is already
     * answered, so the creator is never asked for the same handle twice.
     */
    public function test_the_social_onboarding_step_is_recorded(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'instagram',
            'social_handle' => 'janedoe',
        ]));

        $status = UserVerificationStatus::where('user_id', $this->registered()->id)->first();

        $this->assertNotNull($status);
        // 0 = awaiting review, exactly what SocialLinksController writes.
        $this->assertSame(0, (int) $status->social_status);
    }

    /**
     * 🚨 THE POINT OF THE WHOLE THING: the creator is never asked twice.
     *
     * `AuthenticatedSessionController` sends the profile page `slinks` from
     * `$user->social_links()->first()`, and `Pages/Auth/Social.jsx` seeds its form
     * from exactly that — so the Creator Studio step opens PREFILLED with what was
     * typed at signup. This asserts the row that feeds it, because the prefill is
     * only ever as good as the row.
     */
    public function test_the_handle_is_there_for_the_creator_studio_form_to_prefill(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'instagram',
            'social_handle' => '@JaneDoe',
        ]));

        $creator = $this->registered();

        $this->assertSame('janedoe', $creator->social_links()->first()?->instagram);
    }

    /**
     * ⚠️ Three formats arrive in the wild and all three must land on one value —
     * the live column already holds 20 full URLs, 17 @handles and 21 bare handles,
     * none of which can be compared to another.
     */
    public function test_every_input_format_lands_on_the_same_handle(): void
    {
        foreach ([
            'janedoe',
            '@janedoe',
            'JaneDoe',
            'instagram.com/janedoe',
            'https://www.instagram.com/janedoe/',
            'https://instagram.com/janedoe?igshid=abc',
        ] as $input) {
            $this->assertSame(
                'janedoe',
                SocialHandle::normalise('instagram', $input),
                "input [$input] must normalise to the bare handle"
            );
        }
    }

    /**
     * 🚨 A link to the WRONG platform is refused, never filed under the chosen one —
     * storing it produces a contact route that goes nowhere, and nothing would ever
     * report it.
     */
    public function test_a_link_to_another_platform_is_refused(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'instagram',
            'social_handle' => 'https://tiktok.com/@janedoe',
        ]))->assertSessionHasErrors('social_handle');

        $this->assertNull($this->registered(), 'the account is refused, not created with a bad handle');
    }

    /**
     * 🚨 A POST URL IS NOT A PROFILE. `instagram.com/p/Cxyz` passes the handle
     * pattern happily, so without the reserved list the stored "handle" is the
     * literal word `p` — a dead contact route indistinguishable from a live one.
     */
    public function test_a_post_link_is_not_read_as_a_handle(): void
    {
        $this->assertNull(SocialHandle::normalise('instagram', 'https://instagram.com/p/Cxyz123'));
        $this->assertNull(SocialHandle::normalise('instagram', 'https://instagram.com/reel/abc'));
        $this->assertNull(SocialHandle::normalise('twitter', 'https://x.com/i/status/123'));
    }

    public function test_an_unusable_handle_is_refused_with_a_message(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'twitter',
            // Over X's 15-character limit.
            'social_handle' => 'a_very_long_handle_indeed',
        ]))->assertSessionHasErrors('social_handle');
    }

    /** ⚠️ A platform the server does not accept can never reach a column. */
    public function test_an_unknown_platform_is_refused(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'social_platform' => 'facebook',
            'social_handle' => 'janedoe',
        ]))->assertSessionHasErrors('social_platform');
    }

    /**
     * ⚠️ A gifter's form offers neither field, so a value there is noise rather than
     * a mistake to explain — it is ignored, not refused.
     */
    public function test_a_gifter_posting_the_fields_gets_no_row(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'role' => 0,
            'social_platform' => 'instagram',
            'social_handle' => 'janedoe',
        ]));

        $user = $this->registered();

        $this->assertNotNull($user);
        $this->assertDatabaseMissing('social_links', ['user_id' => $user->id]);
    }

    /**
     * ⚠️ Provenance follows the latest submission — a handle first given at signup and
     * then edited in Creator Studio IS a Creator Studio submission, and a reviewer
     * reading "From signup" on it would be told something untrue.
     */
    public function test_a_creator_studio_submission_clears_the_signup_marker(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        SocialLinks::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'source' => 'signup',
            'status' => 0,
            'instagram' => 'janedoe',
        ]);

        $this->actingAs($creator)->post(route('save_social_links'), [
            'instagram' => 'janedoe',
            'whoyouinto' => 'Art',
        ]);

        $links = SocialLinks::where('user_id', $creator->id)->first();

        $this->assertNull($links->source, 'provenance follows the latest submission');
    }

    /**
     * ⚠️ The JS list and the PHP list must agree. A platform the form offers and the
     * server refuses is dropped silently — the same class of fault as a `route()` name
     * missing from the generated ziggy snapshot.
     */
    public function test_the_form_offers_exactly_the_platforms_the_server_accepts(): void
    {
        $js = file_get_contents(resource_path('js/Pages/Auth/register/constants.js'));

        foreach (SocialHandle::platforms() as $platform) {
            $this->assertStringContainsString("key: \"{$platform}\"", $js);
        }

        // ⚠️ Scoped to the SOCIAL_PLATFORMS block. `constants.js` also holds the
        // password-strength rules, which carry their own `key:` entries — matching
        // across the whole file reported those as platforms.
        $flat = preg_replace('/\s+/', ' ', $js);
        $block = substr($flat, (int) strpos($flat, 'export const SOCIAL_PLATFORMS'));
        $block = substr($block, 0, (int) strpos($block, '];'));

        preg_match_all('/key: "([a-z]+)"/', $block, $matches);

        // ⚠️ SET equality, not order. The form deliberately leads with Instagram (the
        // most-used of the three on the live platform) while the server list is in the
        // model's own order — what must never differ is WHICH platforms are offered.
        $offered = $matches[1];
        $accepted = SocialHandle::platforms();
        sort($offered);
        sort($accepted);

        $this->assertSame($accepted, $offered);
    }
}

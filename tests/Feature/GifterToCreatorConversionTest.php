<?php

namespace Tests\Feature;

use App\Mail\CreatorAccountOpened;
use App\Models\CreatorReferral;
use App\Models\ReferralCode;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserVerificationStatus;
use App\Support\GifterToCreator;
use App\Support\PresetCovers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A gifter turning their own account into a creator account.
 *
 * 🚨 THE TESTS THAT MATTER HERE ARE THE RESETS. A gifter's photo and bio are
 * auto-approved on upload (`ProfileController` writes 1 for role 0), because a
 * fan's picture is not published anywhere that needs judging — so a conversion
 * that only sets `role = 1` puts an unreviewed photo on a selling creator's
 * public page, and nothing anywhere errors. Every approval column is asserted
 * individually for that reason rather than through the page.
 */
class GifterToCreatorConversionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The conversion queues a confirmation mail and dispatches the CRM link
        // job. Neither is the subject of these tests, and the suite runs the queue
        // SYNC — so a real job would run inside the assertion.
        Mail::fake();
        Queue::fake();
    }

    private function gifter(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 0,
            'email_verified_at' => now(),
            'suspended_account' => 0,
            // Auto-approved as a fan, which is the whole point of the resets.
            'avatar' => 'https://ucarecdn.com/avatar/',
            'avatar_approved' => 1,
            'bio' => 'I buy things from people I like',
            'bio_approved' => 1,
            'cover' => PresetCovers::FAN_DEFAULT,
            'cover_approved' => 1,
            'profile_status_lock' => 0,
            'country' => 'GB',
        ], $attributes));
    }

    /**
     * ⚠️ The query builder, NOT `Dispute::create()`. The model has timestamps on
     * and casts `updated_at`, and the `disputes` table declared by
     * `create_risk_engine_tables` has no such column — so a model insert dies with
     * "table disputes has no column named updated_at" on any database built from
     * these migrations. That is pre-existing schema drift (the column exists on
     * live and in no migration), not something this fixture should work around by
     * changing the model.
     */
    private function dispute(string $buyerEmail, string $status): void
    {
        DB::table('disputes')->insert([
            'id' => (string) Str::uuid(),
            'stripe_dispute_id' => 'dp_'.Str::random(16),
            'customer_email' => $buyerEmail,
            'status' => $status,
            'amount' => 2000,
            'currency' => 'gbp',
            'created_at' => now(),
        ]);
    }

    private function payload(array $overrides = []): array
    {
        // ⚠️ array_merge, never `+` — with `+` the LEFT value wins, so every
        // override in a fixture is silently discarded (the documented trap).
        return array_merge([
            'social_platform' => 'instagram',
            'social_handle' => 'jane.makes',
            'creator_category' => ['musician'],
            'terms_accepted' => true,
            'creator_email_receipt_ack' => true,
        ], $overrides);
    }

    /* ------------------------------ the flip ------------------------------ */

    public function test_a_gifter_becomes_a_creator(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->post('/become-creator', $this->payload())
            ->assertRedirect(route('user.show', $user->username));

        $user->refresh();

        $this->assertSame(1, (int) $user->role);
        $this->assertNotNull($user->creator_converted_at);
        $this->assertNotNull($user->creator_email_receipt_acknowledged_at);
        $this->assertNotNull($user->terms_accepted_at);
    }

    public function test_the_never_reviewed_photo_and_bio_go_back_for_review(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)->post('/become-creator', $this->payload());

        $user->refresh();

        $this->assertSame(0, (int) $user->avatar_approved);
        $this->assertSame(0, (int) $user->bio_approved);
        $this->assertSame(0, (int) $user->profile_status_lock);

        // The FILES are kept. Clearing them would throw away work the person
        // already did and leave them staring at an empty profile as the reward
        // for converting — the review is what was missing, not the content.
        $this->assertNotEmpty($user->avatar);
        $this->assertNotEmpty($user->bio);
    }

    public function test_the_journey_clock_starts_at_the_conversion(): void
    {
        // Signed up as a fan months ago. `nudgeCandidateQuery` only coaches a
        // creator whose `journey_step_at` is inside a 30-day window, so a null or
        // a months-old value writes this account off as dormant on the day it
        // becomes a creator.
        $user = $this->gifter(['created_at' => now()->subMonths(8), 'journey_step_at' => null]);

        $this->actingAs($user)->post('/become-creator', $this->payload());

        $this->assertNotNull($user->fresh()->journey_step_at);
        $this->assertTrue($user->fresh()->journey_step_at->isToday());
    }

    public function test_the_handle_is_stored_awaiting_review(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)->post('/become-creator', $this->payload([
            'social_platform' => 'instagram',
            'social_handle' => '@Jane.Makes',
        ]));

        $row = SocialLinks::where('user_id', $user->id)->first();

        $this->assertNotNull($row);
        // Normalised (bare, lower-cased) exactly as signup stores it, so a
        // duplicate is visible and the value can be turned back into a link.
        $this->assertSame('jane.makes', $row->instagram);
        // 0 = awaiting review, identical to a Creator Studio submission.
        $this->assertSame(0, (int) $row->status);
        $this->assertSame('conversion', $row->source);
    }

    public function test_an_existing_handle_row_is_updated_never_duplicated(): void
    {
        $user = $this->gifter();

        SocialLinks::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 1,
            'instagram' => 'old.handle',
        ]);

        $this->actingAs($user)->post('/become-creator', $this->payload());

        // Two rows for one account is two answers to "which handle is under
        // review". The editor is not creator-gated, so a gifter can already hold
        // one.
        $this->assertSame(1, SocialLinks::where('user_id', $user->id)->count());
        $this->assertSame(0, (int) SocialLinks::where('user_id', $user->id)->first()->status);
    }

    public function test_the_verification_row_is_updated_never_duplicated(): void
    {
        $user = $this->gifter();

        // A gifter can already hold a role-0 row, written at the £500
        // card-verification gate.
        UserVerificationStatus::create([
            'user_id' => $user->id,
            'role' => 0,
            'address_status' => 1,
        ]);

        $this->actingAs($user)->post('/become-creator', $this->payload());

        $rows = UserVerificationStatus::where('user_id', $user->id)->get();

        $this->assertCount(1, $rows);
        $this->assertSame(1, (int) $rows->first()->role);
    }

    /* ------------------------------- the cover ---------------------------- */

    public function test_a_fan_cover_is_replaced_with_a_curated_creator_one(): void
    {
        $user = $this->gifter(['cover' => PresetCovers::FAN_DEFAULT]);

        $this->actingAs($user)->post('/become-creator', $this->payload());

        $user->refresh();

        $this->assertNotSame(PresetCovers::FAN_DEFAULT, $user->cover);
        $this->assertContains($user->cover, PresetCovers::signupPool());
        // 🚨 A curated cover is approved ON SELECTION and skips the scan, exactly
        // as the signup path writes it. Zeroing this would hide a house banner
        // behind a review queue and leave the new page blank at the top for
        // nothing.
        $this->assertSame(1, (int) $user->cover_approved);
    }

    public function test_a_cover_they_uploaded_themselves_is_kept_and_reviewed(): void
    {
        $user = $this->gifter(['cover' => 'their-own-upload-uuid']);

        $this->actingAs($user)->post('/become-creator', $this->payload());

        $user->refresh();

        $this->assertSame('their-own-upload-uuid', $user->cover);
        $this->assertSame(0, (int) $user->cover_approved);
    }

    /* -------------------------------- gates ------------------------------- */

    public function test_a_suspended_account_cannot_convert(): void
    {
        $user = $this->gifter(['suspended_account' => 1]);

        $this->assertContains('suspended', GifterToCreator::blockers($user));

        /*
         * ⚠️ TWO GATES REFUSE THIS, and the first one is not ours.
         * `CheckSuspendedUser` sits in the `web` group and turns away every
         * non-GET verb unless the route NAME is on
         * `config('suspension.allowed_write_routes')` — so the request never
         * reaches the controller and there is no error bag of ours to assert.
         * What matters is that nothing was written.
         */
        $this->actingAs($user)->post('/become-creator', $this->payload());

        $this->assertSame(0, (int) $user->fresh()->role);
        $this->assertNull($user->fresh()->creator_converted_at);
    }

    /**
     * 🚨 THE CONVERSION MUST NEVER BE ON THE SUSPENSION WRITE-ALLOWLIST.
     * That list exists for the handful of writes a restricted account may still
     * make — logging out, support, e-mail preferences, paying an unpaid platform
     * subscription. Becoming a creator is the opposite: it is how a suspended
     * account would route around the restriction entirely, which is the whole
     * reason `suspended` is a gate. Nothing that publishes, sells or changes what
     * the public sees may go on that list.
     */
    public function test_the_conversion_is_not_on_the_suspension_write_allowlist(): void
    {
        $allowed = (array) config('suspension.allowed_write_routes', []);

        $this->assertNotContains('become.creator.store', $allowed);
    }

    public function test_an_account_with_an_open_dispute_cannot_convert(): void
    {
        $user = $this->gifter(['email' => 'Jane@Example.com']);

        // 🚨 Matched on the BUYER's e-mail. `disputes.creator_id` is the person
        // being bought FROM and would be the wrong party entirely — the same trap
        // that sent an investigation at a supporter on 29 Aug 2026.
        $this->dispute('jane@example.com', 'needs_response');

        $this->assertContains('dispute_history', GifterToCreator::blockers($user));

        $this->actingAs($user)
            ->post('/become-creator', $this->payload())
            ->assertSessionHasErrors('conversion');

        $this->assertSame(0, (int) $user->fresh()->role);
    }

    public function test_a_dispute_the_platform_won_is_not_held_against_them(): void
    {
        // Counting these would refuse a creator for a chargeback somebody else
        // lost. Same status exclusions as `PaymentTierService`'s card screen, so a
        // buyer we still take cards from cannot be told they may not sell.
        $user = $this->gifter(['email' => 'won@example.com']);

        $this->dispute('won@example.com', 'won');

        $this->assertSame([], GifterToCreator::blockers($user));
    }

    public function test_an_unverified_email_cannot_convert(): void
    {
        $user = $this->gifter(['email_verified_at' => null]);

        $this->assertContains('email_unverified', GifterToCreator::blockers($user));

        // ⚠️ The `verified` middleware turns them away before the controller, so
        // this asserts a refusal rather than the error bag — either way nothing is
        // written. The controller re-checks the same gate for a hand-made POST.
        $this->actingAs($user)->post('/become-creator', $this->payload());

        $this->assertSame(0, (int) $user->fresh()->role);
    }

    public function test_an_emulating_admin_cannot_convert_the_account(): void
    {
        // Becoming a creator is a declaration only the account holder can make,
        // and a reviewer cannot tell a conversion the owner never asked for from
        // one they did.
        $user = $this->gifter();

        $this->actingAs($user)
            ->withSession(['emulated_by_admin' => 7])
            ->post('/become-creator', $this->payload())
            ->assertSessionHasErrors('conversion');

        $this->assertSame(0, (int) $user->fresh()->role);
    }

    public function test_a_creator_is_sent_away_rather_than_offered_it_again(): void
    {
        $creator = User::factory()->create(['role' => 1, 'email_verified_at' => now()]);

        $this->actingAs($creator)
            ->get('/become-creator')
            ->assertRedirect(route('user.show', $creator->username));
    }

    public function test_converting_twice_changes_nothing_the_second_time(): void
    {
        $user = $this->gifter();

        $this->assertTrue(GifterToCreator::convert($user, [
            'social_platform' => 'instagram',
            'social_handle' => 'jane.makes',
            'creator_category' => ['musician'],
        ]));

        $firstMarker = $user->fresh()->creator_converted_at;

        // A second tab, a double tap. `creator_converted_at` is the idempotency
        // marker, so a second run must not re-reset approvals on a creator who is
        // already mid-review or stamp a second consent.
        $this->assertFalse(GifterToCreator::convert($user->fresh(), [
            'social_platform' => 'twitter',
            'social_handle' => 'somethingelse',
            'creator_category' => ['artist'],
        ]));

        $this->assertEquals($firstMarker, $user->fresh()->creator_converted_at);
        $this->assertSame(1, SocialLinks::where('user_id', $user->id)->count());
    }

    /* ------------------------- what is NOT touched ------------------------ */

    public function test_the_marketing_consent_record_is_left_alone(): void
    {
        // 🚨 A conversion is not a new consent, and re-asking would overwrite the
        // evidence of what the person originally agreed to. The form deliberately
        // has no marketing box.
        $user = $this->gifter([
            'marketing_emails_enabled' => true,
            'marketing_email_consent' => true,
            'marketing_consent_source' => 'gifter_signup',
        ]);

        $this->actingAs($user)->post('/become-creator', $this->payload());

        $user->refresh();

        $this->assertTrue((bool) $user->marketing_emails_enabled);
        $this->assertTrue((bool) $user->marketing_email_consent);
        $this->assertSame('gifter_signup', $user->marketing_consent_source);
    }

    public function test_the_conversion_marker_cannot_be_mass_assigned(): void
    {
        // It states something the platform did on a person's instruction. A
        // mass-assignable copy is a route by which a posted form claims a
        // conversion that never happened — or clears the one marker saying the
        // assets on this account were reviewed as a fan's.
        $user = User::factory()->create(['role' => 0]);

        $user->fill(['creator_converted_at' => now()]);

        $this->assertNull($user->creator_converted_at);
    }

    /* ------------------------------- referral ----------------------------- */

    public function test_a_referral_code_is_attributed(): void
    {
        $referrer = User::factory()->create(['role' => 1]);
        $code = ReferralCode::create([
            'creator_id' => $referrer->id,
            'code' => 'REFME',
            'is_active' => 1,
        ]);

        $user = $this->gifter();

        $this->actingAs($user)->post('/become-creator', $this->payload(['referral' => 'REFME']));

        $this->assertDatabaseHas('creator_referrals', [
            'referrer_creator_id' => $referrer->id,
            'referred_creator_id' => $user->id,
            'referral_code_id' => $code->id,
        ]);
    }

    public function test_an_unknown_referral_code_is_ignored_rather_than_refused(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->post('/become-creator', $this->payload(['referral' => 'NOSUCHCODE']))
            ->assertRedirect(route('user.show', $user->username));

        $this->assertSame(1, (int) $user->fresh()->role);
        $this->assertSame(0, CreatorReferral::where('referred_creator_id', $user->id)->count());
    }

    /* ---------------------------- the one e-mail -------------------------- */

    public function test_the_confirmation_mail_is_queued(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)->post('/become-creator', $this->payload());

        Mail::assertQueued(CreatorAccountOpened::class);
    }

    /* -------------------------- the entry points -------------------------- */

    /**
     * 🚨 A TWO-LANGUAGE PIN. The write is a POST, and every entry point must link
     * to the PAGE — a GET that flips a role and re-opens a profile for review
     * needs nothing to click it (a link prefetch, a hover prerender, an inbox
     * scanning a link), which is the exact fault that put creators into the admin
     * review queue on 7 Sep 2026. Neither the build nor any scanner can see that
     * a JSX href and a route's verb agree.
     */
    public function test_every_entry_point_links_to_the_page_and_not_the_write(): void
    {
        $files = [
            resource_path('js/Components/BecomeCreatorCard.jsx'),
            resource_path('js/Pages/accountsetting/Accountsetting.jsx'),
        ];

        foreach ($files as $file) {
            $this->assertFileExists($file);

            // ⚠️ Comments blanked first: both files explain this rule in prose and
            // quote the route, so a raw scan finds the very string it is checking.
            $source = preg_replace('#/\*.*?\*/#s', '', (string) file_get_contents($file));
            $source = preg_replace('#\{/\*.*?\*/\}#s', '', (string) $source);
            $source = preg_replace('#^\s*//.*$#m', '', (string) $source);

            $this->assertStringContainsString(
                'href="/become-creator"',
                (string) $source,
                basename($file).' no longer links to the conversion page.'
            );
        }
    }

    /**
     * The card on the gifter's own profile is gated on BOTH the owner and the
     * role. `/{username}` is the public profile as well, so without the owner
     * gate every visitor to a fan's page is invited to convert an account that is
     * not theirs.
     */
    public function test_the_profile_card_is_owner_and_role_gated(): void
    {
        $source = (string) file_get_contents(resource_path('js/Pages/Dashboard.jsx'));

        $this->assertStringContainsString(
            'IsloggedIn && !isCreatorProfile && (',
            $source,
            'The Become-a-creator card lost its owner or role gate.'
        );
    }
}

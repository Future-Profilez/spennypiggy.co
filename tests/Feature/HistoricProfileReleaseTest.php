<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ProfileReleaseTiers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The three-tier release (client D6, confirmed 11 Sep 2026).
 *
 * 🚨 THE ASSERTIONS THAT MATTER ARE THE REFUSALS. Releasing somebody who should have
 * waited cannot be undone quietly — their page is public — so every test here that proves
 * a creator is NOT released is worth more than the ones proving somebody is.
 */
class HistoricProfileReleaseTest extends TestCase
{
    use RefreshDatabase;

    private function heldCreator(array $attributes = []): User
    {
        $user = User::factory()->create(['role' => 1] + $attributes);

        DB::table('users')->where('id', $user->id)->update([
            'profile_status_lock' => 0,
            'avatar' => 'avatar-uuid',
            'bio' => 'A real bio about the things I make.',
        ] + $attributes);

        return $user->fresh();
    }

    public function test_a_creator_nobody_ever_judged_is_released(): void
    {
        // D6's first category: "submitted/undecided".
        $creator = $this->heldCreator(['profile_reject_reason' => null]);

        $this->assertSame(
            ProfileReleaseTiers::TIER_AUTO,
            ProfileReleaseTiers::classify($creator)['tier']
        );
    }

    public function test_an_asset_quality_rejection_is_released(): void
    {
        $creator = $this->heldCreator(['profile_reject_reason' => 'update your social media handle']);

        $this->assertSame(
            ProfileReleaseTiers::TIER_AUTO,
            ProfileReleaseTiers::classify($creator)['tier']
        );
    }

    public function test_an_unreadable_reason_counts_as_no_reason(): void
    {
        /*
         * Measured on the live database: `sdfsdfsfsd` and `sdfsdfsdfsdfsdffsdf` — keyboard
         * mash typed to satisfy a required field. Treating those as written judgements
         * would park real creators in a manual queue for ever over a string saying nothing.
         */
        $creator = $this->heldCreator(['profile_reject_reason' => 'sdfsdfsfsd']);

        $this->assertSame(
            ProfileReleaseTiers::TIER_AUTO,
            ProfileReleaseTiers::classify($creator)['tier']
        );
    }

    public function test_a_written_judgement_waits_for_a_person(): void
    {
        $creator = $this->heldCreator([
            'profile_reject_reason' => 'This page is selling something we do not allow and the wording was deliberate.',
        ]);

        $this->assertSame(
            ProfileReleaseTiers::TIER_MANUAL,
            ProfileReleaseTiers::classify($creator)['tier']
        );
    }

    public function test_a_policy_or_fraud_judgement_is_never_auto_released(): void
    {
        foreach ([
            'this account is impersonating another creator',
            'not a legitimate creator',
            'adult content on the profile photo',
        ] as $reason) {
            $creator = $this->heldCreator(['profile_reject_reason' => $reason]);

            $this->assertSame(
                ProfileReleaseTiers::TIER_NEVER,
                ProfileReleaseTiers::classify($creator)['tier'],
                "A rejection reading \"{$reason}\" must never be released automatically."
            );
        }
    }

    public function test_a_suspended_account_is_never_released_however_mild_the_reason(): void
    {
        /*
         * 🚨 SUSPENSION OUTRANKS THE REASON TEXT. A suspended creator carrying a benign
         * rejection would otherwise be read as asset-quality and let straight back in —
         * D6 names suspension as never-auto explicitly.
         */
        $creator = $this->heldCreator([
            'profile_reject_reason' => 'update your social media handle',
            'suspended_account' => 1,
        ]);

        $this->assertSame(
            ProfileReleaseTiers::TIER_NEVER,
            ProfileReleaseTiers::classify($creator)['tier']
        );
    }

    public function test_the_worst_thing_said_decides_the_tier(): void
    {
        // A benign phrase AND a serious one in the same sentence is a serious rejection.
        $creator = $this->heldCreator([
            'profile_reject_reason' => 'blurry profile photo, and the account looks fake',
        ]);

        $this->assertSame(
            ProfileReleaseTiers::TIER_NEVER,
            ProfileReleaseTiers::classify($creator)['tier']
        );
    }

    public function test_the_command_reports_without_releasing_anything(): void
    {
        /*
         * 🚨 D6 ORDERS THE STEPS: "Send production counts BEFORE the release runs."
         * A command that released on its default invocation would make that impossible
         * to comply with — the counts and the release would be the same action.
         */
        $creator = $this->heldCreator(['profile_reject_reason' => null]);

        $this->artisan('profiles:release-historic')->assertSuccessful();

        $this->assertSame(
            0,
            (int) DB::table('users')->where('id', $creator->id)->value('profile_status_lock'),
            'The report must not move anybody.'
        );
    }

    public function test_applying_releases_only_the_auto_group(): void
    {
        $auto = $this->heldCreator(['profile_reject_reason' => 'update your social media handle']);
        $manual = $this->heldCreator([
            'profile_reject_reason' => 'This page is selling something we do not allow and the wording was deliberate.',
        ]);
        $never = $this->heldCreator([
            'profile_reject_reason' => 'update your social media handle',
            'suspended_account' => 1,
        ]);

        $this->artisan('profiles:release-historic', ['--apply' => true, '--no-mail' => true])
            ->assertSuccessful();

        $this->assertNull(
            DB::table('users')->where('id', $auto->id)->value('profile_reject_reason'),
            'An auto-tier creator keeps a stale rejection reason.'
        );

        $this->assertNotNull(
            DB::table('users')->where('id', $manual->id)->value('profile_reject_reason'),
            'A written judgement was cleared by a sweep.'
        );

        $this->assertNotNull(
            DB::table('users')->where('id', $never->id)->value('profile_reject_reason'),
            'A suspended creator was released.'
        );
    }
}

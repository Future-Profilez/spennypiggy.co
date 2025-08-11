<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\UserVerificationStatus;
use Illuminate\Database\Eloquent\Builder;

class UserVerificationStatusScopesTest extends TestCase
{
    /**
     * Test that the pendingCreatorProfiles scope exists and returns a Builder.
     */
    public function test_pending_creator_profiles_scope_exists()
    {
        $query = UserVerificationStatus::pendingCreatorProfiles();
        
        $this->assertInstanceOf(Builder::class, $query);
        $this->assertStringContainsString('exists', $query->toSql());
    }

    /**
     * Test that the pendingGifterProfiles scope exists and returns a Builder.
     */
    public function test_pending_gifter_profiles_scope_exists()
    {
        $query = UserVerificationStatus::pendingGifterProfiles();
        
        $this->assertInstanceOf(Builder::class, $query);
        $this->assertStringContainsString('exists', $query->toSql());
    }

    /**
     * Test that both scopes can be combined.
     */
    public function test_combined_scopes_work()
    {
        $query = UserVerificationStatus::where(function ($query) {
            $query->where(function ($q) {
                $q->pendingCreatorProfiles();
            })->orWhere(function ($q) {
                $q->pendingGifterProfiles();
            });
        });

        $this->assertInstanceOf(Builder::class, $query);
        $sql = $query->toSql();
        $this->assertStringContainsString('exists', $sql);
        $this->assertStringContainsString('or', strtolower($sql));
    }

    /**
     * Test pendingCreatorProfiles scope with factory data.
     */
    public function test_pending_creator_profiles_scope_with_data()
    {
        // Create users and verification statuses for testing
        
        // Pending creator - should be found
        $pendingCreator = User::factory()->create([
            'role' => 1,
            'avatar' => 'some-uuid',
            'avatar_approved' => 0,
            'bio' => 'Some bio',
            'bio_approved' => 0,
            'profile_status_lock' => 1,
            'is_subscribed' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $pendingCreator->id,
            'role' => 1,
        ]);

        // Approved creator - should not be found
        $approvedCreator = User::factory()->create([
            'role' => 1,
            'avatar' => 'some-uuid',
            'avatar_approved' => 1, // Approved
            'bio' => 'Some bio',
            'bio_approved' => 1, // Approved
            'profile_status_lock' => 2, // Approved
            'is_subscribed' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $approvedCreator->id,
            'role' => 1,
        ]);

        // Non-creator - should not be found by creator scope
        $gifter = User::factory()->create([
            'role' => 0, // Gifter
            'is_500_limit_exceeded' => 1,
            'is_subscribed' => 1,
            'profile_status_lock' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $gifter->id,
            'role' => 0,
        ]);

        $pendingCreators = UserVerificationStatus::pendingCreatorProfiles()->get();

        $this->assertCount(1, $pendingCreators);
        $this->assertEquals($pendingCreator->id, $pendingCreators->first()->user_id);
    }

    /**
     * Test pendingGifterProfiles scope with factory data.
     */
    public function test_pending_gifter_profiles_scope_with_data()
    {
        // Pending gifter - should be found
        $pendingGifter = User::factory()->create([
            'role' => 0,
            'is_500_limit_exceeded' => 1,
            'is_subscribed' => 1,
            'profile_status_lock' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $pendingGifter->id,
            'role' => 0,
        ]);

        // Non-pending gifter - should not be found
        $regularGifter = User::factory()->create([
            'role' => 0,
            'is_500_limit_exceeded' => 0, // Has not exceeded limit
            'is_subscribed' => 1,
            'profile_status_lock' => 0,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $regularGifter->id,
            'role' => 0,
        ]);

        // Creator - should not be found by gifter scope
        $creator = User::factory()->create([
            'role' => 1, // Creator
            'avatar' => 'some-uuid',
            'avatar_approved' => 0,
            'bio' => 'Some bio',
            'bio_approved' => 0,
            'profile_status_lock' => 1,
            'is_subscribed' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $creator->id,
            'role' => 1,
        ]);

        $pendingGifters = UserVerificationStatus::pendingGifterProfiles()->get();

        $this->assertCount(1, $pendingGifters);
        $this->assertEquals($pendingGifter->id, $pendingGifters->first()->user_id);
    }

    /**
     * Test combined scope behavior with mixed data.
     */
    public function test_combined_scopes_with_mixed_data()
    {
        // Create pending creator
        $pendingCreator = User::factory()->create([
            'role' => 1,
            'avatar' => 'some-uuid',
            'avatar_approved' => 0,
            'bio' => 'Some bio',
            'bio_approved' => 0,
            'profile_status_lock' => 1,
            'is_subscribed' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $pendingCreator->id,
            'role' => 1,
        ]);

        // Create pending gifter
        $pendingGifter = User::factory()->create([
            'role' => 0,
            'is_500_limit_exceeded' => 1,
            'is_subscribed' => 1,
            'profile_status_lock' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $pendingGifter->id,
            'role' => 0,
        ]);

        // Create approved users (should not appear)
        $approvedCreator = User::factory()->create([
            'role' => 1,
            'avatar' => 'some-uuid',
            'avatar_approved' => 1,
            'bio' => 'Some bio',
            'bio_approved' => 1,
            'profile_status_lock' => 2,
            'is_subscribed' => 1,
        ]);
        UserVerificationStatus::factory()->create([
            'user_id' => $approvedCreator->id,
            'role' => 1,
        ]);

        // Test combined query
        $allPending = UserVerificationStatus::where(function ($query) {
            $query->where(function ($q) {
                $q->pendingCreatorProfiles();
            })->orWhere(function ($q) {
                $q->pendingGifterProfiles();
            });
        })->get();

        $this->assertCount(2, $allPending);
        
        $userIds = $allPending->pluck('user_id')->toArray();
        $this->assertContains($pendingCreator->id, $userIds);
        $this->assertContains($pendingGifter->id, $userIds);
        $this->assertNotContains($approvedCreator->id, $userIds);
    }
}

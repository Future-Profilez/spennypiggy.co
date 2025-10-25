<?php

namespace Tests\Unit\Commands;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Artisan;
use App\Notifications\PendingApprovalNotification;
use App\Models\{WishItem, User, UserVerificationStatus};

class SendPendingApprovalNotificationsEditExclusionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        
        // Set test environment URL to trigger email sending
        config(['app.url' => 'https://dev.spennypiggy.co']);
        
        // Ensure pending-approval config is loaded
        config([
            'pending-approval' => [
                'development' => [
                    'domains' => ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'],
                    'emails'  => ['naveen@internetbusinesssolutionsindia.com', 'prem@futureprofilez.com'],
                ],
                'production' => [
                    'domains' => ['https://spennypiggy.co'],
                    'emails'  => ['jack@socialvortex.io', 'naveen@internetbusinesssolutionsindia.com'],
                ],
            ]
        ]);
    }

    /** @test */
    public function it_excludes_wish_items_with_pending_edit_requests()
    {
        $user = User::factory()->create();
        
        // Create unapproved wish items without edit requests (should be included)
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => null,
        ]);
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => 1, // Edit already processed
        ]);
        
        // Create unapproved wish items with pending edit requests (should be excluded)
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => 0, // Pending edit request
            'edited_reason' => 'Need to update price',
        ]);
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => 0, // Pending edit request
            'edited_reason' => 'Need to change description',
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertNotNull($wishItemsData);
                // Should only count the 2 items without pending edit requests
                $this->assertEquals(2, $wishItemsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_excludes_users_with_bio_edit_requests()
    {
        // Create users with unapproved avatars but no bio edit requests (should be included)
        User::factory()->create([
            'avatar' => 'avatar1.jpg',
            'avatar_approved' => 0,
            'edit_bio_reason' => null,
        ]);
        User::factory()->create([
            'avatar' => 'avatar2.jpg', 
            'avatar_approved' => 0,
            'edit_bio_reason' => null,
        ]);
        
        // Create users with unapproved avatars and bio edit requests (should be excluded)
        User::factory()->create([
            'avatar' => 'avatar3.jpg',
            'avatar_approved' => 0,
            'edit_bio_reason' => 'Want to update my bio with new info',
        ]);
        User::factory()->create([
            'avatar' => 'avatar4.jpg',
            'avatar_approved' => 0,
            'edit_bio_reason' => 'Need to change bio content',
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $userAvatarsData = collect($pendingSummary)->firstWhere('label', 'User Avatars');
                $this->assertNotNull($userAvatarsData);
                // Should only count the 2 users without bio edit requests
                $this->assertEquals(2, $userAvatarsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_excludes_user_profiles_with_bio_edit_requests()
    {
        // Create creators without bio edit requests (should be included)
        $creator1 = User::factory()->create([
            'role' => 1,
            'avatar' => 'creator1.jpg',
            'bio' => 'Creator bio 1',
            'profile_status_lock' => 1,
            'is_subscribed' => 1,
            'edit_bio_reason' => null,
        ]);
        UserVerificationStatus::factory()->for($creator1)->create();
        
        $creator2 = User::factory()->create([
            'role' => 1,
            'avatar' => 'creator2.jpg',
            'bio' => 'Creator bio 2', 
            'profile_status_lock' => 1,
            'is_subscribed' => 1,
            'edit_bio_reason' => null,
        ]);
        UserVerificationStatus::factory()->for($creator2)->create();
        
        // Create creators with bio edit requests (should be excluded)
        $creator3 = User::factory()->create([
            'role' => 1,
            'avatar' => 'creator3.jpg',
            'bio' => 'Creator bio 3',
            'profile_status_lock' => 1,
            'is_subscribed' => 1,
            'edit_bio_reason' => 'Want to update my creator bio',
        ]);
        UserVerificationStatus::factory()->for($creator3)->create();

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $userProfilesData = collect($pendingSummary)->firstWhere('label', 'User Profiles');
                $this->assertNotNull($userProfilesData);
                // Should only count the 2 creators without bio edit requests
                $this->assertEquals(2, $userProfilesData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_handles_mixed_edit_status_scenarios()
    {
        $user = User::factory()->create();
        
        // Mix of wish items with different edit statuses
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => null, // No edit request - should be included
        ]);
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0, 
            'edited_status' => 0, // Pending edit - should be excluded
            'edited_reason' => 'Pending edit',
        ]);
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => 1, // Edit processed - should be included
            'edited_reason' => 'Edit completed',
        ]);
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => 2, // Edit rejected or other status - should be included
            'edited_reason' => 'Edit rejected',
        ]);
        
        // Mix of users with different bio edit scenarios
        User::factory()->create([
            'avatar' => 'avatar1.jpg',
            'avatar_approved' => 0,
            'edit_bio_reason' => null, // No bio edit request - should be included
        ]);
        User::factory()->create([
            'avatar' => 'avatar2.jpg',
            'avatar_approved' => 0, 
            'edit_bio_reason' => 'Bio edit pending', // Has bio edit request - should be excluded
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                // Check wish items - should include 3 (null, 1, and 2 status)
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertNotNull($wishItemsData);
                $this->assertEquals(3, $wishItemsData['count']);
                
                // Check user avatars - should include 1 (without bio edit request)
                $userAvatarsData = collect($pendingSummary)->firstWhere('label', 'User Avatars');
                $this->assertNotNull($userAvatarsData);
                $this->assertEquals(1, $userAvatarsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_logs_no_pending_items_when_all_have_edit_requests()
    {
        $user = User::factory()->create();
        
        // Create only wish items with pending edit requests
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => 0,
            'edited_reason' => 'Edit pending',
        ]);
        
        // Create only users with bio edit requests
        User::factory()->create([
            'avatar' => 'avatar.jpg',
            'avatar_approved' => 0,
            'edit_bio_reason' => 'Bio edit pending',
        ]);

        $exitCode = Artisan::call('app:notifications-pending-approval');
        
        $this->assertEquals(0, $exitCode);
        
        // No notification should be sent since all items have pending edits
        Notification::assertNothingSent();
    }

    /** @test */
    public function it_includes_icons_in_notification_data()
    {
        $user = User::factory()->create();
        
        // Create one unapproved wish item without edit request
        WishItem::factory()->for($user)->unapproved()->create([
            'is_approved' => 0,
            'edited_status' => null,
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertNotNull($wishItemsData);
                $this->assertEquals(1, $wishItemsData['count']);
                
                // Check that icon is included
                $this->assertArrayHasKey('icon', $wishItemsData);
                $this->assertEquals('🎁', $wishItemsData['icon']);
                
                return true;
            }
        );
    }
}

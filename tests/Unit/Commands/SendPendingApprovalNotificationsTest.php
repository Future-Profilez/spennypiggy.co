<?php

namespace Tests\Unit\Commands;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\SendPendingApprovalNotifications;
use App\Notifications\PendingApprovalNotification;
use App\Models\{
    WishItem,
    Membership,
    Bills,
    Shop,
    UserIntro,
    User,
    UserVerificationStatus,
    Post
};

class SendPendingApprovalNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        
        // Set test environment URL to trigger email sending
        config(['app.url' => 'https://dev.spennypiggy.co']);
    }

    /** @test */
    public function it_collects_unapproved_wish_items()
    {
        // Create approved and unapproved wish items
        $approvedUser = User::factory()->create();
        $unapprovedUser = User::factory()->create();
        
        WishItem::factory()->for($approvedUser)->create(['is_approved' => 1]);
        WishItem::factory()->for($unapprovedUser)->unapproved()->create(['is_approved' => 0]);
        WishItem::factory()->for($unapprovedUser)->unapproved()->create(['is_approved' => 0]);

        $exitCode = Artisan::call('app:notifications-pending-approval');
        
        $this->assertEquals(0, $exitCode);
        
        // Verify notification was sent with correct data
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertNotNull($wishItemsData);
                $this->assertEquals(2, $wishItemsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_unapproved_memberships()
    {
        $user = User::factory()->create();
        
        Membership::factory()->for($user)->create(['approved' => true]);
        Membership::factory()->for($user)->unapproved()->create(['approved' => false]);
        Membership::factory()->for($user)->unapproved()->create(['approved' => false]);
        Membership::factory()->for($user)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $membershipsData = collect($pendingSummary)->firstWhere('label', 'Memberships');
                $this->assertNotNull($membershipsData);
                $this->assertEquals(3, $membershipsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_unapproved_bills()
    {
        $user = User::factory()->create();
        
        Bills::factory()->for($user)->create(['approved' => true]);
        Bills::factory()->for($user)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $billsData = collect($pendingSummary)->firstWhere('label', 'Bills');
                $this->assertNotNull($billsData);
                $this->assertEquals(1, $billsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_unapproved_shops()
    {
        $user = User::factory()->create();
        
        Shop::factory()->for($user)->create(['approved' => true]);
        Shop::factory()->for($user)->unapproved()->create(['approved' => false]);
        Shop::factory()->for($user)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $shopsData = collect($pendingSummary)->firstWhere('label', 'Shops');
                $this->assertNotNull($shopsData);
                $this->assertEquals(2, $shopsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_unapproved_user_intros()
    {
        $user = User::factory()->create();
        
        UserIntro::factory()->for($user)->create(['approved' => true]);
        UserIntro::factory()->for($user)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $userIntrosData = collect($pendingSummary)->firstWhere('label', 'User Intros');
                $this->assertNotNull($userIntrosData);
                $this->assertEquals(1, $userIntrosData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_unapproved_user_avatars()
    {
        // Create users with approved and unapproved avatars
        User::factory()->create(['avatar' => 'avatar1.jpg', 'avatar_approved' => 1]);
        User::factory()->create(['avatar' => 'avatar2.jpg', 'avatar_approved' => 0]);
        User::factory()->create(['avatar' => 'avatar3.jpg', 'avatar_approved' => 0]);
        User::factory()->create(['avatar' => null, 'avatar_approved' => 0]); // Should be excluded

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $userAvatarsData = collect($pendingSummary)->firstWhere('label', 'User Avatars');
                $this->assertNotNull($userAvatarsData);
                $this->assertEquals(2, $userAvatarsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_pending_creator_profiles()
    {
        // Create creator with pending profile
        $creator = User::factory()->create([
            'role' => 1,
            'avatar' => 'creator_avatar.jpg',
            'avatar_approved' => 0,
            'bio' => 'Creator bio',
            'bio_approved' => 0,
            'profile_status_lock' => 1,
            'is_subscribed' => 1
        ]);

        // Create approved creator (should be excluded)
        $approvedCreator = User::factory()->create([
            'role' => 1,
            'avatar' => 'approved_avatar.jpg',
            'avatar_approved' => 1,
            'bio' => 'Approved bio',
            'bio_approved' => 1,
        ]);

        // Create verification status records
        UserVerificationStatus::factory()->for($creator)->create();
        UserVerificationStatus::factory()->for($approvedCreator)->create();

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $userProfilesData = collect($pendingSummary)->firstWhere('label', 'User Profiles');
                $this->assertNotNull($userProfilesData);
                $this->assertEquals(1, $userProfilesData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_pending_gifter_profiles()
    {
        // Create gifter with pending profile
        $gifter = User::factory()->create([
            'role' => 0,
            'is_500_limit_exceeded' => 1,
            'is_subscribed' => 1,
            'profile_status_lock' => 1
        ]);

        // Create regular gifter (should be excluded)
        $regularGifter = User::factory()->create([
            'role' => 0,
            'is_500_limit_exceeded' => 0,
        ]);

        // Create verification status records
        UserVerificationStatus::factory()->for($gifter)->create();
        UserVerificationStatus::factory()->for($regularGifter)->create();

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $userProfilesData = collect($pendingSummary)->firstWhere('label', 'User Profiles');
                $this->assertNotNull($userProfilesData);
                $this->assertEquals(1, $userProfilesData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_collects_unapproved_posts()
    {
        $user = User::factory()->create();
        
        Post::factory()->for($user)->create(['approved' => true]);
        Post::factory()->for($user)->unapproved()->create(['approved' => false]);
        Post::factory()->for($user)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $postsData = collect($pendingSummary)->firstWhere('label', 'Posts');
                $this->assertNotNull($postsData);
                $this->assertEquals(2, $postsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_excludes_soft_deleted_records()
    {
        $user = User::factory()->create();
        
        // Create unapproved records
        $wishItem = WishItem::factory()->for($user)->unapproved()->create(['is_approved' => 0]);
        $membership = Membership::factory()->for($user)->unapproved()->create(['approved' => false]);
        $bill = Bills::factory()->for($user)->unapproved()->create(['approved' => false]);
        $shop = Shop::factory()->for($user)->unapproved()->create(['approved' => false]);
        $userIntro = UserIntro::factory()->for($user)->unapproved()->create(['approved' => false]);
        $post = Post::factory()->for($user)->unapproved()->create(['approved' => false]);

        // Soft delete some records
        $wishItem->delete();
        $membership->delete();
        $bill->delete();
        $shop->delete();
        $userIntro->delete();
        $post->delete();

        // Create one non-deleted unapproved record to ensure notification is still sent
        WishItem::factory()->for($user)->unapproved()->create(['is_approved' => 0]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                // Should only have the non-deleted wish item
                $this->assertCount(1, $pendingSummary);
                
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertNotNull($wishItemsData);
                $this->assertEquals(1, $wishItemsData['count']);
                
                // These should not exist because all records were soft-deleted
                $this->assertNull(collect($pendingSummary)->firstWhere('label', 'Memberships'));
                $this->assertNull(collect($pendingSummary)->firstWhere('label', 'Bills'));
                $this->assertNull(collect($pendingSummary)->firstWhere('label', 'Shops'));
                $this->assertNull(collect($pendingSummary)->firstWhere('label', 'User Intros'));
                $this->assertNull(collect($pendingSummary)->firstWhere('label', 'Posts'));
                
                return true;
            }
        );
    }

    /** @test */
    public function it_handles_mixed_approved_and_unapproved_records()
    {
        $user = User::factory()->create();
        
        // Create mixed records for each type
        WishItem::factory()->for($user)->create(['is_approved' => 1]);
        WishItem::factory()->for($user)->unapproved()->create(['is_approved' => 0]);
        WishItem::factory()->for($user)->unapproved()->create(['is_approved' => 0]);
        
        Membership::factory()->for($user)->create(['approved' => true]);
        Membership::factory()->for($user)->unapproved()->create(['approved' => false]);
        
        Bills::factory()->for($user)->create(['approved' => true]);
        Bills::factory()->for($user)->create(['approved' => true]);
        Bills::factory()->for($user)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                // Should have 3 sections: Wish Items, Memberships, Bills
                $this->assertCount(3, $pendingSummary);
                
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertEquals(2, $wishItemsData['count']);
                
                $membershipsData = collect($pendingSummary)->firstWhere('label', 'Memberships');
                $this->assertEquals(1, $membershipsData['count']);
                
                $billsData = collect($pendingSummary)->firstWhere('label', 'Bills');
                $this->assertEquals(1, $billsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_does_not_send_notification_when_no_pending_items()
    {
        $user = User::factory()->create();
        
        // Create only approved records
        WishItem::factory()->for($user)->create(['is_approved' => 1]);
        Membership::factory()->for($user)->create(['approved' => true]);
        Bills::factory()->for($user)->create(['approved' => true]);
        Shop::factory()->for($user)->create(['approved' => true]);
        UserIntro::factory()->for($user)->create(['approved' => true]);
        Post::factory()->for($user)->create(['approved' => true]);

        Artisan::call('app:notifications-pending-approval');
        
        // No notification should be sent
        Notification::assertNothingSent();
    }

    /** @test */
    public function it_only_includes_records_with_valid_user_relations()
    {
        $validUser = User::factory()->create();
        
        // Create unapproved records for valid user
        WishItem::factory()->for($validUser)->unapproved()->create(['is_approved' => 0]);
        Membership::factory()->for($validUser)->unapproved()->create(['approved' => false]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                $this->assertCount(2, $pendingSummary);
                
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertEquals(1, $wishItemsData['count']);
                
                $membershipsData = collect($pendingSummary)->firstWhere('label', 'Memberships');
                $this->assertEquals(1, $membershipsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_handles_all_content_types_simultaneously()
    {
        $user = User::factory()->create();
        
        // Create one unapproved record of each type
        WishItem::factory()->for($user)->unapproved()->create(['is_approved' => 0]);
        Membership::factory()->for($user)->unapproved()->create(['approved' => false]);
        Bills::factory()->for($user)->unapproved()->create(['approved' => false]);
        Shop::factory()->for($user)->unapproved()->create(['approved' => false]);
        UserIntro::factory()->for($user)->unapproved()->create(['approved' => false]);
        Post::factory()->for($user)->unapproved()->create(['approved' => false]);
        
        // Create unapproved user avatar
        $userWithAvatar = User::factory()->create(['avatar' => 'test_avatar.jpg', 'avatar_approved' => 0]);
        
        // Create pending creator profile
        $creator = User::factory()->create([
            'role' => 1,
            'avatar' => 'creator_avatar.jpg',
            'avatar_approved' => 0,
            'bio' => 'Creator bio',
            'bio_approved' => 0,
            'profile_status_lock' => 1,
            'is_subscribed' => 1
        ]);
        UserVerificationStatus::factory()->for($creator)->create();

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                // Should have all 8 content types
                $this->assertCount(8, $pendingSummary);
                
                $expectedTypes = [
                    'Wish Items', 'Memberships', 'Bills', 'Shops', 
                    'User Intros', 'User Avatars', 'User Profiles', 'Posts'
                ];
                
                foreach ($expectedTypes as $type) {
                    $typeData = collect($pendingSummary)->firstWhere('label', $type);
                    $this->assertNotNull($typeData, "Missing pending summary for: {$type}");
                    $this->assertGreaterThanOrEqual(1, $typeData['count'], "No pending items for: {$type}");
                }
                
                return true;
            }
        );
    }
}

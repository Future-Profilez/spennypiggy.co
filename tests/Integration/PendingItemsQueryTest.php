<?php

namespace Tests\Integration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Notifications\PendingApprovalNotification;

class PendingItemsQueryTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        
        // Set test environment URL to trigger email sending
        config(['app.url' => 'https://dev.spennypiggy.co']);
    }

    /** @test */
    public function it_collects_and_counts_unapproved_wish_items()
    {
        // Create test users with minimal data
        $user1Id = DB::table('users')->insertGetId([
            'name' => 'Test User 1',
            'email' => 'test1@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user2Id = DB::table('users')->insertGetId([
            'name' => 'Test User 2',
            'email' => 'test2@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser2',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create approved and unapproved wish items
        DB::table('wish_items')->insert([
            'user_id' => $user1Id,
            'wishname' => 'Approved Item',
            'price' => 100.00,
            'currency' => 'GBP',
            'is_approved' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('wish_items')->insert([
            'user_id' => $user2Id,
            'wishname' => 'Unapproved Item 1',
            'price' => 50.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('wish_items')->insert([
            'user_id' => $user2Id,
            'wishname' => 'Unapproved Item 2',
            'price' => 75.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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
    public function it_collects_and_counts_unapproved_memberships()
    {
        // Create test user
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create mix of approved and unapproved memberships
        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'gold',
            'price' => 10.00,
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'silver',
            'price' => 5.00,
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'bronze',
            'price' => 3.00,
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'platinum',
            'price' => 20.00,
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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
    public function it_collects_and_counts_unapproved_bills()
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Approved Bill',
            'price' => 100.00,
            'currency' => 'GBP',
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Unapproved Bill',
            'price' => 50.00,
            'currency' => 'GBP',
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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
    public function it_excludes_soft_deleted_records_from_wish_items()
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create unapproved wish item and then soft delete it
        $wishItemId = DB::table('wish_items')->insertGetId([
            'user_id' => $userId,
            'wishname' => 'Soft Deleted Item',
            'price' => 50.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Soft delete the wish item
        DB::table('wish_items')
            ->where('id', $wishItemId)
            ->update(['deleted_at' => now()]);

        // Create one non-deleted unapproved record to ensure notification is still sent
        DB::table('wish_items')->insert([
            'user_id' => $userId,
            'wishname' => 'Active Unapproved Item',
            'price' => 75.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                // Should only have 1 wish item (the non-deleted one)
                $wishItemsData = collect($pendingSummary)->firstWhere('label', 'Wish Items');
                $this->assertNotNull($wishItemsData);
                $this->assertEquals(1, $wishItemsData['count']);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_handles_mixed_approved_and_unapproved_records()
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create mixed wish items
        DB::table('wish_items')->insert([
            'user_id' => $userId,
            'wishname' => 'Approved Wish Item',
            'price' => 100.00,
            'currency' => 'GBP',
            'is_approved' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('wish_items')->insert([
            'user_id' => $userId,
            'wishname' => 'Unapproved Wish Item 1',
            'price' => 50.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('wish_items')->insert([
            'user_id' => $userId,
            'wishname' => 'Unapproved Wish Item 2',
            'price' => 75.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create mixed memberships
        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'gold',
            'price' => 10.00,
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'silver',
            'price' => 5.00,
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create mixed bills
        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Approved Bill 1',
            'price' => 100.00,
            'currency' => 'GBP',
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Approved Bill 2',
            'price' => 200.00,
            'currency' => 'GBP',
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Unapproved Bill',
            'price' => 150.00,
            'currency' => 'GBP',
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create only approved records
        DB::table('wish_items')->insert([
            'user_id' => $userId,
            'wishname' => 'Approved Wish Item',
            'price' => 100.00,
            'currency' => 'GBP',
            'is_approved' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'gold',
            'price' => 10.00,
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Approved Bill',
            'price' => 100.00,
            'currency' => 'GBP',
            'approved' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        // No notification should be sent
        Notification::assertNothingSent();
    }

    /** @test */
    public function it_counts_basic_content_types_when_available()
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'username' => 'testuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create one unapproved record of each basic type
        DB::table('wish_items')->insert([
            'user_id' => $userId,
            'wishname' => 'Unapproved Wish Item',
            'price' => 50.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $userId,
            'level' => 'silver',
            'price' => 5.00,
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('bills')->insert([
            'user_id' => $userId,
            'name' => 'Unapproved Bill',
            'price' => 100.00,
            'currency' => 'GBP',
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Artisan::call('app:notifications-pending-approval');
        
        Notification::assertSentTo(
            Notification::route('mail', 'prem@futureprofilez.com'),
            PendingApprovalNotification::class,
            function ($notification) {
                $pendingSummary = $notification->pendingSummary;
                
                // Should have at least 3 content types
                $this->assertGreaterThanOrEqual(3, count($pendingSummary));
                
                $expectedTypes = ['Wish Items', 'Memberships', 'Bills'];
                
                foreach ($expectedTypes as $type) {
                    $typeData = collect($pendingSummary)->firstWhere('label', $type);
                    $this->assertNotNull($typeData, "Missing pending summary for: {$type}");
                    $this->assertGreaterThanOrEqual(1, $typeData['count'], "No pending items for: {$type}");
                }
                
                return true;
            }
        );
    }

    /** @test */
    public function it_only_includes_records_with_valid_user_relations()
    {
        $validUserId = DB::table('users')->insertGetId([
            'name' => 'Valid User',
            'email' => 'valid@example.com',
            'password' => bcrypt('password'),
            'username' => 'validuser',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create unapproved records for valid user
        DB::table('wish_items')->insert([
            'user_id' => $validUserId,
            'wishname' => 'Valid User Wish Item',
            'price' => 50.00,
            'currency' => 'GBP',
            'is_approved' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('memberships')->insert([
            'user_id' => $validUserId,
            'level' => 'silver',
            'price' => 5.00,
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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
}

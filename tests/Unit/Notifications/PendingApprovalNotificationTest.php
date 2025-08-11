<?php

namespace Tests\Unit\Notifications;

use Tests\TestCase;
use App\Notifications\PendingApprovalNotification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\View;

class PendingApprovalNotificationTest extends TestCase
{
    /** @test */
    public function it_can_create_a_mailable_without_exception()
    {
        // Arrange: Create test data for pending summary
        $pendingSummary = [
            [
                'label' => 'Test Items',
                'count' => 2,
                'items' => collect([
                    (object) ['id' => 1, 'name' => 'Test Item 1'],
                    (object) ['id' => 2, 'name' => 'Test Item 2'],
                ])
            ]
        ];

        // Act: Create notification and generate mailable
        $notification = new PendingApprovalNotification($pendingSummary);
        
        // Create a fake notifiable (can be any object with required interface)
        $notifiable = new class {
            public function routeNotificationForMail() {
                return 'test@example.com';
            }
        };

        // Assert: This should not throw an exception during mailable creation
        // We're mainly testing that the Mailable object gets created without error
        $mailable = null;
        try {
            $mailable = $notification->toMail($notifiable);
        } catch (\Exception $e) {
            $this->fail('Mailable creation threw an exception: ' . $e->getMessage());
        }
        
        // Verify the mailable is created properly
        $this->assertInstanceOf(MailMessage::class, $mailable);
        $this->assertEquals('Summary of Pending Approvals', $mailable->subject);
    }

    /** @test */
    public function it_implements_should_queue_interface()
    {
        // Assert: Confirm the notification implements ShouldQueue
        $notification = new PendingApprovalNotification([]);
        
        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, $notification);
    }

    /** @test */
    public function it_uses_mail_channel()
    {
        // Arrange
        $notification = new PendingApprovalNotification([]);
        $notifiable = new class {
            public function routeNotificationForMail() {
                return 'test@example.com';
            }
        };

        // Act & Assert
        $channels = $notification->via($notifiable);
        
        $this->assertIsArray($channels);
        $this->assertContains('mail', $channels);
    }

    /** @test */
    public function it_handles_empty_pending_summary()
    {
        // Arrange: Empty pending summary
        $pendingSummary = [];

        // Act: Create notification with empty data
        $notification = new PendingApprovalNotification($pendingSummary);
        
        $notifiable = new class {
            public function routeNotificationForMail() {
                return 'test@example.com';
            }
        };

        // Assert: Should still work without exception
        $mailable = null;
        try {
            $mailable = $notification->toMail($notifiable);
        } catch (\Exception $e) {
            $this->fail('Mailable creation with empty data threw an exception: ' . $e->getMessage());
        }
        
        $this->assertInstanceOf(MailMessage::class, $mailable);
        $this->assertEquals('Summary of Pending Approvals', $mailable->subject);
    }
}

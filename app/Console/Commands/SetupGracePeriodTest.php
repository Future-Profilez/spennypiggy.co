<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Task;
use App\Models\TaskPurchase;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SetupGracePeriodTest extends Command
{
    protected $signature = 'app:setup-grace-period-test {email? : The email of the user to assign tasks to}';
    protected $description = 'Creates test data for verifying the Grace Period workflow';

    public function handle()
    {
        $email = $this->argument('email');
        $user = $email ? User::where('email', $email)->first() : User::first();

        if (!$user) {
            $this->error("User not found. Please provide a valid email of an existing user.");
            return;
        }

        $this->info("Setting up test data for user: {$user->name} ({$user->email})");

        // Create a dummy task
        $task = Task::firstOrCreate(
            ['title' => 'Test Grace Period Task'],
            [
                'creator_id' => $user->id,
                'price' => 10,
                'currency' => 'USD',
                'type' => 'timed',
                'sla_hours' => 24,
                'description' => 'A test task for grace period.',
                'status' => 'active',
                'uuid' => Str::uuid(),
                'deliverable_note' => 'Test note'
            ]
        );

        $this->info("Using Task: {$task->title}");

        // 1. Case: Entering Grace Period
        // Deadline passed 30 mins ago, status is 'paid'
        // SLA is 24h. So created_at should be 24.5h ago.
        $this->createPurchase(
            $task, 
            $user, 
            'paid', 
            Carbon::now()->subHours(24)->subMinutes(30), 
            null, 
            'Case 1: Should enter Grace Period (become running_late)'
        );

        // 2. Case: Expired (Refund)
        // Deadline passed 90 mins ago (> 1h grace period)
        $deadline2 = Carbon::now()->subHours(1)->subMinutes(30);
        $this->createPurchase(
            $task, 
            $user, 
            'running_late', 
            $deadline2->copy()->subHours(24), 
            $deadline2, 
            'Case 2: Should Expire and Attempt Refund (Deadline passed 90 mins ago)'
        );

        // Removed Reminder cases as they are not applicable for 1-hour grace period (interval is 12h)

        $this->info("\nTest data created successfully!");
        $this->info("Run 'php artisan app:process-sla-refunds' to see the effects.");
        $this->info("Note: Case 2 (Refund) will show an error in logs if Stripe keys/IDs are fake, which is expected in local dev.");
    }

    private function createPurchase($task, $user, $status, $createdAt, $lastReminderAt, $description)
    {
        $uuid = Str::uuid();
        // Calculate SLA deadline based on created_at + task sla_hours (24)
        $slaDeadline = $createdAt->copy()->addHours($task->sla_hours);

        $purchase = TaskPurchase::create([
            'uuid' => $uuid,
            'task_id' => $task->id,
            'creator_id' => $user->id,
            'supporter_id' => $user->id, // Self-purchase for testing
            'amount' => 10,
            'status' => $status,
            'sla_deadline' => $slaDeadline,
            'created_at' => $createdAt,
            'updated_at' => Carbon::now(),
            'last_reminder_at' => $lastReminderAt,
            'stripe_session_id' => 'test_sess_' . $uuid,
            'payment_intent_id' => 'pi_test_' . $uuid,
        ]);

        $this->line("Created Purchase [{$purchase->uuid}]");
        $this->line("  Desc: {$description}");
        $this->line("  Status: {$status}");
        $this->line("  Deadline: {$slaDeadline->diffForHumans()}");
        if ($lastReminderAt) {
            $this->line("  Last Reminder: {$lastReminderAt->diffForHumans()}");
        }
        $this->newLine();
    }
}

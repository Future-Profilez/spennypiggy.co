<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TaskPurchase;
use App\Models\User;
use App\Models\Task;
use App\Helpers;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskRefunded;
use App\Mail\TaskGracePeriodStartedMail;
use App\Mail\TaskGracePeriodReminderMail;
use App\Mail\TaskRunningLateMail;
use App\Mail\TaskDueSoonMail;
use Stripe\Stripe;
use App\Services\StripeMetadataService;
use Stripe\Refund;
use Carbon\Carbon;

class ProcessSlaRefunds extends Command
{
    protected $signature = 'app:process-sla-refunds';
    protected $description = 'Check for timed tasks that have exceeded their SLA deadline and process grace period or refunds';

    const FINAL_WARNING_HOURS = 4;

    private function getGracePeriodHours()
    {
        return config('tasks.grace_period_hours', 1);
    }

    private function getReminderIntervalHours()
    {
        $frequency = config('tasks.reminder_frequency_daily', 2);
        // Avoid division by zero
        if ($frequency <= 0) $frequency = 2;
        return 24 / $frequency;
    }

    public function handle()
    {
        Log::info('SLA Check command triggered via handle()');
        $this->info('Starting SLA check...');

        $this->processPreDeadlineReminders();
        $this->processGracePeriodEntry();
        $this->processGracePeriodReminders();
        $this->processGracePeriodExpirations();

        $this->info('SLA check completed.');
        Log::info('SLA Check command completed');
    }

    private function processPreDeadlineReminders()
    {
        // Find purchases where deadline is in the next 24 hours and no reminder sent yet
        $preDeadlineHours = 24; 
        $upcomingPurchases = TaskPurchase::whereNotNull('sla_deadline')
            ->where('sla_deadline', '>', Carbon::now())
            ->where('sla_deadline', '<', Carbon::now()->addHours($preDeadlineHours))
            ->whereIn('status', ['pending', 'paid', 'assigned', 'rejected_once'])
            ->whereNull('last_reminder_at') // Only send if no reminder was sent yet
            ->get();

        foreach ($upcomingPurchases as $purchase) {
            $this->info("Sending pre-deadline reminder for purchase UUID: {$purchase->uuid}");
            
            $purchase->last_reminder_at = Carbon::now();
            $purchase->save();

            if ($purchase->creator) {
                try {
                    $hoursLeft = Carbon::now()->diffInHours($purchase->sla_deadline);
                    Log::info("Attempting to send pre-deadline reminder email to creator: {$purchase->creator->email}");
                    
                    Helpers::sendNotification(
                        "Task Due Soon ⏰", 
                        "Your task '{$purchase->task->title}' is due in approximately {$hoursLeft} hours.", 
                        $purchase->creator->email
                    );
                    
                    Mail::to($purchase->creator->email)->send(new TaskDueSoonMail([
                        'title' => $purchase->task->title,
                        'hours_left' => $hoursLeft
                    ]));
                    Log::info("Pre-deadline reminder email sent successfully to {$purchase->creator->email}");
                } catch (\Exception $e) {
                    Log::error("Failed to notify creator about upcoming deadline: " . $e->getMessage());
                }
            }
        }
    }

    private function processGracePeriodEntry()
    {
        // Find purchases that passed SLA deadline but are not yet in grace period (running_late)
        $latePurchases = TaskPurchase::whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', Carbon::now())
            ->whereIn('status', ['pending', 'paid', 'assigned', 'rejected_once'])
            ->where(function ($q) {
                $q->where('refund_status', '!=', 'refunded')->orWhereNull('refund_status');
            })
            ->where('status', '!=', 'running_late')
            ->where('status', '!=', 'pending_review')
            ->whereNotIn('status', ['completed', 'completed_accepted', 'delivered', 'refunded', 'escalated', 'disputed'])
            ->get();

        foreach ($latePurchases as $purchase) {
            $this->info("Entering grace period for purchase UUID: {$purchase->uuid}");
            
            $purchase->status = 'running_late';
            $purchase->last_reminder_at = Carbon::now();
            $purchase->save();

            try {
                $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                        'status' => 'running_late'
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Failed to update metadata on grace period entry: " . $e->getMessage());
            }

            // Notify Creator
            if ($purchase->creator) {
                try {
                    $graceHours = $this->getGracePeriodHours();
                    Log::info("Attempting to send grace period start email to creator: {$purchase->creator->email}");
                    
                    Helpers::sendNotification(
                        "Grace Period Started ⏳", 
                        "Your task '{$purchase->task->title}' has passed the deadline. You have " . $graceHours . " hour" . ($graceHours == 1 ? "" : "s") . " to complete it.", 
                        $purchase->creator->email
                    );
                    Mail::to($purchase->creator->email)->send(new TaskGracePeriodStartedMail([
                        'title' => $purchase->task->title
                    ]));
                    Log::info("Grace period start email sent successfully to {$purchase->creator->email}");
                } catch (\Exception $e) {
                    Log::error("Failed to notify creator about grace period: " . $e->getMessage());
                }
            }

            // Notify Supporter
            if ($purchase->supporter) {
                try {
                    Helpers::sendNotification(
                        "Task Running Late 🐢", 
                        "The task '{$purchase->task->title}' is running late. A grace period has started.", 
                        $purchase->supporter->email
                    );
                    Mail::to($purchase->supporter->email)->send(new TaskRunningLateMail([
                        'title' => $purchase->task->title
                    ]));
                } catch (\Exception $e) {
                    Log::error("Failed to notify supporter about late task: " . $e->getMessage());
                }
            }
        }
    }

    private function processGracePeriodReminders()
    {
        $gracePurchases = TaskPurchase::where('status', 'running_late')
            ->whereNotNull('sla_deadline')
            ->where(function ($q) {
                $q->where('refund_status', '!=', 'refunded')->orWhereNull('refund_status');
            })
            ->get();

        foreach ($gracePurchases as $purchase) {
            $graceEnd = Carbon::parse($purchase->sla_deadline)->addHours($this->getGracePeriodHours());
            $now = Carbon::now();

            if ($now->greaterThanOrEqualTo($graceEnd)) {
                continue; // Will be handled by expiration logic
            }

            $hoursLeft = $now->diffInHours($graceEnd);
            $lastReminder = $purchase->last_reminder_at ? Carbon::parse($purchase->last_reminder_at) : Carbon::parse($purchase->sla_deadline);

            // Check configurable reminder
            $reminderInterval = $this->getReminderIntervalHours();
            if ($now->diffInHours($lastReminder) >= $reminderInterval && $hoursLeft > self::FINAL_WARNING_HOURS) {
                $this->sendReminder($purchase, $hoursLeft);
            }
            // Check Final Warning (4 hours left)
            elseif ($hoursLeft <= self::FINAL_WARNING_HOURS && $now->diffInHours($lastReminder) > 2) {
                 // Ensure we don't spam final warning if we just sent it (debounce > 2 hours)
                 $this->sendReminder($purchase, $hoursLeft, true);
            }
        }
    }

    private function sendReminder($purchase, $hoursLeft, $isFinal = false)
    {
        $this->info("Sending reminder for purchase UUID: {$purchase->uuid} ({$hoursLeft}h left)");
        
        $purchase->last_reminder_at = Carbon::now();
        $purchase->save();

        if ($purchase->creator) {
            try {
                $title = $isFinal ? "Final Warning: Task Expiring Soon 🚨" : "Grace Period Reminder ⏰";
                $message = "You have approximately {$hoursLeft} hours remaining to complete '{$purchase->task->title}'.";
                
                Helpers::sendNotification($title, $message, $purchase->creator->email);
                
                Mail::to($purchase->creator->email)->send(new TaskGracePeriodReminderMail([
                    'title' => $purchase->task->title,
                    'hours_left' => $hoursLeft
                ]));
            } catch (\Exception $e) {
                Log::error("Failed to send reminder: " . $e->getMessage());
            }
        }
    }

    private function processGracePeriodExpirations()
    {
        // Find purchases that exceeded SLA + Grace Period
        $expiredPurchases = TaskPurchase::whereNotNull('sla_deadline')
            ->where('status', 'running_late')
            ->where(function ($q) {
                $q->where('refund_status', '!=', 'refunded')->orWhereNull('refund_status');
            })
            ->get()
            ->filter(function ($purchase) {
                $graceEnd = Carbon::parse($purchase->sla_deadline)->addHours($this->getGracePeriodHours());
                return Carbon::now()->greaterThan($graceEnd);
            });

        if ($expiredPurchases->count() > 0) {
            foreach ($expiredPurchases as $purchase) {
                $this->markAsSlaMissed($purchase);
            }
        }
    }

    private function markAsSlaMissed(TaskPurchase $purchase)
    {
        $this->info("Marking purchase UUID as SLA missed: {$purchase->uuid}");
        
        $purchase->status = 'sla_missed';
        $purchase->save();

        // Update Deliverable
        try {
            $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
            if ($deliverable) {
                $deliverable->status = 'sla_missed';
                $deliverable->save();

                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                    'status' => 'sla_missed',
                    'reason' => 'grace_period_expired'
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to update deliverable for SLA miss: " . $e->getMessage());
        }
    }

    private function processRefund(TaskPurchase $purchase)
    {
        $this->info("Processing refund for purchase UUID: {$purchase->uuid}");
        
        if (!$purchase->payment_intent_id) {
            Log::error("Cannot refund purchase {$purchase->uuid}: Missing payment_intent_id");
            return;
        }

        try {
            // 1. Create Refund in Stripe
            $refundParams = [
                'payment_intent' => $purchase->payment_intent_id,
                'reason' => 'requested_by_customer',
                'metadata' => [
                    'reason' => 'sla_expired_grace_period',
                    'task_purchase_uuid' => $purchase->uuid,
                    'task_id' => $purchase->task_id
                ]
            ];

            $stripeOptions = [];
            if ($purchase->creator && $purchase->creator->account_id) {
                $stripeOptions['stripe_account'] = $purchase->creator->account_id;
            }

            $refund = Refund::create($refundParams, $stripeOptions);

            // 2. Update Local Database
            $purchase->refund_status = 'refunded';
            $purchase->refunded_at = Carbon::now();
            $purchase->status = 'refunded';
            $purchase->dispute_status = 'won'; // Supporter won
            $purchase->refund_id = $refund->id;
            $purchase->save();

            // 3. Update Deliverable Status and Metadata
            try {
                $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'refunded';
                    $deliverable->save();

                    app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                        'status' => 'refunded',
                        'refunded_by' => 'system_sla_expired',
                        'refund_reason' => 'sla_expired_grace_period'
                    ]);

                    $this->info("Updated deliverable status and metadata for purchase UUID: {$purchase->uuid}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to update deliverable status/metadata for SLA refund {$purchase->uuid}: " . $e->getMessage());
            }

            // 4. Notify Users
            $this->notifyRefundUsers($purchase);

            // Log::info("Successfully refunded purchase {$purchase->uuid}");

        } catch (\Exception $e) {
            Log::error("Failed to refund purchase {$purchase->uuid}: " . $e->getMessage());
            $this->error("Failed to refund purchase {$purchase->uuid}: " . $e->getMessage());
        }
    }

    private function notifyRefundUsers(TaskPurchase $purchase)
    {
        $task = $purchase->task;
        $supporter = $purchase->supporter;
        $creator = $purchase->creator;

        // Notify Supporter
        if ($supporter) {
            try {
                Helpers::sendNotification(
                    "Task Refunded 💸", 
                    "The task '{$task->title}' was automatically refunded after grace period expired.", 
                    $supporter->email
                );
                
                Mail::to($supporter->email)->send(new TaskRefunded([
                    'title' => $task->title,
                    'amount' => $purchase->amount,
                    'currency' => $task->currency,
                    'message' => "The task was automatically refunded because the grace period deadline passed."
                ]));
            } catch (\Exception $e) {
                Log::error("Failed to notify supporter for refund {$purchase->uuid}: " . $e->getMessage());
            }
        }

        // Notify Creator
        if ($creator) {
            try {
                Helpers::sendNotification(
                    "Task Expired ⏳", 
                    "The task '{$task->title}' expired after grace period and was refunded.", 
                    $creator->email
                );
                
                Mail::to($creator->email)->send(new TaskRefunded([
                    'title' => $task->title,
                    'amount' => $purchase->amount,
                    'currency' => $task->currency,
                    'message' => "The task was automatically refunded after the grace period expired."
                ]));
            } catch (\Exception $e) {
                Log::error("Failed to notify creator for refund {$purchase->uuid}");
            }
        }
    }
}

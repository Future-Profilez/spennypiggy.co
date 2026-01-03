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
use Stripe\Stripe;
use Stripe\Refund;
use Carbon\Carbon;

class ProcessSlaRefunds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:process-sla-refunds';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for timed tasks that have exceeded their SLA deadline and process refunds';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting SLA refund check...');
        Log::info('Starting SLA refund check...');

        // Find purchases that meet the criteria:
        // 1. SLA deadline has passed
        // 2. Status is in a "pending work" state (pending, paid, assigned, rejected_once)
        // 3. No proof has been uploaded (or re-uploaded after rejection if we were strict, but here we check current proof content)
        //    Actually, if status is 'rejected_once', proof_content IS set.
        //    If they were rejected, they are supposed to upload again. 
        //    If they don't upload again by the ORIGINAL deadline, they might be late.
        //    However, usually rejection resets the clock or adds time? 
        //    If the original SLA is strict, then even after rejection, if SLA passes, it should refund?
        //    Let's assume STRICT SLA. If now > sla_deadline and status is NOT completed/delivered/pending_review, then refund.
        //    Note: 'pending_review' means they submitted something.
        
        $expiredPurchases = TaskPurchase::whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', Carbon::now())
            ->whereIn('status', ['pending', 'paid', 'assigned', 'rejected_once'])
            ->where('refund_status', '!=', 'refunded')
            ->where(function ($query) {
                // Ensure we don't refund if they currently have a proof under review (though status 'pending_review' covers this)
                // If status is 'rejected_once', they have proof content but it was rejected.
                // So if they haven't uploaded a NEW proof (which would set status to pending_review), they are liable for refund.
                $query->where('status', '!=', 'pending_review');
            })
             // Double check not already completed
            ->whereNotIn('status', ['completed', 'completed_accepted', 'delivered', 'refunded', 'escalated', 'disputed']) 
            ->get();

        $count = $expiredPurchases->count();
        $this->info("Found {$count} expired purchases.");
        Log::info("Found {$count} expired purchases to refund.");

        if ($count === 0) {
            return;
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        foreach ($expiredPurchases as $purchase) {
            $this->processRefund($purchase);
        }

        $this->info('SLA refund check completed.');
        Log::info('SLA refund check completed.');
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
            $refund = Refund::create([
                'payment_intent' => $purchase->payment_intent_id,
                'reason' => 'requested_by_customer', // Or 'expired_uncaptured_charge' if uncaptured, but these are likely captured. 'requested_by_customer' is safe or just omit reason.
                'metadata' => [
                    'reason' => 'sla_expired',
                    'task_purchase_uuid' => $purchase->uuid,
                    'task_id' => $purchase->task_id
                ]
            ]);

            // 2. Update Local Database
            $purchase->refund_status = 'refunded';
            $purchase->refunded_at = Carbon::now();
            $purchase->status = 'refunded';
            $purchase->dispute_status = 'won'; // Effectively the supporter "won" by default? Or just leave as is.
            $purchase->save();

            // 3. Update Deliverable Status
            try {
                $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'refunded';
                    $deliverable->save();
                    $this->info("Updated deliverable status for purchase UUID: {$purchase->uuid}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to update deliverable status for SLA refund {$purchase->uuid}: " . $e->getMessage());
            }

            // 4. Notify Users
            $this->notifyUsers($purchase);

            Log::info("Successfully refunded purchase {$purchase->uuid}");

        } catch (\Exception $e) {
            Log::error("Failed to refund purchase {$purchase->uuid}: " . $e->getMessage());
            $this->error("Failed to refund purchase {$purchase->uuid}: " . $e->getMessage());
        }
    }

    private function notifyUsers(TaskPurchase $purchase)
    {
        $task = $purchase->task;
        $supporter = $purchase->supporter;
        $creator = $purchase->creator;

        // Notify Supporter
        if ($supporter) {
            try {
                Helpers::sendNotification(
                    "Task Refunded 💸", 
                    "The task '{$task->title}' was automatically refunded because the deadline passed.", 
                    $supporter->email
                );
                
                Mail::to($supporter->email)->send(new TaskRefunded([
                    'title' => $task->title,
                    'amount' => $purchase->amount,
                    'message' => "The task was automatically refunded because the deadline passed."
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
                    "The task '{$task->title}' expired and was refunded to the supporter.", 
                    $creator->email
                );
            } catch (\Exception $e) {
                Log::error("Failed to notify creator for refund {$purchase->uuid}");
            }
        }
    }
}

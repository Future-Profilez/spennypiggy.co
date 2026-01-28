<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TaskPurchase;
use App\Models\Deliverable;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;
use App\Helpers;
use App\Services\StripeMetadataService;

class ProcessTaskAutoConfirmations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:process-task-auto-confirmations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-confirm delivered tasks after configured hours (default 1)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting task auto-confirmation process...');
        
        $this->processAutoConfirmations();
        
        $this->info('Task auto-confirmation process completed.');
    }

    /**
     * Process auto-confirmation for delivered tasks
     */
    private function processAutoConfirmations()
    {
        // Find delivered tasks older than configured hours (default 1)
        // 'pending_review' implies proof uploaded.
        // We check if proof uploaded > X hours ago.
        
        $autoAcceptHours = config('tasks.auto_accept_proof_hours', 1);

        $tasksToConfirm = TaskPurchase::where('status', 'pending_review')
            ->whereNotNull('proof_content')
            ->get()
            ->filter(function ($purchase) use ($autoAcceptHours) {
                $proof = $purchase->proof_content ?? [];
                $uploadedAtStr = $proof['uploaded_at'] ?? null;
                $uploadedAt = $uploadedAtStr ? Carbon::parse($uploadedAtStr) : Carbon::parse($purchase->updated_at);
                return $uploadedAt->lt(Carbon::now()->subHours($autoAcceptHours));
            });

        foreach ($tasksToConfirm as $purchase) {
            $this->info("Processing auto-confirmation for purchase: {$purchase->id}");
            
            try {
                $purchase->status = 'completed_accepted';
                $purchase->completed_at = now();
                $purchase->save();
                
                // Update Deliverable
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'delivered';
                    $deliverable->delivered_at = now();
                    $deliverable->save();

                    try {
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'proof_status' => 'accepted',
                            'accepted_by' => 'auto_system'
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Failed to update metadata on auto-confirmation (charge): " . $e->getMessage());
                    }
                }

                // Trigger Payout if PAID_TASK
                $this->triggerPayout($purchase);
                
                // Notify Creator
                if ($purchase->creator) {
                    Helpers::sendNotification(
                        "Task Auto-Confirmed! ✅", 
                        "Your task '{$purchase->task->title}' has been auto-confirmed.", 
                        $purchase->creator->email
                    );
                }
                
                // Notify Supporter
                if ($purchase->supporter) {
                    Helpers::sendNotification(
                        "Task Auto-Confirmed ✅", 
                        "The task '{$purchase->task->title}' has been auto-confirmed.", 
                        $purchase->supporter->email
                    );
                }

                Log::info("Task auto-confirmed", ['purchase_id' => $purchase->id]);

            } catch (\Exception $e) {
                Log::error("Failed to process auto-confirmation", [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    private function triggerPayout($purchase)
    {
        // Direct Charge: Funds are already in the connected account.
        // We just need to mark it as paid_out in our database.
        if (($purchase->payment_type ?? 'STANDARD') === 'PAID_TASK') {
            $purchase->status = 'paid_out';
            $purchase->save();
            
            // Update Deliverable Metadata
            try {
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                        'current_status_of_order' => 'paid_out',
                        'payment_status' => 'paid',
                        'auto_confirmed' => 'true'
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Failed to update metadata on auto-confirmation (payout): " . $e->getMessage());
            }

            Log::info('Task marked as paid_out (Direct Charge auto-confirm)', [
                'purchase_id' => $purchase->id
            ]);
        }
    }
}

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
        if (($purchase->payment_type ?? 'STANDARD') === 'PAID_TASK' && $purchase->creator && !empty($purchase->creator->account_id)) {
            try {
                $client = new StripeClient(config('services.stripe.secret'));
                $pi = $client->paymentIntents->retrieve($purchase->payment_intent_id);
                $chargeId = $pi->latest_charge ?? null;
                $currency = $pi->currency ?? $purchase->task->currency ?? 'gbp';

                $task = $purchase->task;
                $digits = \App\Models\Currency::where('ISO', strtoupper($currency))->value('ISOdigits');
                $multiplier = ($digits == 0) ? 1 : 100;
                $amount = (int) round(($purchase->transfer_amount ?? 0) * $multiplier);

                if ($amount > 0) {
                    $baseTransferMetadata = [
                        'type' => 'task_payout',
                        'task_id' => (string) $task->id,
                        'task_uuid' => (string) $task->uuid,
                        'purchase_id' => (string) $purchase->id,
                        'creator_id' => (string) $purchase->creator_id,
                        'supporter_id' => (string) $purchase->supporter_id,
                        'payment_intent_id' => (string) $purchase->payment_intent_id,
                    ];

                    $piMetadata = [];
                    foreach (($pi->metadata ?? []) as $k => $v) {
                        $piMetadata[(string) $k] = is_array($v) ? json_encode($v) : (string) $v;
                    }

                    $chargeMetadata = [];
                    $charge = null;
                    if ($chargeId) {
                        try {
                            $charge = $client->charges->retrieve($chargeId);
                        } catch (\Exception $e) {
                            Log::warning('Failed to retrieve charge for metadata merge: ' . $e->getMessage());
                        }
                    }
                    if ($charge) {
                        foreach (($charge->metadata ?? []) as $k => $v) {
                            $chargeMetadata[(string) $k] = is_array($v) ? json_encode($v) : (string) $v;
                        }
                    }

                    $transferMetadata = array_merge($baseTransferMetadata, $piMetadata, $chargeMetadata);

                    $transfer = \App\StripeControl::createTransfer([
                        'amount' => $amount,
                        'currency' => strtolower($currency),
                        'destination' => $purchase->creator->account_id,
                        'source_transaction' => $chargeId,
                        'transfer_group' => "paid_task_{$task->id}",
                        'metadata' => $transferMetadata,
                    ]);

                    $purchase->status = 'paid_out';
                    $purchase->transfer_id = $transfer->id;
                    $purchase->save();

                    Log::info('Paid Task auto-transfer created', [
                        'purchase_id' => $purchase->id,
                        'transfer_id' => $transfer->id ?? null
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to create auto-transfer', [
                    'error' => $e->getMessage(),
                    'purchase_id' => $purchase->id
                ]);
            }
        }
    }
}

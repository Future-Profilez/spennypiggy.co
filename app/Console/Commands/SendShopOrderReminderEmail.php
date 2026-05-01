<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Deliverable;
use App\Models\ShopPayment;
use Illuminate\Support\Facades\Mail;
use App\Mail\ShopOrderReminderMail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendShopOrderReminderEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-shop-order-reminder-email {--mode=daily : daily or overdue} {--dry-run : show matches without sending}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminder emails to creators for physical shop orders pending more than 2 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $mode = $this->option('mode') ?: 'daily';
        $dryRun = (bool) $this->option('dry-run');

        $twoDaysAgo = Carbon::now()->subDays(2);
        $threeDaysAgo = Carbon::now()->subDays(3);
        $sevenDaysAgo = Carbon::now()->subDays(7);
        $eightDaysAgo = Carbon::now()->subDays(8);

        $query = ShopPayment::query()
            ->where('payment_status', 'paid')
            ->whereHas('shop', function ($q) {
                $q->where('type', 'physical');
            })
            ->with([
                'shop.user',
                'deliverable.creator',
                'deliverable',
            ]);

        if ($mode === 'overdue') {
            $query->where(function ($q) use ($twoDaysAgo, $sevenDaysAgo) {
                $q->where(function ($subq) use ($twoDaysAgo) {
                    $subq->where('created_at', '<=', $twoDaysAgo)
                        ->where(function ($qq) {
                            $qq->whereDoesntHave('deliverable')
                                ->orWhereHas('deliverable', function ($dq) {
                                    $dq->where('status', 'pending');
                                });
                        });
                })->orWhere(function ($subq) use ($sevenDaysAgo) {
                    $subq->where('created_at', '<=', $sevenDaysAgo)
                        ->where(function ($qq) {
                            $qq->whereDoesntHave('deliverable')
                                ->orWhereHas('deliverable', function ($dq) {
                                    $dq->whereNotIn('status', ['delivered', 'refunded']);
                                });
                        });
                });
            });
        } else {
            $query->where(function ($q) use ($twoDaysAgo, $threeDaysAgo, $sevenDaysAgo, $eightDaysAgo) {
                $q->where(function ($subq) use ($twoDaysAgo, $threeDaysAgo) {
                    $subq->where('created_at', '<=', $twoDaysAgo)
                        ->where('created_at', '>=', $threeDaysAgo)
                        ->where(function ($qq) {
                            $qq->whereDoesntHave('deliverable')
                                ->orWhereHas('deliverable', function ($dq) {
                                    $dq->where('status', 'pending');
                                });
                        });
                })->orWhere(function ($subq) use ($sevenDaysAgo, $eightDaysAgo) {
                    $subq->where('created_at', '<=', $sevenDaysAgo)
                        ->where('created_at', '>=', $eightDaysAgo)
                        ->where(function ($qq) {
                            $qq->whereDoesntHave('deliverable')
                                ->orWhereHas('deliverable', function ($dq) {
                                    $dq->whereNotIn('status', ['delivered', 'refunded']);
                                });
                        });
                });
            });
        }

        $payments = $query->get();

        if ($dryRun) {
            $this->info("Matched {$payments->count()} physical shop orders (mode={$mode}).");
            return 0;
        }

        $count = 0;
        foreach ($payments as $payment) {
            $deliverable = $payment->deliverable;
            $creator = $deliverable?->creator ?: $payment->shop?->user;

            if (!$creator || !$creator->email) {
                continue;
            }

            try {
                Mail::to($creator->email)->send(new ShopOrderReminderMail(
                    $creator,
                    $payment,
                    $deliverable
                ));
                $count++;
            } catch (\Exception $e) {
                Log::error('Failed to send shop order reminder email: ' . $e->getMessage());
            }
        }

        $this->info("Sent {$count} reminder emails for pending physical shop orders (mode={$mode}).");
    }
}

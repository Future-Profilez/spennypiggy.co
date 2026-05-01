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
    protected $signature = 'app:send-shop-order-reminder-email';

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
        // Get deliverables for physical shop items that are still pending
        // and were created more than 48 hours ago (2 days)
        $thresholdDate = Carbon::now()->subDays(2);
        $maxThresholdDate = Carbon::now()->subDays(3); // To avoid sending multiple times, check between 2-3 days

        $deliverables = Deliverable::where('product_type', 'shop_item')
            ->where('status', 'pending')
            ->whereHas('shop', function ($query) {
                $query->where('type', 'physical');
            })
            ->where('created_at', '<=', $thresholdDate)
            ->where('created_at', '>=', $maxThresholdDate)
            ->with(['creator'])
            ->get();

        $count = 0;

        foreach ($deliverables as $deliverable) {
            $payment = ShopPayment::where('session_id', $deliverable->session_id)->first();
            
            if ($payment && $deliverable->creator && $deliverable->creator->email) {
                try {
                    Mail::to($deliverable->creator->email)->send(new ShopOrderReminderMail(
                        $deliverable->creator,
                        $payment,
                        $deliverable
                    ));
                    $count++;
                } catch (\Exception $e) {
                    Log::error('Failed to send shop order reminder email: ' . $e->getMessage());
                }
            }
        }

        $this->info("Sent {$count} reminder emails for pending physical shop orders.");
    }
}

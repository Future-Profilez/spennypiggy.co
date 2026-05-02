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
    protected $signature = 'app:send-shop-order-reminder-email {--dry-run : show matches without sending}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Handle shop order reminders (2 days, 7 days) and overdue marking (10 days)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = (bool) $this->option('dry-run');

        $now = Carbon::now();
        $twoDaysAgo = $now->copy()->subDays(2);
        $sevenDaysAgo = $now->copy()->subDays(7);
        $tenDaysAgo = $now->copy()->subDays(10);

        // Find pending physical shop orders
        $query = Deliverable::query()
            ->where('product_type', 'shop_item')
            ->where('payment_status', 'paid')
            ->where('status', 'pending')
            ->with(['creator', 'shop', 'purchase']);

        $deliverables = $query->get();

        if ($dryRun) {
            $this->info("Matched {$deliverables->count()} pending physical shop orders.");
            return 0;
        }

        $reminderCount = 0;
        $overdueCount = 0;
        $adminReviewCount = 0;

        foreach ($deliverables as $deliverable) {
            $createdAt = $deliverable->created_at;

            // 1. Check for 10-day overdue marking
            if ($createdAt->lte($tenDaysAgo) && !$deliverable->is_overdue) {
                $deliverable->update([
                    'is_overdue' => true,
                    'needs_admin_review' => true
                ]);
                $overdueCount++;
                continue; // Once it's overdue, system reminders stop
            }

            // 2. Check for 7-day second reminder
            if ($createdAt->lte($sevenDaysAgo) && $deliverable->system_reminder_count < 2) {
                $this->sendReminder($deliverable);
                $reminderCount++;
                continue;
            }

            // 3. Check for 2-day first reminder
            if ($createdAt->lte($twoDaysAgo) && $deliverable->system_reminder_count < 1) {
                $this->sendReminder($deliverable);
                $reminderCount++;
                continue;
            }

            // 4. Handle Admin Re-Review logic (2 days after manual admin reminder)
            if ($deliverable->is_overdue && !$deliverable->needs_admin_review && $deliverable->admin_reminder_sent_at) {
                $twoDaysAfterAdmin = Carbon::parse($deliverable->admin_reminder_sent_at)->addDays(2);
                if ($now->gte($twoDaysAfterAdmin)) {
                    $deliverable->update(['needs_admin_review' => true]);
                    $adminReviewCount++;
                }
            }
        }

        $this->info("Reminders sent: {$reminderCount}");
        $this->info("Marked overdue: {$overdueCount}");
        $this->info("Sent back to admin review: {$adminReviewCount}");
    }

    private function sendReminder(Deliverable $deliverable)
    {
        $creator = $deliverable->creator;
        if (!$creator || !$creator->email) {
            return;
        }

        try {
            // Find the associated shop payment for the email content
            $payment = ShopPayment::where('session_id', $deliverable->session_id)->first();

            Mail::to($creator->email)->send(new ShopOrderReminderMail(
                $creator,
                $payment,
                $deliverable
            ));

            $deliverable->increment('system_reminder_count');
            $deliverable->update(['last_system_reminder_at' => Carbon::now()]);

        } catch (\Exception $e) {
            Log::error('Failed to send shop order reminder email: ' . $e->getMessage());
        }
    }
}

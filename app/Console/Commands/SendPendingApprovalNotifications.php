<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PendingApprovalService;
use Exception;

class SendPendingApprovalNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:notifications-pending-approval';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send summary notification for unapproved pending items every 30 minutes';

    protected $pendingApprovalService;

    /**
     * Create a new command instance.
     */
    public function __construct(PendingApprovalService $pendingApprovalService)
    {
        parent::__construct();
        $this->pendingApprovalService = $pendingApprovalService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $summary = $this->pendingApprovalService->buildAndSend();
            
            if (!empty($summary)) {
                $this->info('Summary email for pending approvals sent successfully.');
            } else {
                $this->info('No pending items found to send.');
            }
            
            return 0;
        } catch (Exception $e) {
            $this->error("Failed to send notification: " . $e->getMessage());
            return 1;
        }
    }
}

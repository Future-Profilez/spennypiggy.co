<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\Deliverable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class MembershipMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $mem;

    public $amountWithcurrency;

    /**
     * Create a new job instance.
     */
    public function __construct($mem, $amountWithcurrency)
    {
        $this->mem = $mem;
        $this->amountWithcurrency = $amountWithcurrency;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Transactional receipt — no opt-out (see BillPayToUser).
        $deliverable = Deliverable::where('session_id', $this->mem->session_id)
            ->where('product_type', 'membership')
            ->first();

        EmailService::sendMembershipMailToUser($this->mem, $this->amountWithcurrency, $deliverable);
    }
}

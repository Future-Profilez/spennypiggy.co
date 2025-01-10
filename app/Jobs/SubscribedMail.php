<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SubscribedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sub;
    public $creatorFinalAmount;
    /**
     * Create a new job instance.
     */
    public function __construct($sub, $creatorFinalAmount)
    {
        $this->sub = $sub;
        $this->creatorFinalAmount = $creatorFinalAmount;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if((isset($this->sub->wish_item->user) && $this->sub->wish_item->user->notification_send == 1) || (empty($this->sub->wish_item->user))){
            EmailService::sendSubscribedMail($this->sub, $this->creatorFinalAmount);
        }
    }
}

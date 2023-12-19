<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SubscribedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sub;
    /**
     * Create a new job instance.
     */
    public function __construct($sub)
    {
        $this->sub = $sub;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        EmailService::sendSubscribedMail($this->sub);
    }
}

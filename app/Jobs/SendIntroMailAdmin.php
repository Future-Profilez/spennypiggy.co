<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendIntroMailAdmin implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $intro;

    /**
     * Create a new job instance.
     */
    public function __construct($intro)
    {
        $this->intro = $intro;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        EmailService::sendIntroApprovingMailAdmin($this->intro);
    }
}

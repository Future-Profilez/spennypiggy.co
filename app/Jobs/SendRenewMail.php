<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendRenewMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $array;
    /**
     * Create a new job instance.
     */
    public function __construct($array)
    {
        $this->array = $array;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        EmailService::sendRenewMail($this->array);
    }
}

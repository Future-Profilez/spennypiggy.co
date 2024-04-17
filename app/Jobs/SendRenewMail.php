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
    public $type;
    public $module;
    /**
     * Create a new job instance.
     */
    public function __construct($array,$type,$module)
    {
        $this->array = $array;
        $this->type = $type;
        $this->module = $module;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if($this->array['notification'] == 1){
            EmailService::sendRenewMail($this->array,$this->type,$this->module);
        }
    }
}

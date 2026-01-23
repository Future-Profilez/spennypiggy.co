<?php

namespace App\Jobs;

use App\Models\FanContract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendContractMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $contract;
    public $type;
    public $url;

    public function __construct(FanContract $contract, $type, $url)
    {
        $this->contract = $contract;
        $this->type = $type;
        $this->url = $url;
    }

    public function handle()
    {
        Log::info("Sending contract mail to {$this->contract->user->email} for contract {$this->contract->id}");
        // Mail logic would go here
    }
}

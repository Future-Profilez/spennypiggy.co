<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendRenewMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $array;

    public $type;

    public $module;

    public function __construct($array, $type, $module)
    {
        $this->array = $array;
        $this->type = $type;
        $this->module = $module;
    }

    public function handle(): void
    {
        try {
            // A renewal receipt is TRANSACTIONAL — the supporter was charged real
            // money and must be told, exactly like the first-purchase receipt
            // (BillPayToUser), which had this same notification_send gate removed.
            // Gating it meant anyone with notifications off learned about
            // recurring charges only from their bank statement.
            EmailService::sendRenewMail($this->array, $this->type, $this->module);
        } catch (\Exception $e) {
            Log::error('❌ SendRenewMail Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}

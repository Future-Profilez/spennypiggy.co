<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SupportPaymentToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $paymentData;
    public $symbol;

    /**
     * Create a new message instance.
     */
    public function __construct($paymentData, $symbol)
    {
        $this->paymentData = $paymentData;
        $this->symbol = $symbol;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        try {
            Log::info('SupportPaymentToUser::build() - Starting email build process', [
                'payment_id' => $this->paymentData->id ?? 'null',
                'symbol' => $this->symbol ?? 'null',
                'has_user' => isset($this->paymentData->user) ? 'yes' : 'no',
                'has_creator' => isset($this->paymentData->creator) ? 'yes' : 'no'
            ]);

            $subject = 'Thank You for Supporting a Creator on Spenny Piggy!';
            
            // Ensure creator data is available
            if (!isset($this->paymentData->creator) && isset($this->paymentData->owner_id)) {
                $creator = \App\Models\User::find($this->paymentData->owner_id);
                if ($creator) {
                    $this->paymentData->creator = $creator;
                    Log::info('SupportPaymentToUser: Creator loaded successfully', [
                        'creator_name' => $creator->name ?? 'null',
                        'creator_username' => $creator->username ?? 'null'
                    ]);
                }
            }

            Log::info('SupportPaymentToUser: About to build email with template', [
                'template' => 'email.tip-granted',
                'subject' => $subject,
                'creator_name' => $this->paymentData->creator->name ?? 'null',
                'amount' => $this->paymentData->amount ?? 'null',
                'symbol' => $this->symbol
            ]);

            $builtEmail = $this->view('email.tip-granted')
                ->with([
                    'tip' => $this->paymentData,  // Pass as 'tip' for template compatibility
                    'symbol' => $this->symbol,     // Currency symbol
                    'amount' => $this->paymentData->amount ?? 0  // Amount for template
                ])
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);

            Log::info('SupportPaymentToUser: Email built successfully');

            return $builtEmail;

        } catch (\Exception $e) {
            Log::error('SupportPaymentToUser email build error', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'payment_id' => $this->paymentData->id ?? 'null',
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}

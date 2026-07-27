<?php

namespace App\Mail;

use App\Models\Currency;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentRefunded extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        $currencyIso = isset($this->data['currency']) ? strtoupper($this->data['currency']) : 'GBP';
        $currency = Currency::where('ISO', $currencyIso)->first();
        $symbol = $currency && $currency->symbol ? $currency->symbol : '£';
        $digits = $currency && is_numeric($currency->ISOdigits) ? (int) $currency->ISOdigits : 2;
        $amount = isset($this->data['amount']) && is_numeric($this->data['amount']) ? (float) $this->data['amount'] : 0;
        $formattedAmount = $symbol.number_format($amount, $digits);

        return $this->view('email.payment_refunded')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Refund Notification')
            ->with([
                'formattedAmount' => $formattedAmount,
                'currencySymbol' => $symbol,
            ]);
    }
}

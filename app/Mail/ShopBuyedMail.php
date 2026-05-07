<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShopBuyedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    public $anon;
    public $amountUserPay;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $anon, $amountUserPay)
    {
        $this->data = $data;
        $this->anon = $anon;
        $this->amountUserPay = $amountUserPay;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // Ensure relationships are loaded with trashed items if this is being handled in the queue or if relationships were cleared
        if (!$this->data->relationLoaded('shop') || $this->data->shop === null) {
            $this->data->load(['shop' => function($q) { $q->withTrashed(); }, 'shop.user']);
        }

        $name = $this->anon ? 'Anonymous user' : ucwords($this->data->name ?? 'A customer');
        $itemName = $this->data->shop?->name ?? 'Shop Item';
        $subject = "{$name} purchased {$itemName}";

        return $this->view('email.shopbuy')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
    }
}

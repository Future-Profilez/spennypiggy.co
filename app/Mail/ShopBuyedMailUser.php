<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ShopBuyedMailUser extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public $url;

    public $curr;

    public $deliverable;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $url, $curr, $deliverable = null)
    {
        $this->data = $data;
        $this->url = $url;
        $this->curr = $curr;
        $this->deliverable = $deliverable;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // Ensure relationships are loaded if this is being handled in the queue
        if (! $this->data->relationLoaded('shop.user') || ! $this->data->relationLoaded('user')) {
            $this->data->load(['shop.user', 'user']);
        }

        $creatorName = $this->data->shop?->user?->name ?? 'a creator';
        $itemName = $this->data->shop?->name ?? 'Shop Item';
        $subject = "Purchase confirmed: {$creatorName}'s {$itemName}";

        return $this->view('email.shop-buy-user')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
    }
}

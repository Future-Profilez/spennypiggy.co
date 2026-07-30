<?php

namespace App\Mail;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\WishItem;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RenewMail extends Mailable
{
    use Queueable, SerializesModels;

    public $array;

    public $type;

    public $module;

    public function __construct($array, $type, $module)
    {
        $this->array = $array;
        $this->type = $type;
        $this->module = $module;
    }

    public function build()
    {
        // Resolve the purchased item so the renewal receipt can render the
        // reward block — a renewal is a real charge for the same reward, and
        // the receipt used to say only "subscription renewed" with no mention
        // of what the supporter is paying for.
        $rewardItem = null;
        try {
            $rewardItem = match ($this->array['reward_item_type'] ?? null) {
                'bill' => Bills::find($this->array['reward_item_id'] ?? null),
                'membership' => Membership::find($this->array['reward_item_id'] ?? null),
                'wish' => WishItem::find($this->array['reward_item_id'] ?? null),
                default => null,
            };
        } catch (\Throwable $e) {
            // The receipt must send even if the item lookup fails.
        }

        return $this->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Spenny Piggy Subscription Status Notification')
            ->view('email.subscription-renew')
            ->with([
                'array' => $this->array,
                'type' => $this->type,
                'module' => $this->module,
                'rewardItem' => $rewardItem,
            ]);
    }
}

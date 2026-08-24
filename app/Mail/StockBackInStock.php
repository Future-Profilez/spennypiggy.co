<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Http\Controllers\StockWaitlistController;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * "It's back" — the notice somebody asked for when an item was sold out.
 *
 * Goes to account holders AND guests, so it must not assume a User exists. A guest's
 * opt-out is simply leaving that item's list; there is no account-wide preference to
 * point them at.
 *
 * Constructor takes primitives only: it is built inside a queued job from a serialized
 * payload, where an Eloquent model would arrive stale.
 */
class StockBackInStock extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $shopUuid,
        public string $itemName,
        public string $creatorName,
        public ?string $creatorUsername = null,
        /*
         * 🚨 PROTECTED — see `AbandonedCheckoutReminder`. As a public property it
         * overwrote `content()`'s `max(0, …)` clamp, making the clamp dead code.
         */
        protected int $stock = 0,
        public ?int $userId = null,
        public ?int $waitlistId = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Back in stock: '.$this->itemName,
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        $user = $this->userId ? User::find($this->userId) : null;

        return new Content(
            view: 'email.stock-back',
            with: [
                'user' => $user,
                'firstName' => $this->firstName($user),
                'itemName' => $this->itemName,
                'creatorName' => $this->creatorName,
                'creatorUsername' => $this->creatorUsername,
                // Stated plainly. Several people are told at once and only a few can
                // buy, so hiding the number would set most of them up to fail.
                'stock' => max(0, $this->stock),
                // Straight to the item, not to the creator's shop tab. The whole notice
                // says "this may not last" — making them hunt for the listing again is
                // the one thing that guarantees they lose the race.
                'itemUrl' => route('single-shop-list', [
                    'slug' => Str::slug($this->itemName) ?: 'item',
                    'uuid' => $this->shopUuid,
                ]),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'restock_emails_enabled')
                    : ($this->waitlistId
                        ? StockWaitlistController::generateLeaveLink($this->waitlistId)
                        : null),
            ]
        );
    }

    private function firstName(?User $user): string
    {
        $name = trim((string) ($user->name ?? ''));

        if ($name === '') {
            return 'there';
        }

        return ucwords(explode(' ', $name)[0]);
    }
}

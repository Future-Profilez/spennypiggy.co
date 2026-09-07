<?php

namespace App\Mail;

use App\Models\User;
use App\Support\PayoutCycle;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your payout is on the way" for a standard weekly payout run.
 *
 * Transactional — a creator cannot opt out of being told their money moved,
 * so this is sent with Mail::to() and never through a consent-checking helper.
 */
class PayoutInitiated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $creator,
        public float $amount,
        public string $currency,
        public string $sentAt,
        public ?string $destination = null,
        public ?string $reference = null,
        // Stripe's own estimate of when the money lands. Stripe may omit it, so
        // the template renders the row only when it is present rather than
        // printing a date the bank never promised.
        public ?string $arrivalDate = null,
    ) {
        $this->currency = strtoupper($currency ?: 'GBP');
    }

    /**
     * The earning week this payout covers, e.g. "Fri 4 Sep to Thu 10 Sep".
     *
     * 🚨 DERIVED FROM `sentAt`, NEVER FROM "today". A queued mail can be rendered
     * minutes or hours after the run — and a retry can render it days later — so
     * asking the clock would name a different week than the one the creator was
     * actually paid for, in writing, with nothing to catch it.
     *
     * ⚠️ Returns null on an unparseable date rather than guessing: no line at all
     * is better than the wrong week on a payment receipt.
     */
    public function earningWeek(): ?string
    {
        try {
            [$start, $end] = PayoutCycle::periodFor(Carbon::parse($this->sentAt));
        } catch (\Throwable) {
            return null;
        }

        return $start->format('D j M').' to '.$end->format('D j M');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your payout is on the way',
            // config(), never env() — env() returns null once Vapor caches the
            // config on deploy, silently falling back to the hardcoded default.
            from: new Address(
                config('mail.from.address', 'noreply@spennypiggy.co'),
                config('mail.from.name', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        // ⚠️ Passed as view data, not called from the template: `$this` inside a
        // Mailable's view is NOT the Mailable, so `$this->earningWeek()` there is a
        // fatal. And `earningWeek` is deliberately not a public property — a public
        // property of the same name would OVERWRITE this computed value silently
        // (the documented buildViewData collision).
        return new Content(
            view: 'email.payout-initiated',
            with: ['earningWeek' => $this->earningWeek()],
        );
    }
}

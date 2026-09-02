<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your Growth Bonus is on hold, and here is why."
 *
 * 🚨 THE REASON IS PASSED IN, DERIVED FROM A CODE. Nothing here writes a cause:
 * `GrowthBonusService::holdMessage()` maps the stored code to the one sentence
 * every surface uses, so the email, the push and the dashboard cannot describe
 * the same hold three different ways.
 *
 * 🚨 IT SAYS WHAT HAPPENS NEXT. A hold with no route out reads as a refusal —
 * this one is re-checked every week and sends itself the moment the milestone is
 * covered again, and the creator has to be told that or they will open a ticket.
 *
 * 🚨 TRANSACTIONAL. It reports the state of money the creator is owed, so it is
 * dispatched with `$marketing = false` and carries no unsubscribe footer.
 *
 * 🚨 EVERY PROPERTY IS `protected` — `Mailable::buildViewData()` merges PUBLIC
 * properties OVER `Content(with: …)`, silently replacing anything `content()`
 * computes under the same key.
 */
class GrowthBonusHeld extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected User $creator,
        protected float $milestoneGmv,
        protected float $rewardAmount,
        protected string $reasonText,
    ) {}

    public function envelope(): Envelope
    {
        $symbol = config('growth_bonus.display.currency_symbol', '£');

        return new Envelope(
            subject: 'Your '.$symbol.number_format($this->rewardAmount, 0).' Growth Bonus is on hold',
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy'),
            ),
        );
    }

    public function content(): Content
    {
        $symbol = config('growth_bonus.display.currency_symbol', '£');

        return new Content(
            view: 'email.growth-bonus-held',
            with: [
                'creator' => $this->creator,
                'rewardLabel' => $symbol.number_format($this->rewardAmount, 2),
                'milestoneLabel' => $symbol.number_format($this->milestoneGmv, 0),
                'reasonText' => $this->reasonText,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

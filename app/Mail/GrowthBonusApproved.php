<?php

namespace App\Mail;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your Growth Bonus is approved and will be sent on <date>."
 *
 * 🚨 THIS MAIL NAMES A DATE, WHICH THE MILESTONE MAIL DELIBERATELY DOES NOT.
 * `GrowthBonusMilestoneReached` fires when a rung is crossed, before anyone has
 * looked at it, so the only honest thing it can say is "on the same payout as
 * the sales that qualified you". By the time THIS one fires the bonus has been
 * approved and `scheduled_payout_date` is fixed on the row, so the date is a
 * fact about a decision already made rather than a forecast.
 *
 * 🚨 THE DATE COMES FROM THE REWARD ROW, NEVER FROM A FRESH CALCULATION HERE.
 * `GrowthBonusService::nextPayoutDate()` is called once, at approval, and stored.
 * Recomputing it in the mail means the day the creator reads and the day the
 * payer acts on can differ — a broken promise about money, in writing, that
 * nothing downstream would catch.
 *
 * ⚠️ IT SAYS "SENT", NOT "IN YOUR BANK". We control when the transfer leaves;
 * when it lands is Stripe's and the bank's, and it is reported separately by the
 * payout itself once Stripe returns an arrival date.
 *
 * 🚨 TRANSACTIONAL. It reports money the creator is owed — the same class as a
 * payout notice — so it is dispatched with `$marketing = false` and carries no
 * unsubscribe footer by design.
 *
 * 🚨 EVERY PROPERTY IS `protected`. `Mailable::buildViewData()` merges PUBLIC
 * properties OVER `Content(with: …)`, silently replacing anything `content()`
 * computes under the same key. Protected still serialises for the queue.
 */
class GrowthBonusApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected User $creator,
        protected float $milestoneGmv,
        protected float $rewardAmount,
        protected ?string $scheduledDate = null,
    ) {}

    public function envelope(): Envelope
    {
        $symbol = config('growth_bonus.display.currency_symbol', '£');

        return new Envelope(
            subject: 'Your '.$symbol.number_format($this->rewardAmount, 0).' Growth Bonus is approved',
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
            view: 'email.growth-bonus-approved',
            with: [
                'creator' => $this->creator,
                'rewardLabel' => $symbol.number_format($this->rewardAmount, 2),
                'milestoneLabel' => $symbol.number_format($this->milestoneGmv, 0),
                /*
                 * ⚠️ A null date is a real state, not a missing value: the payout
                 * is switched off, or the creator's Stripe account cannot receive
                 * yet. The template drops the whole date line rather than
                 * printing an empty one or inventing a day.
                 */
                'scheduledLabel' => $this->scheduledDate
                    ? Carbon::parse($this->scheduledDate)->format('l j F')
                    : null,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

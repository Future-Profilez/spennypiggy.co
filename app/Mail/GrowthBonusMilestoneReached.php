<?php

namespace App\Mail;

use App\Models\User;
use App\Support\Incentives;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "You unlocked a Growth Bonus milestone."
 *
 * 🚨 TRANSACTIONAL, NOT MARKETING, AND THAT IS DELIBERATE. This tells a creator
 * about money they have earned and are owed — the same class as a payout notice,
 * which the platform rule says has no opt-out by design. It is therefore
 * dispatched with `$marketing = false`, and it carries no unsubscribe footer;
 * `EmailService::warnIfNoUnsubscribeLink()` only guards the marketing path.
 *
 * 🚨 EVERY PROPERTY IS `protected`. `Mailable::buildViewData()` reflects over
 * PUBLIC properties and merges them OVER `Content(with: …)`, so a public property
 * sharing a key with something `content()` computes silently replaces the
 * computed version — the fault that shipped `ReactivationReminder` with no
 * attribution and `AbandonedCheckoutReminder` greeting people as "there, ".
 * Protected still serialises for the queue.
 *
 * ⚠️ THE MILESTONE IS THE CREATOR'S LISTED SALE VALUE (terms clause 2.1, client
 * decision 26 Aug 2026): a £100 listing counts as £100. It was gross customer
 * spend until then, which is why this mail used to avoid the word "earnings".
 * This is the one message that states the threshold to the creator directly, so
 * it uses the terms' own defined term.
 *
 * ⚠️ It must NOT promise a day. The bonus rides the payout run that carries the
 * sale which crossed the milestone, so it lands 7–13 days later depending on the
 * weekday (client rule, 26 Aug 2026). "On the same payout as the sales that
 * qualified you" is accurate in every case; "next Friday" is wrong in most.
 */
class GrowthBonusMilestoneReached extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected User $creator,
        protected float $milestoneGmv,
        protected float $rewardAmount,
        protected float $earnedTotal,
        protected ?float $nextMilestone = null,
        protected ?float $nextReward = null,
    ) {}

    public function envelope(): Envelope
    {
        $symbol = config('growth_bonus.display.currency_symbol', '£');

        return new Envelope(
            subject: 'You unlocked a '.$symbol.number_format($this->rewardAmount, 0).' Growth Bonus',
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy'),
            ),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.growth-bonus-milestone',
            with: [
                'creator' => $this->creator,
                'milestoneGmv' => $this->milestoneGmv,
                'rewardAmount' => $this->rewardAmount,
                'earnedTotal' => $this->earnedTotal,
                /*
                 * 🚨 THE LADDER IS ONLY ADVERTISED WHILE IT IS OPEN (11 Sep 2026).
                 * This mail outlives the scheme by design — the payer keeps running so
                 * anyone who met the published condition is still paid (see
                 * App\Support\Incentives). But a creator honoured after closure cannot
                 * climb another rung, so "Next up: £X unlocks another £Y" promises
                 * something that can never happen. The template's `@else` is no good
                 * here either: it says they have earned the FULL ladder, which is a
                 * different and equally untrue statement. `schemeClosed` is the third
                 * case, and it is read from the switch rather than from the data.
                 */
                'schemeClosed' => ! Incentives::growthBonusEnabled(),
                'nextMilestone' => $this->nextMilestone,
                'nextReward' => $this->nextReward,
                'maxTotal' => array_sum(array_column((array) config('growth_bonus.ladder', []), 'amount')),
                'symbol' => config('growth_bonus.display.currency_symbol', '£'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

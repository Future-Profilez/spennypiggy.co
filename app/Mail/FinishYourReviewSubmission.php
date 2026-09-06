<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Services\SubscriptionActivationService;
use App\Support\ReviewSubmission;
use App\Support\SubscriptionPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A creator pressed "Submit for review" while something was still missing.
 *
 * 🚨 They are in NO admin queue, and nothing about the platform says so — see
 * App\Support\ReviewSubmission. Their own screen used to read "our team is
 * checking it now, there is nothing else to do". This is the message that tells
 * them otherwise, and it is the only thing that will: the admin console cannot
 * see them either, so nobody was ever going to chase this by hand.
 *
 * ⚠️ NOT MARKETING. It is the state of the creator's own account and a step
 * they started; a marketing opt-out must not silence it, which is why the
 * command passes `$marketing = false`. The unsubscribe footer is still drawn
 * (creator updates), because the reminder ladder runs for a long time.
 */
class FinishYourReviewSubmission extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * 🚨 `protected`, NOT public.
     *
     * `Mailable::buildViewData()` reflects over PUBLIC properties and merges
     * them OVER the `Content(with: …)` array, so a public property sharing a
     * key with something `content()` computes silently replaces the computed
     * value. That has bitten this codebase three times — see the "public
     * property on a Mailable" section in CLAUDE.md. Protected still serialises
     * for the queue, so nothing about dispatching changes.
     */
    public function __construct(
        protected int $userId,
        protected string $creatorName,
        /** @var array<int, string> Human phrases, e.g. "a payment card". */
        protected array $missing,
        protected bool $cardPreviouslyAdded = false,
    ) {}

    /**
     * One definition of the wording, so the subject and any bell/push title
     * built from it cannot drift apart.
     *
     * ⚠️ Not named `subject()` — `Mailable` already declares one with a
     * different signature, and redeclaring it is a fatal incompatibility rather
     * than an override.
     */
    public static function subjectLine(): string
    {
        return 'One step left before we can review your profile';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectLine(),
            // ⚠️ config(), never env(). Vapor caches config on deploy, after
            // which env() returns null and the sender silently falls back to a
            // hardcoded default rather than the configured address.
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);

        $needsCard = in_array('a payment card', $this->missing, true);

        /*
         * 🚨 THE FREE-UNTIL-FIRST-SALE PROMISE IS NOT UNIVERSAL, AND PRINTING IT
         * AT A CREATOR WHO HAS ALREADY SOLD IS A LIE ABOUT THEIR OWN BILL.
         *
         * `SubscriptionActivationService::hasEverMadeSale()` is what the
         * subscription screen already branches on for exactly this reason. The
         * copy itself comes from `config/creator_subscription.php` through
         * SubscriptionPlan, never typed here — the same figure is printed on a
         * dozen other surfaces and one of them being retyped is how a mail ends
         * up quoting a price the platform does not charge.
         */
        $freePeriod = $needsCard
            && SubscriptionPlan::freeUntilFirstSale()
            && $user
            && ! app(SubscriptionActivationService::class)->hasEverMadeSale($user);

        return new Content(
            view: 'email.finish-review-submission',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'missing' => $this->missing,
                'missingSentence' => ReviewSubmission::readableList($this->missing),
                'needsCard' => $needsCard,
                // "Add your card" reads as though we lost it, to somebody whose
                // payment simply failed. Different sentence, same action.
                'cardLapsed' => $needsCard && $this->cardPreviouslyAdded,
                'freePeriod' => $freePeriod,
                'promise' => $freePeriod ? SubscriptionPlan::copy('promise_long') : '',
                'reassurance' => $freePeriod ? SubscriptionPlan::copy('reassurance') : '',
                'priceLine' => SubscriptionPlan::copy($freePeriod ? 'price_line' : 'active_price_line'),
                'actionUrl' => $needsCard
                    ? url('/activate-subscription')
                    : url('/'.($user->username ?? '')),
                'actionLabel' => $needsCard
                    ? ($this->cardPreviouslyAdded ? 'Update your card' : 'Add your card')
                    : 'Finish your profile',
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }
}

<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FounderCongratulations extends Mailable
{
    use Queueable, SerializesModels;

    public User $creator;

    public float $first30DayEarnings;

    /**
     * Create a new message instance.
     */
    public function __construct(User $creator, float $first30DayEarnings)
    {
        $this->creator = $creator;
        $this->first30DayEarnings = $first30DayEarnings;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 Congratulations! You\'re now a SpennyPiggy Founder!',
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.founder-congratulations',
            with: [
                'creator' => $this->creator,
                'first30DayEarnings' => $this->first30DayEarnings,
                /*
                 * 🚨 This mail is sent via EmailService::sendMarketingEmail, so
                 * it is marketing and has to offer an unsubscribe (UK brief §4).
                 * It shipped without one.
                 *
                 * ⚠️ Both helpers return NULL when their route is not
                 * registered, deliberately — they are called from inside
                 * content() and `URL::temporarySignedRoute()` THROWS on an
                 * unknown name, which would take the whole email down rather
                 * than drop a link. The template guards on both.
                 */
                'unsubscribeUrl' => EmailPreferenceController::generateUnsubscribeToken($this->creator),
                'manageUrl' => EmailPreferenceController::generateManageToken($this->creator),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

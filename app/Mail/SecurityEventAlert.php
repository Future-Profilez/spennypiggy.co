<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Security Checklist §3 alert mail.
 *
 * 🚨 TRANSACTIONAL. Sent with `Mail::to()` by App\Support\SecurityAlert and
 * never through EmailService's consent helpers — security mail to staff has no
 * opt-out by design (see the Email Preferences section of this app's CLAUDE.md).
 *
 * ⚠️ The mailable takes only already-safe display strings. It does no redaction
 * of its own: SecurityRedactor runs at the point the value is read, so a raw
 * secret never reaches this object or the `security_events` row beside it.
 */
class SecurityEventAlert extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int,array{heading:string,rows:array<int,string>}>  $sections
     * @param  array{label:string,colour:string,background:string,ink:string,host:string}  $badge
     */
    public function __construct(
        public string $subjectLine,
        public string $alertTitle,
        public string $alertIntro,
        public array $sections,
        public array $badge,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
            from: new Address(
                (string) config('mail.from.address', 'noreply@spennypiggy.co'),
                (string) config('mail.from.name', 'Spenny Piggy')
            ),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.security_alert',
            with: [
                'alertTitle' => $this->alertTitle,
                'alertIntro' => $this->alertIntro,
                'sections' => $this->sections,
                'badge' => $this->badge,
                'checkedAt' => now()->format('d M Y H:i').' UTC',
            ],
        );
    }
}

<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendRestrictionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $wish;
    /**
     * Create a new message instance.
     */
    public function __construct($wish)
    {
        $this->wish = $wish;
    }

      /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = '⚠️ Wishlist Item Removed! ⚠️';
            return $this->view('email.wish-remove')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}

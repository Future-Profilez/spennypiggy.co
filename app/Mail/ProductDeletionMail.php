<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ProductDeletionMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }


    /**
     * Get the message envelope.
     */

    public function build()
    {
        return $this->subject('Your Stripe Product Was Deleted')
            ->view('emails.product_deleted');
    }
}

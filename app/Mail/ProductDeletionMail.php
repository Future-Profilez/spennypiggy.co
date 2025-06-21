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
        return $this->subject('Your Wish List Items Have Been Deleted')
            ->view('email.product_deleted');
    }
}

<?php

namespace App\Mail;

use App\Models\Dispute;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DisputeCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $dispute;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, Dispute $dispute)
    {
        $this->user = $user;
        $this->dispute = $dispute;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Dispute Opened - Action Required')
            ->markdown('email.dispute-created')
            ->with([
                'user' => $this->user,
                'dispute' => $this->dispute,
            ]);
    }
}

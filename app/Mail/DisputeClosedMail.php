<?php

namespace App\Mail;

use App\Models\Dispute;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DisputeClosedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $dispute;
    public $won;

    /**
     * Create a new message instance.
     *
     * @param User $user
     * @param Dispute $dispute
     * @param bool $won
     */
    public function __construct(User $user, Dispute $dispute, bool $won)
    {
        $this->user = $user;
        $this->dispute = $dispute;
        $this->won = $won;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $subject = $this->won ? 'Dispute Won!' : 'Dispute Lost';

        return $this->subject($subject)
            ->markdown('email.dispute-closed')
            ->with([
                'user' => $this->user,
                'dispute' => $this->dispute,
                'won' => $this->won,
            ]);
    }
}

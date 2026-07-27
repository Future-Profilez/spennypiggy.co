<?php

namespace App\Mail;

use App\Models\Dispute;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DisputeUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $dispute;

    public $changes;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, Dispute $dispute, array $changes)
    {
        $this->user = $user;
        $this->dispute = $dispute;
        $this->changes = $changes;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $subject = 'Dispute Updated';

        if (isset($this->changes['status'])) {
            $subject = 'Dispute Status Changed to '.ucfirst($this->changes['status']['new']);
        }

        return $this->subject($subject)
            ->markdown('email.dispute-updated')
            ->with([
                'user' => $this->user,
                'dispute' => $this->dispute,
                'changes' => $this->changes,
            ]);
    }
}

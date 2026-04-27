<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PendingApprovalSummary extends Mailable
{
    use Queueable, SerializesModels;

    public array $pendingItems;

    /**
     * Create a new message instance.
     */
    public function __construct(array $pendingItems)
    {
        $this->pendingItems = $pendingItems;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Spenny Piggy — Pending Approval Summary')
                    ->view('email.pending_approval_summary')
                    ->with([
                        'pendingItems' => $this->pendingItems,
                    ]);
    }
}
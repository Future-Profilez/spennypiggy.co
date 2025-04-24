<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BioSocialUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $updatedFields;

    public function __construct(User $user, array $updatedFields)
    {
        $this->user = $user;
        $this->updatedFields = $updatedFields; // ['bio' => true, 'social' => true]
    }


    public function build()
    {
        // Mail::to($admin->email)->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
        try {
            if ($this->updatedFields['bio']) {
                $subject = "{$this->user->name} updated their Bio – Approval Needed";
            } elseif ($this->updatedFields['social']) {
                $subject = "{$this->user->name} updated their Social Media Handle – Approval Needed";
            }
            return $this->view('email.bio-social-update')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
        // return $this->subject('Profile Updated - Spenny Piggy')
        //     ->markdown('emails.users.bio-social-update');
    }
}

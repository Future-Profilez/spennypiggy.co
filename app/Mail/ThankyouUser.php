<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ThankyouUser extends Mailable
{
    use Queueable, SerializesModels;

    public $payment;


    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($payment)
    {
        $this->payment = $payment;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            // Safely get creator name for subject
            $creatorName = 'Spenny Piggy';
            if (isset($this->payment->payment) && 
                isset($this->payment->payment->owner) && 
                isset($this->payment->payment->owner->name) &&
                !empty($this->payment->payment->owner->name)) {
                $creatorName = $this->payment->payment->owner->name;
            }
            
            $subject = 'Thank You from ' . $creatorName . ' !!';
            
            return $this->view('email.thankyou-user')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
            \Log::error('ThankyouUser email build error', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'payment_id' => $this->payment->id ?? 'null',
                'payment_structure' => [
                    'payment_exists' => isset($this->payment->payment),
                    'owner_exists' => isset($this->payment->payment->owner) ? true : false,
                    'owner_name_exists' => isset($this->payment->payment->owner->name) ? true : false
                ]
            ]);
            throw $e; // Re-throw to ensure error is properly handled
        }
    }
}

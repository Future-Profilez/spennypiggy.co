<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class verifyEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            \Log::info('4');
            $name = $this->data['name'];
            \Log::info($name);
            $uuid = $this->data['uuid'];
            \Log::info($uuid);
            $username = $this->data['username'];
            \Log::info($username);
            $subject = 'Verify email from spanny piggy platform.';

            return $this->view('email.verify-email')->with(['name' => $name, 'uuid' => $uuid])
                ->from('Noreply@whoyouinto.com', 'SPANNYPIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
            \Log::info($e);
        }
    }
}

<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Welcome extends Mailable
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
            $name = $this->data['name'];
            $uuid = $this->data['uuid'];
            $subject = 'Welcome to the spanny piggy platform.';
            return $this->view('email.welcome-fans')->with(['name' => $name, 'uuid' => $uuid])
                ->from('Noreply@whoyouinto.com', 'SPANNYPIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}

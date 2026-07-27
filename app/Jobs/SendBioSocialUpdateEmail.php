<?php

namespace App\Jobs;

use App\Mail\BioSocialUpdateMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendBioSocialUpdateEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $user;

    public $updatedFields;

    public function __construct(User $user, array $updatedFields)
    {
        $this->user = $user;
        $this->updatedFields = $updatedFields;
    }

    public function handle(): void
    {
        $appUrl = config('app.url'); // e.g. https://dev.spennypiggy.co

        if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
            Mail::to('prem@futureprofilez.com')->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
        } elseif ($appUrl == 'https://spennypiggy.co') {
            Mail::to('jack@spennypiggy.co')->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
        }
    }
}

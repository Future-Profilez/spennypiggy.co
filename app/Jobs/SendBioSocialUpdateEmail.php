<?php

namespace App\Jobs;

use App\Mail\BioSocialUpdateMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;

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
        // Mail::to('prem@futureprofilez.com')->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
        Mail::to('jack@socialvortex.io')->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
    }
}

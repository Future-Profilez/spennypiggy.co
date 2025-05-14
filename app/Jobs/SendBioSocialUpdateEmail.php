<?php

namespace App\Jobs;

use App\Mail\BioSocialUpdateMail;
use App\Models\User;
use Illuminate\Http\Request;
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

    public function handle(Request $request): void
    {
        $method = $request->method(); // GET, POST, etc.
        $host = $request->getHost(); // e.g. "example.com"
        $scheme = $request->getScheme(); // http or https
        // $path = $request->getPathInfo(); // e.g. "/api/update-bio"
        // $query = $request->getQueryString(); // e.g. "id=1"

        $fullUrl = $scheme . '://' . $host;

        if ($fullUrl == 'https://dev.spennypiggy.co/' || 'http://127.0.0.1:8000/') {
            Mail::to('prem@futureprofilez.com')->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
        } else if ($fullUrl == 'https://spennypiggy.co/') {
            Mail::to('jack@socialvortex.io')->send(new BioSocialUpdateMail($this->user, $this->updatedFields));
        }
    }
}

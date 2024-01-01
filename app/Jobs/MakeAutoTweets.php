<?php

namespace App\Jobs;

use App\Mail\TestingMail;
use App\Mail\Wishlist;
use App\Models\TwitterToken;
use App\TwitterAuthService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class MakeAutoTweets implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $user;
    /**
     * Create a new job instance.
     */
    public function __construct($user)
    {
        $this->user = $user;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $token = TwitterToken::where('user_id',$this->user->id)->latest()->first();
        $tweet = "It's time to drop some coins! Checkout my wishlist, Send me a 🎁 " . env('APP_URL') . "/" . $this->user->username;
        $res = TwitterAuthService::postTweet($token,$tweet);

        // $res = json_encode($res);
        
        // Mail::to('saurav@futureprofilez.com')
        // ->send(new TestingMail($res));
    }
}

<?php

namespace App\Jobs;

use App\Helpers;
use App\Models\User;
use App\TwitterAuthService;
use App\TwitterHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SurpriseTweet implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $payment_data;
    /**
     * Create a new job instance.
     */
    public function __construct($payment_data)
    {
        $this->payment_data = $payment_data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = User::find($this->payment_data->cart->owner_id);
        if(!empty($user->twitter_token->token)) {
            $payload    =   [
                'name' => $this->payment_data->payment->name,
                'amount' => Helpers::getCurrency($this->payment_data->payment->currency) . $this->payment_data->amount,
                "user_link" =>  route("user.show", ["username" => $user->username, "_t" => time()])
                // "user_link" =>  "https://uk.spennypiggy.co/jacksgifts?_t=".time()
            ];

            $content = TwitterHelper::getTwitterContent("surprise", $payload);
            $resp = TwitterAuthService::postTweet($user->twitter_token, $content);
            $this->payment_data->update([
                "twitter_response" => $resp
            ]);
        }
    }
}

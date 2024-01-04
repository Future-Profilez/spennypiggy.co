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

class TipJarTweet implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tip_pay;
    /**
     * Create a new job instance.
     */
    public function __construct($tip_pay)
    {
        $this->tip_pay = $tip_pay;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = User::find($this->tip_pay->tipGoal->user_id);
        if(!empty($user->twitter_token->token)) {
            $payload    =   [
                'name' => $this->tip_pay->guest_name,
                'amount' => Helpers::getCurrency($this->tip_pay->currency) . $this->tip_pay->amount,
                "user_link" =>  route("user.show", ["username" => $user->username, "_t" => time()])
                // "user_link" =>  "https://uk.spennypiggy.co/jacksgifts?_t=".time()
            ];

            $content = TwitterHelper::getTwitterContent("tip-jar-tips", $payload);
            $resp = TwitterAuthService::postTweet($user->twitter_token, $content);
            $this->tip_pay->update([
                "twitter_response" => $resp
            ]);
        }
    }
}

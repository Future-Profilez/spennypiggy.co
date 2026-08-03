<?php

namespace App\Jobs;

use App\Helpers;
use App\Models\User;
use App\TwitterAuthService;
use App\TwitterHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SubscribeAutoTweet implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sub;

    /**
     * Create a new job instance.
     */
    public function __construct($sub)
    {
        $this->sub = $sub;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = User::find($this->sub->wish_item->user_id);
        if ($user && $user->twitter_token && ! empty($user->twitter_token->token)) {
            $payload = [
                'name' => $this->sub->guest_name ?? 'Someone',
                'period' => $this->sub->wish_item->subscription_period,
                'wish' => $this->sub->wish_item->wishname,
                'amount' => Helpers::getCurrency($this->sub->currency).$this->sub->amount,
                'user_link' => route('user.show', ['username' => $user->username, '_t' => time()]),
                // "user_link" =>  "https://uk.spennypiggy.co/jacksgifts?_t=".time()
            ];

            $content = TwitterHelper::getTwitterContent('subscription', $payload);
            $resp = TwitterAuthService::postTweet($user->twitter_token, $content);
            $this->sub->update([
                'twitter_response' => $resp,
            ]);
        }
    }
}

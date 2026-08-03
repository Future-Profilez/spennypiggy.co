<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\WishItem;
use App\TwitterAuthService;
use App\TwitterHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AutoTweetWishAdd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Wish Item
     *
     * @var WishItem
     */
    public $wish_item;

    /**
     * Create a new job instance.
     */
    public function __construct($wish_item)
    {
        $this->wish_item = $wish_item;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = User::find($this->wish_item->user_id);
        if ($user && $user->twitter_token && ! empty($user->twitter_token->token)) {
            $payload = [
                'user_link' => route('user.show', ['username' => $user->username, '_t' => time()]),
                // "user_link" =>  "https://uk.spennypiggy.co/jacksgifts?_t=".time()
            ];

            $content = TwitterHelper::getTwitterContent('wish-add', $payload);
            $resp = TwitterAuthService::postTweet($user->twitter_token, $content);
            $this->wish_item->update([
                'twitter_response' => $resp,
            ]);
        }
    }
}

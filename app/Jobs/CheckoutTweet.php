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
use Illuminate\Support\Facades\Log;

class CheckoutTweet implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $payment_data;

    public $tries = 3; // Allow 3 attempts before considering the job failed

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
        try {
            Log::info('CheckoutTweet job started', ['payment_id' => $this->payment_data->id]);

            $user = User::find($this->payment_data->wish->user_id);

            if (! $user) {
                Log::error('CheckoutTweet: User not found', ['wish_user_id' => $this->payment_data->wish->user_id]);

                return;
            }

            if (empty($user->twitter_token)) {
                Log::warning('CheckoutTweet: User has no Twitter token', ['user_id' => $user->id]);

                return;
            }

            if (empty($user->twitter_token->token)) {
                Log::warning('CheckoutTweet: User Twitter token is empty', ['user_id' => $user->id]);

                return;
            }

            $payload = [
                'name' => $this->payment_data->payment->name ?? 'Someone',
                'amount' => Helpers::getCurrency($this->payment_data->payment->currency).$this->payment_data->amount,
                'user_link' => route('user.show', ['username' => $user->username, '_t' => time()]),
            ];

            Log::info('CheckoutTweet: Preparing tweet content', ['payload' => $payload]);

            $content = TwitterHelper::getTwitterContent('purchase', $payload);
            Log::info('CheckoutTweet: Tweet content generated', ['content' => $content]);

            $resp = TwitterAuthService::postTweet($user->twitter_token, $content);
            Log::info('CheckoutTweet: Twitter API response', ['response' => $resp]);

            $this->payment_data->update([
                'twitter_response' => json_encode($resp),
            ]);

            Log::info('CheckoutTweet job completed successfully', ['payment_id' => $this->payment_data->id]);
        } catch (\Exception $e) {
            Log::error('CheckoutTweet job failed', [
                'payment_id' => $this->payment_data->id ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Rethrow the exception to mark the job as failed in Laravel's queue system
            throw $e;
        }
    }
}

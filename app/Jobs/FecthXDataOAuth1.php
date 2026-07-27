<?php

namespace App\Jobs;

use App\Models\TwitterToken;
use App\TwitterAuth1;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FecthXDataOAuth1 implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Twitter Token
     *
     * @var TwitterToken
     */
    public $token;

    /**
     * Create a new job instance.
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $api = new TwitterAuth1;
        $resp = $api->getUser($this->token);
        if ($resp['status']) {
            $this->token->update([
                'twitter_id' => $resp['user']['id'],
                'username' => $resp['user']['name'],
            ]);
        }
    }
}

<?php

namespace App\Jobs;

use App\TwitterAuthService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FetchSelfTwitterData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    /**
     * Twitter Token
     * @var \App\Models\TwitterToken
     */
    public $token;

    /**
     * Create a new job instance.
     */
    public function __construct($token)
    {
        $this->token    =   $token;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $resp   =   TwitterAuthService::getSelf($this->token);
        if($resp['success']) {
            $this->token->update([
                'twitter_id'    =>  $resp['data']['id'],
                'username'      =>  $resp['data']['username'],
            ]);
        }
    }
}

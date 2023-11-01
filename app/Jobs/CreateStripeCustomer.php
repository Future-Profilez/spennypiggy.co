<?php

namespace App\Jobs;

use App\StripeControl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreateStripeCustomer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * User
     * @var \App\Models\User
     */
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
        $payload = [
            "name" => $this->user->name,
            "email" => $this->user->email,
            "description" => "{$this->user->name}'s Account"
        ];
        $customer = StripeControl::createCustomer($payload);
        if(!empty($customer->id)){
            $this->user->stripe_id = $customer->id;
            $this->user->save();
        }
    }
}

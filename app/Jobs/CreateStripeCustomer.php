<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Models\User;
use App\StripeControl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreateStripeCustomer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    /**
     * User
     *
     * @var User
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
        // Re-read: the job may be retried, and a customer created on the previous
        // attempt would otherwise be orphaned by a second createCustomer call.
        $user = User::find($this->user->id);

        if (! $user || ! empty($user->stripe_id)) {
            return;
        }

        $payload = [
            'name' => $user->name,
            'email' => $user->email,
            'description' => "{$user->name}'s Account",
        ];
        $customer = StripeControl::createCustomer($payload);
        if (! empty($customer->id)) {
            $user->stripe_id = $customer->id;
            $user->save();
        }
    }
}

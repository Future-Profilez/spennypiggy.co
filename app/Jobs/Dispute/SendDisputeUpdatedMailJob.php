<?php

namespace App\Jobs\Dispute;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Mail\DisputeUpdatedMail;
use App\Models\Dispute;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDisputeUpdatedMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    protected $user;

    protected $dispute;

    protected $changes;

    /**
     * Create a new job instance.
     *
     * @param  User|null  $user
     */
    public function __construct($user, Dispute $dispute, array $changes)
    {
        $this->user = $user;
        $this->dispute = $dispute;
        $this->changes = $changes;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if (! $this->user) {
            return;
        }

        try {
            Mail::to($this->user->email)->send(
                new DisputeUpdatedMail($this->user, $this->dispute, $this->changes)
            );
        } catch (\Exception $e) {
            Log::error('SendDisputeUpdatedMailJob failed', [
                'user_id' => $this->user->id,
                'dispute_id' => $this->dispute->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

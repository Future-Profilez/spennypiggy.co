<?php

namespace App\Jobs\Dispute;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Mail\DisputeCreatedMail;
use App\Models\Dispute;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDisputeCreatedMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    protected $user;

    protected $dispute;

    /**
     * Create a new job instance.
     */
    public function __construct(User $user, Dispute $dispute)
    {
        $this->user = $user;
        $this->dispute = $dispute;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            Mail::to($this->user->email)->send(
                new DisputeCreatedMail($this->user, $this->dispute)
            );
        } catch (\Exception $e) {
            Log::error('SendDisputeCreatedMailJob failed', [
                'user_id' => $this->user->id,
                'dispute_id' => $this->dispute->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

<?php

namespace App\Jobs\Dispute;

use App\Models\Dispute;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use App\Mail\DisputeClosedMail;
use Illuminate\Support\Facades\Log;

class SendDisputeClosedMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;
    protected $dispute;
    protected $won;

    /**
     * Create a new job instance.
     *
     * @param User $user
     * @param Dispute $dispute
     * @param bool $won
     */
    public function __construct(User $user, Dispute $dispute, bool $won)
    {
        $this->user = $user;
        $this->dispute = $dispute;
        $this->won = $won;
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
                new DisputeClosedMail($this->user, $this->dispute, $this->won)
            );
        } catch (\Exception $e) {
            Log::error('SendDisputeClosedMailJob failed', [
                'user_id' => $this->user->id,
                'dispute_id' => $this->dispute->id,
                'won' => $this->won,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

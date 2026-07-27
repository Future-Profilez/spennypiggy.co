<?php

namespace App\Jobs;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotificationSave implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $message;

    public $notifiable;

    public $user;

    public $type;

    /**
     * Create a new job instance.
     */
    public function __construct($message, $notifiable, $user, $type)
    {
        $this->message = $message;
        $this->notifiable = $notifiable;
        $this->user = $user;
        $this->type = $type;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {

        $notification = new Notification;
        $notification->notification = $this->message;
        $notification->notifiable_id = $this->notifiable->id;
        $notification->user_id = ! empty($this->user) ? $this->user->id : null;
        $notification->notifiable_type = $this->type;
        $notification->save();

    }
}

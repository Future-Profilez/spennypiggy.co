<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\NotificationLog;
use App\Models\User;
use App\Support\NotificationRecorder;
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

        // Recorded so a bell entry counts as a delivery like any other. Without
        // it a purchase could show "notified" on the site while the push and the
        // email both failed, which is the same silence this log exists to break.
        NotificationRecorder::bell(
            $this->message,
            null,
            $this->notifiable instanceof User ? $this->notifiable : null,
            NotificationLog::STATUS_SENT,
            null,
            $this->type ? 'bell.'.strtolower((string) class_basename($this->type)) : null,
        );
    }
}

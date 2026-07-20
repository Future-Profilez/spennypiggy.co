<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Delivers one engagement notification off the request/command thread.
 *
 * Sending is a synchronous HTTP call to MagicBell plus a mail send, so a
 * command fanning out to thousands of supporters must queue rather than send
 * inline — requires `queue:work` to be running.
 */
class SendEngagementNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public $backoff = 30;

    public function __construct(
        public int $userId,
        public string $type,
        public array $payload,
        public array $channels = NotificationDispatcher::ALL_CHANNELS,
        public bool $marketing = true,
    ) {}

    public function handle(NotificationDispatcher $dispatcher): void
    {
        $user = User::find($this->userId);

        if (! $user) {
            return;
        }

        $dispatcher->send($user, $this->type, $this->payload, $this->channels, $this->marketing);
    }
}

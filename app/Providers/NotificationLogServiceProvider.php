<?php

namespace App\Providers;

use App\Listeners\LogOutboundMail;
use App\Support\NotificationContext;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\Events\JobExceptionOccurred;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;

/**
 * Wires the notification delivery log into the framework.
 *
 * Three hooks, each chosen so that no individual send site has to know the log
 * exists:
 *
 *  1. Mail events — every outbound email, whatever sent it.
 *  2. A global mailable view-data callback, so the log can name the mailable
 *     class (Laravel does not otherwise expose it on the mail events).
 *  3. Queue payload stamping — the transaction context is snapshotted onto
 *     every job dispatched while a context is open, and restored while that job
 *     runs. Receipts are mailed from inside queued jobs several hops from the
 *     webhook that caused them; without this they would all be logged with no
 *     payment attached, which is the whole point of the feature.
 */
class NotificationLogServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (! config('notification_logs.enabled', true)) {
            return;
        }

        Event::listen(MessageSending::class, [LogOutboundMail::class, 'sending']);
        Event::listen(MessageSent::class, [LogOutboundMail::class, 'sent']);

        // Adds the mailable's class name to its view data so the mail events can
        // report what was sent. Only ever ADDS a key — the slot is global and a
        // callback that replaced the data would break every mailable's template.
        Mailable::buildViewDataUsing(function ($mailable) {
            return ['__spenny_mailable' => get_class($mailable)];
        });

        $this->propagateContextAcrossTheQueue();
    }

    private function propagateContextAcrossTheQueue(): void
    {
        Queue::createPayloadUsing(function () {
            if (NotificationContext::isEmpty()) {
                return [];
            }

            return [NotificationContext::PAYLOAD_KEY => NotificationContext::current()];
        });

        Event::listen(JobProcessing::class, function (JobProcessing $event) {
            try {
                $snapshot = $event->job->payload()[NotificationContext::PAYLOAD_KEY] ?? null;

                // Always clear first: a worker is a long-lived process and a
                // context left over from the previous job would label this job's
                // mail with the wrong payment.
                NotificationContext::clear();

                if (is_array($snapshot)) {
                    NotificationContext::restore($snapshot);
                }
            } catch (\Throwable $e) {
                NotificationContext::clear();
            }
        });

        foreach ([JobProcessed::class, JobFailed::class, JobExceptionOccurred::class] as $event) {
            Event::listen($event, function () {
                NotificationContext::clear();
            });
        }
    }
}

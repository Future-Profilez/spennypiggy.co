<?php

namespace App\Support;

use App\Mail\ContentUnderReview;
use App\Models\User;
use App\Services\NotificationDispatcher;

/**
 * How a creator is told their content has been held — one place, so the image
 * check and the text check cannot drift into telling them different things in
 * different ways.
 *
 * Both checks used to dispatch NotificationSave, which writes ONLY the in-app
 * bell row. A creator whose listing had been pulled from sale therefore found
 * out by happening to open the site and notice a bell — no push, no email. This
 * routes the same message through all three channels.
 *
 * TRANSACTIONAL (`$marketing = false`): consent flags are bypassed on purpose.
 * A hold is not promotion — it is the platform telling someone their item is no
 * longer for sale and what to do about it, and there is no version of that a
 * creator should be able to opt out of. Do not add one.
 */
class ModerationNotice
{
    /** Notification type, also the dedup namespace inside the dispatcher. */
    public const TYPE = 'moderation_hold';

    /**
     * @param  string  $feature  What was held, in words ('shop listing', 'profile photo').
     * @param  string  $itemTitle  The listing's own name, when it has one.
     * @param  string  $reason  Creator-facing explanation, already written by the check.
     */
    public static function send(?User $creator, string $feature, string $itemTitle = '', string $reason = ''): void
    {
        if (! $creator) {
            return;
        }

        $named = trim($itemTitle) !== '' ? " \"{$itemTitle}\"" : '';
        $body = "Your {$feature}{$named} is under review and isn't visible to buyers yet."
            .($reason !== '' ? ' '.$reason : '');

        NotificationDispatcher::queue(
            $creator,
            self::TYPE,
            [
                'title' => 'Content under review',
                'body' => $body,
                'module' => 'moderation',
                'mailable' => ContentUnderReview::class,
                // Keyed, so the mailable receives named arguments — reordering
                // these cannot hand it the wrong values.
                'mailable_args' => [
                    'creatorName' => (string) ($creator->name ?? ''),
                    'feature' => $feature,
                    'itemTitle' => trim($itemTitle),
                    'reason' => $reason,
                    'manageUrl' => config('app.url'),
                ],
            ],
            NotificationDispatcher::ALL_CHANNELS,
            false
        );
    }
}

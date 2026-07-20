<?php

namespace App\Services;

use App\Models\EngagementNotification;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * "Your creator just published something" — tells a creator's followers when
 * new content goes live, so they come back while it's fresh.
 *
 * Two rules matter here:
 *  1. **Only announce live content.** Piggy Pots, Shop items and Tasks can be
 *     held by media moderation; announcing a held item sends followers to
 *     something that may be rejected. Callers must only fire once the item is
 *     approved/live.
 *  2. **Queue, never send inline.** A creator with 10k followers would otherwise
 *     make 10k synchronous HTTP calls inside a web request.
 */
class CreatorEventNotifier
{
    /** Followers notified per item, as a safety bound on one creator's fan-out. */
    private const MAX_RECIPIENTS = 5000;

    /**
     * @param  string  $productType  wish|membership|piggypot|shop|bill
     */
    public function notifyFollowers(int $creatorId, string $productType, int $itemId, string $itemTitle = ''): void
    {
        $creator = User::find($creatorId);

        if (! $creator) {
            return;
        }

        $followerIds = Follow::where('followed_id', $creatorId)
            ->limit(self::MAX_RECIPIENTS)
            ->pluck('follower_id')
            ->unique()
            ->values();

        if ($followerIds->isEmpty()) {
            return;
        }

        $handle = $creator->username ? '@'.$creator->username : $creator->name;
        $label = $this->label($productType);
        $title = $handle.' just posted new content';
        $body = $itemTitle !== ''
            ? '"'.$itemTitle.'" is now available.'
            : 'A new '.$label.' is now available.';

        $dedupKey = $productType.'|'.$itemId;

        foreach ($followerIds as $followerId) {
            $follower = User::find($followerId);

            if (! $follower || empty($follower->email) || $follower->id === $creatorId) {
                continue;
            }

            // One notification per follower per item, even if the publish path
            // fires twice (e.g. save + moderation approve).
            if (! NotificationDispatcher::claim($follower->id, EngagementNotification::TYPE_CREATOR_EVENT, $dedupKey)) {
                continue;
            }

            NotificationDispatcher::queue($follower, EngagementNotification::TYPE_CREATOR_EVENT, [
                'title' => $title,
                'body' => $body,
                'module' => 'creator_event',
                'target_id' => $itemId,
                'from_user_id' => $creatorId,
            ], [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH]);
        }

        Log::info('CreatorEventNotifier: queued follower notifications', [
            'creator_id' => $creatorId,
            'product_type' => $productType,
            'item_id' => $itemId,
            'followers' => $followerIds->count(),
        ]);
    }

    private function label(string $productType): string
    {
        return match ($productType) {
            'wish' => 'wish item',
            'membership' => 'membership',
            'piggypot' => 'Piggy Pot',
            'shop' => 'shop item',
            'bill' => 'subscription',
            default => 'item',
        };
    }
}

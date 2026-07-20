<?php

namespace App\Observers;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\WishItem;
use App\Services\CreatorEventNotifier;
use Illuminate\Database\Eloquent\Model;

/**
 * Notifies a creator's followers when new content goes LIVE.
 *
 * Handles both paths in one place:
 *  - content that is live the moment it is created, and
 *  - content that is created in a held/pending state and only becomes live when
 *    an admin approves it (Piggy Pot / Shop go through media moderation).
 *
 * Followers are never told about content that is still under review — that
 * would send them to something which might be rejected. Per-follower dedup in
 * CreatorEventNotifier means the created+approved double-fire is harmless.
 */
class CreatorContentObserver
{
    /** Model class => [product type, live check]. */
    private const MAP = [
        WishItem::class => 'wish',
        Shop::class => 'shop',
        PiggyPot::class => 'piggypot',
        Membership::class => 'membership',
        Bills::class => 'bill',
    ];

    public function created(Model $model): void
    {
        if ($this->isLive($model)) {
            $this->notify($model);
        }
    }

    public function updated(Model $model): void
    {
        // Only when it has just crossed into being live — not on every edit.
        if ($this->isLive($model) && $this->justBecameLive($model)) {
            $this->notify($model);
        }
    }

    /** Is this item visible/purchasable right now? */
    private function isLive(Model $model): bool
    {
        // Moderation flags — a held item is not live.
        if (array_key_exists('is_approved', $model->getAttributes()) && ! (int) $model->is_approved) {
            return false;
        }

        if (array_key_exists('approved', $model->getAttributes()) && ! (int) $model->approved) {
            return false;
        }

        $status = $model->getAttribute('status');

        if ($status !== null && in_array((string) $status, ['moderation_hold', 'draft', 'pending', 'rejected', 'deleted', 'inactive'], true)) {
            return false;
        }

        return true;
    }

    /** Did this save flip one of the gating fields into the live state? */
    private function justBecameLive(Model $model): bool
    {
        foreach (['is_approved', 'approved', 'status'] as $field) {
            if ($model->wasChanged($field)) {
                return true;
            }
        }

        return false;
    }

    private function notify(Model $model): void
    {
        $productType = self::MAP[get_class($model)] ?? null;
        $creatorId = (int) ($model->getAttribute('user_id') ?? $model->getAttribute('creator_id') ?? 0);

        if (! $productType || ! $creatorId) {
            return;
        }

        $title = (string) ($model->getAttribute('name') ?? $model->getAttribute('title') ?? '');

        app(CreatorEventNotifier::class)->notifyFollowers(
            $creatorId,
            $productType,
            (int) $model->getKey(),
            $title
        );
    }
}

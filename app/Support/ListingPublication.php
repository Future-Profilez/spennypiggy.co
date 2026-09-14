<?php

namespace App\Support;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\WishItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * 🚨 A LISTING GOES LIVE WHEN IT IS SAVED. THE CHECKS RETRACT IT, THEY DO NOT RELEASE IT.
 *
 * Client simplification plan, 10 Sep 2026, §8/§9: *"Don't make admins approve every normal
 * post… if the automated checks detect no issue, publish immediately. Do not wait for human
 * approval."* Every one of the six sellable modules did the opposite — each create wrote its
 * held value (`approved = 0`, `is_approved = 0`, `status = 'moderation_hold'`) and the three
 * scanners could only ever hold FURTHER. **Nothing in the codebase could clear a listing**;
 * only an admin in the back office could, and the queue they would have to work is the one
 * the plan removes. So a clean task, wish, bill, membership, shop item or pot sat at
 * PENDING REVIEW for ever, which is exactly how it was reported.
 *
 * This is the same trade `ProfileAutoApproval` made for the avatar on 11 Sep 2026: the item
 * is published on save and the scan RETRACTS it seconds later if it finds something. It is
 * publish-then-check for those seconds, deliberately, and the fraud control that did not
 * move is `PayoutEligibility` — an unverified creator can list and sell, and cannot withdraw.
 *
 * ⚠️ WHAT THIS DOES NOT TOUCH, and must not:
 *   - the shop's >£2,500 enhanced review (a separate Stripe compliance rule, still holds),
 *   - an admin's own hold, which is a decision a person took,
 *   - `CheckMediaModeration`'s fail-closed branches — "we could not check it" is still a hold.
 */
final class ListingPublication
{
    /** What "live" means for each module. */
    public const LIVE = [
        WishItem::class => ['is_approved' => 1],
        Bills::class => ['approved' => 1],
        Membership::class => ['approved' => 1],
        PiggyPot::class => ['status' => 'active'],
        Shop::class => ['approved' => 1],
        Task::class => ['is_approved' => 1],
        // A post is content, not a listing, and it publishes on the same contract:
        // the client's §8 is literally "don't make admins approve every normal post".
        Post::class => ['approved' => 1],
    ];

    /**
     * What "held" means for each module — the attributes every scanner is handed.
     *
     * 🚨 ONE DEFINITION. These values are read by the admin Content Review queue in the
     * other app, so a module inventing its own spelling is a listing held where nobody
     * can see it. Six copies of this map is how that happens.
     */
    public const HELD = [
        WishItem::class => ['is_approved' => 0],
        Bills::class => ['approved' => 0],
        Membership::class => ['approved' => 0],
        PiggyPot::class => ['status' => 'moderation_hold'],
        Shop::class => ['approved' => 0],
        Task::class => ['is_approved' => 0],
        Post::class => ['approved' => 0],
    ];

    /** The attributes marking this listing held, for a scanner's `$flagOnViolation`. */
    public static function heldAttributes(Model|string $item): array
    {
        return self::HELD[is_string($item) ? $item : $item::class] ?? [];
    }

    /** The attributes marking this listing live. */
    public static function liveAttributes(Model|string $item): array
    {
        return self::LIVE[is_string($item) ? $item : $item::class] ?? [];
    }

    /** Is this listing sitting at its own held value right now? */
    public static function isHeld(?Model $item): bool
    {
        if (! $item) {
            return false;
        }

        $held = self::HELD[$item::class] ?? [];

        if ($held === []) {
            return false;
        }

        foreach ($held as $column => $value) {
            // Loose, deliberately: `approved` is a tinyint on some tables and a bool
            // on others, and `is_approved` is written as both `0` and `false`.
            if ($item->getAttribute($column) != $value) {
                return false;
            }
        }

        return true;
    }

    /**
     * Put a HELD listing back on sale after the creator edited it.
     *
     * 🚨 NOT THE SAME AS `publish()`, AND THE DIFFERENCE IS THE WHOLE POINT. Editing a
     * listing must not be a way past the checks: a cover that was flagged and was NOT
     * replaced is still that cover, and the media scans deliberately skip an unchanged
     * file (Rekognition is deterministic — re-scanning re-produces a false positive and
     * would un-approve a listing an admin had already cleared). So a hold is lifted only
     * when this save plausibly fixed it.
     *
     * @param  array  $replacedAssets  The `moderation_asset` keys whose file the creator
     *                                 actually changed in THIS save (e.g. ['cover_image']).
     */
    public static function republish(?Model $item, array $replacedAssets = []): bool
    {
        if (! self::isHeld($item)) {
            // Not held: nothing to lift. ⚠️ Never call `publish()` here — a Piggy Pot
            // can legitimately be `completed` or `expired`, and forcing it back to
            // `active` on an unrelated edit would reopen a goal that had finished.
            return false;
        }

        $asset = trim((string) ($item->getAttribute('moderation_asset') ?? ''));

        /*
         * 🚨 NO RECORDED CAUSE MEANS A PERSON DID IT. An admin's hold writes the flag
         * and no asset key, so it is indistinguishable from a scan hold except by this
         * — and a creator must not be able to overturn a decision somebody took by
         * saving the form again.
         */
        if ($asset === '') {
            return false;
        }

        // The text is re-read synchronously on every save, so it re-holds by itself if
        // the new wording is still wrong. Lifting it here is what makes "edit the
        // wording to make it live" true.
        if ($asset === 'reward_text') {
            return self::publish($item);
        }

        return in_array($asset, $replacedAssets, true) ? self::publish($item) : false;
    }

    /**
     * Publish a listing the creator has just saved.
     *
     * ⚠️ Called AFTER the row exists and BEFORE the scanners are dispatched, so a scan that
     * comes back dirty overwrites this rather than racing it.
     *
     * 🚨 It clears `moderation_reason` / `moderation_asset` as well as the flag. A creator
     * who fixes the wording their listing was held for gets it back live — with the old
     * sentence still on the row, their own card would go on telling them why it was held
     * while it was on sale.
     *
     * 🚨 NEVER THROWS. Every caller is inside a create or edit the creator has already
     * completed; failing here would turn "your listing is live" into a 500 on a listing
     * that was saved correctly. A failure leaves the row at its held default, which is the
     * old behaviour and is recoverable by saving again.
     */
    public static function publish(?Model $item): bool
    {
        if (! $item) {
            return false;
        }

        $attributes = self::liveAttributes($item);

        if ($attributes === []) {
            return false;
        }

        try {
            foreach (['moderation_reason', 'moderation_asset'] as $column) {
                if (Schema::hasColumn($item->getTable(), $column)) {
                    $attributes[$column] = null;
                }
            }

            $item->forceFill($attributes)->save();

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to publish listing: '.$e->getMessage(), [
                'model' => $item::class,
                'id' => $item->getKey(),
            ]);

            return false;
        }
    }
}

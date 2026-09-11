<?php

namespace App\Support;

use App\Jobs\CheckMediaModeration;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\WishItem;
use App\Services\RekognitionModeration;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Scan the thing the supporter actually PAYS for.
 *
 * 🚨 ONLY SHOP EVER DID THIS. Every module scanned its shop-front image — the wish
 * thumbnail, the bill thumbnail, the membership thumbnail, the pot cover, the task
 * image — and five of the six then shipped an unscanned file to the buyer. Shop had
 * carried its own `moderateRewardFile()` since 27 July 2026 with the reason written
 * on it ("scanning only the shop-front thumbnail let unscanned media ship to
 * buyers"), and the other five were never given one. This is that method, made
 * general, with Shop delegating to it so there is one definition rather than six.
 *
 * ⚠️ THE FILE COLUMN IS DIFFERENT ON EVERY MODULE and that is exactly why this was
 * missed: `content_file` (wish, bill, membership, piggy pot), `reward_file` (shop),
 * `deliverable_content` (task). A sixth spelling is how the seventh module gets
 * forgotten, so the map below is the single list and a drift test pins it against
 * `RewardService`'s own module map.
 *
 * ⚠️ A HELD REWARD FILE HOLDS ITS OWN LISTING AND NOTHING ELSE. The caller passes
 * that listing's own held attributes; nothing here reads or writes the creator, the
 * account, or another listing.
 */
final class RewardFileScan
{
    /** The asset key written to `moderation_asset`, so a reviewer knows it was the paid file. */
    public const ASSET = 'reward_file';

    /**
     * Model => [file column, mime column].
     *
     * ⚠️ Task's `deliverable_content` holds a full CDN **URL** while the rest hold a
     * bare UUID. `RekognitionModeration::uuidFrom()` reads both, which is why the
     * reference is passed through untouched rather than concatenated onto a host.
     */
    public const COLUMNS = [
        WishItem::class => ['content_file', 'content_file_type'],
        Bills::class => ['content_file', 'content_file_type'],
        Membership::class => ['content_file', 'content_file_type'],
        PiggyPot::class => ['content_file', 'content_file_type'],
        Shop::class => ['reward_file', 'reward_file_type'],
        Task::class => ['deliverable_content', 'deliverable_content_type'],
    ];

    /** The reward file currently stored on an item, for the caller to capture before it saves. */
    public static function currentFile(?Model $item): ?string
    {
        if (! $item) {
            return null;
        }

        $columns = self::COLUMNS[$item::class] ?? null;

        return $columns ? (string) ($item->getAttribute($columns[0]) ?? '') : null;
    }

    /**
     * Queue a scan of the item's paid reward file, if it has one worth scanning.
     *
     * @param  array  $flagOnViolation  How THIS listing marks itself held (e.g. ['approved' => 0]).
     * @param  string|null  $previousFile  The file before this save. Pass it on an edit.
     */
    public static function dispatch(?Model $item, array $flagOnViolation, ?string $previousFile = null): void
    {
        if (! $item) {
            return;
        }

        $columns = self::COLUMNS[$item::class] ?? null;

        if ($columns === null) {
            return;
        }

        [$fileColumn, $mimeColumn] = $columns;

        $file = trim((string) ($item->getAttribute($fileColumn) ?? ''));

        if ($file === '') {
            return;
        }

        /*
         * ⚠️ ONLY SCAN A FILE THE CREATOR ACTUALLY CHANGED. Rekognition is
         * deterministic, so re-scanning an unchanged file re-produces the same
         * verdict — which on a false positive silently un-approves a listing an
         * admin has already cleared, on the creator's next unrelated price edit,
         * with no way out of the loop. Same guard the thumbnail scans carry.
         */
        if ($previousFile !== null && trim($previousFile) === $file) {
            return;
        }

        /*
         * An external link is not a file we host, so there is nothing for the scan
         * to fetch. `content_file` is nulled whenever the reward is a link
         * (RewardService::columnsWithFile), so in practice this only catches legacy
         * shop rows — which is why Shop's original method had the same early return.
         *
         * ⚠️ A reference that is NOT a URL but still yields no UUID is deliberately
         * NOT skipped: it is dispatched, and `CheckMediaModeration::handle()` fails
         * CLOSED on it. "We cannot read this" is a hold, not a pass.
         */
        if (Str::startsWith($file, ['http://', 'https://']) && RekognitionModeration::uuidFrom($file) === null) {
            return;
        }

        /*
         * Rekognition's moderation labels only apply to images and video frames. A
         * PDF, zip or document produces no verdict, and the job's fail-closed branch
         * would hold it for ever waiting for an answer that cannot arrive — so an
         * explicitly non-visual mime is skipped here rather than burning two API
         * calls to reach the same place. These listings are still created unapproved
         * and read by a human before they go live.
         *
         * ⚠️ An UNKNOWN mime is scanned, not skipped — `ShopsController` learned that
         * the hard way when a broken mime reader left every reward file reading
         * `image` or nothing at all (24 Aug 2026). Null means "we were not told",
         * which is not evidence of anything.
         */
        $mime = strtolower(trim((string) ($item->getAttribute($mimeColumn) ?? '')));

        if ($mime !== '' && ! Str::contains($mime, ['image', 'video'])) {
            return;
        }

        CheckMediaModeration::dispatch(
            $item::class,
            $item->getKey(),
            $file,
            $flagOnViolation,
            self::ASSET
        );
    }
}

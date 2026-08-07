<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Models\ProfileChangeRequest;
use App\Models\User;
use App\Services\RekognitionModeration;
use App\Support\ModerationNotice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Generic PG-13 / no-sexual-content moderation gate.
 *
 * Runs the same Uploadcare + AWS Rekognition scan used for wish thumbnails
 * (see CheckAdultContent) but, instead of deleting, flags the parent record so
 * it is held for manual review. Lets the SFW gate extend to every upload
 * surface (Piggy Pot, Shop, Tasks) as required for Stripe compliance.
 */
class CheckMediaModeration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    /**
     * Rekognition moderation-label words that trigger a hold. Curated to the
     * clearly-prohibited (NSFW / violent / hateful) categories so legitimate
     * creator content (swimwear, "Suggestive", combat sports) is NOT flagged.
     * Matched case-insensitively as a substring of the full label name.
     *
     * Public because the upload-time check (ProfileController::checkAdultContent)
     * reads the same two constants. It used to keep its own list, which had
     * drifted to include `Combat`, `Weapons`, `Blood`, `Mature` and `Aggression`
     * with no confidence floor at all — so a boxing or gym photo was told
     * "your content contains nudity" — while missing the label Rekognition
     * actually returns for the thing it is meant to catch.
     */
    public const REST_WORDS = RekognitionModeration::REST_WORDS;

    /** Minimum Rekognition confidence (%) before a label counts — cuts false positives. */
    public const MIN_CONFIDENCE = RekognitionModeration::MIN_CONFIDENCE;

    /** How long to wait for a verdict before holding the content unscanned. */
    private const SCAN_WAIT_SECONDS = 20;

    /**
     * The asset keys a scan may be dispatched for, and how each reads in a
     * sentence. The key is what lands in `moderation_asset`; the label is what
     * the creator sees. Keeping both here means the review screen never has to
     * infer the asset from prose, and re-wording the copy cannot break it.
     */
    public const ASSET_LABELS = [
        'thumbnail' => 'thumbnail',
        'cover_image' => 'cover image',
        'product_image' => 'product image',
        'task_image' => 'task image',
        'reward_file' => 'reward file',
        'reward_text' => 'listing text',
        'avatar' => 'profile photo',
        'cover' => 'cover photo',
    ];

    /**
     * Human-readable feature names for creator-facing notifications, keyed by
     * model basename. Public because the text half of the gate
     * (App\Services\ItemTextModeration) words its notification the same way —
     * a creator should not be able to tell which check held their listing from
     * the shape of the sentence.
     */
    public const FEATURE_LABELS = [
        'PiggyPot' => 'Piggy Pot',
        'Shop' => 'shop listing',
        'Task' => 'task',
        'WishItem' => 'wish item',
        'Bills' => 'bill',
        'Membership' => 'membership level',
        'User' => 'profile photo',
    ];

    /**
     * @param  class-string  $modelClass  Eloquent model to flag on violation.
     * @param  int|string  $modelId  Primary key of the record.
     * @param  string|null  $mediaUuid  Uploadcare file UUID to scan.
     * @param  array  $flagOnViolation  Attributes to set when content is rejected (e.g. ['status' => 'moderation_hold']).
     * @param  string  $mediaAsset  Which asset this scan covers — one of self::ASSET_LABELS.
     *                              An item can be scanned more than once (a shop listing has both a
     *                              product image and a paid reward file), so "an image was flagged"
     *                              tells neither the reviewer nor the creator WHICH one to replace.
     *                              Stored in `moderation_asset` as well as named in the reason, so
     *                              the review screen reads a value rather than parsing a sentence.
     */
    public function __construct(
        public string $modelClass,
        public $modelId,
        public ?string $mediaUuid,
        public array $flagOnViolation = [],
        public string $mediaAsset = 'thumbnail'
    ) {}

    public function handle(): void
    {
        if (empty($this->mediaUuid)) {
            return;
        }

        // Callers pass media in mixed formats: bare UUID (tasks), full CDN URL
        // (piggy pot cover), or UUID with CDN ops (shop image). The Uploadcare
        // REST API only accepts the bare UUID — anything else 404s every poll,
        // and the fail-closed fallback then holds perfectly innocent content.
        $uuid = RekognitionModeration::uuidFrom($this->mediaUuid);

        if ($uuid === null) {
            Log::warning('CheckMediaModeration: no UUID found in media reference — flagging for manual review', [
                'model' => $this->modelClass,
                'id' => $this->modelId,
                'media' => $this->mediaUuid,
            ]);
            $this->flag();

            return;
        }

        // Rekognition's moderation labels only apply to images. A PDF, zip,
        // document or video returns nothing, which the fail-closed branch below
        // would read as "no verdict" and hold — so every non-image reward would
        // be stuck waiting for a scan that can never produce an answer. These
        // items are still created unapproved and reviewed by a human, so
        // passing here does not put them live unseen.
        $isImage = RekognitionModeration::isImage($uuid);

        if ($isImage === null) {
            Log::warning('Uploadcare file info unavailable — flagging for manual review', [
                'model' => $this->modelClass,
                'id' => $this->modelId,
            ]);
            $this->flag();

            return;
        }

        if ($isImage === false) {
            return;
        }

        // ⚠️ Waits for the scan to REPORT DONE. Reading the labels straight
        // after executing the add-on returns an empty array, which this job
        // used to accept as "scanned, nothing found" and break its poll loop on
        // the first read — so explicit images passed whenever Rekognition had
        // not finished yet.
        $labels = RekognitionModeration::labels($uuid, self::SCAN_WAIT_SECONDS);

        if ($labels === null) {
            // Fail CLOSED: no verdict means unverified, not safe.
            Log::warning('Moderation labels unavailable — flagging for manual review', [
                'model' => $this->modelClass,
                'id' => $this->modelId,
            ]);
            $this->flag();

            return;
        }

        if ($restricted = RekognitionModeration::restrictedLabel($labels)) {
            $this->flag($restricted);
        }
    }

    private function flag(string $reasonLabel = ''): void
    {
        if (empty($this->flagOnViolation)) {
            return;
        }

        try {
            $record = ($this->modelClass)::find($this->modelId);
            if (! $record) {
                return;
            }

            // ⚠️ A verdict that lands after the row was decided must not resurrect it.
            // The scan is asynchronous — Rekognition takes seconds and an admin can
            // approve or the creator can supersede in that window — and writing a flag
            // onto a closed change request would put a hold on something already live.
            if ($record instanceof ProfileChangeRequest && ! $record->isPending()) {
                return;
            }

            $attributes = $this->flagOnViolation;

            // Store a creator-facing reason on the listing itself (not just the
            // notification) so they see WHY it's held — if the table supports it.
            $reason = $this->friendlyReason($reasonLabel);
            if (Schema::hasColumn($record->getTable(), 'moderation_reason')) {
                $attributes['moderation_reason'] = $reason;
            }

            // The machine-readable half: which asset, for the review screen.
            if (Schema::hasColumn($record->getTable(), 'moderation_asset')) {
                $attributes['moderation_asset'] = $this->mediaAsset;
            }

            $record->forceFill($attributes)->save();
            Log::warning('Content held by moderation gate', [
                'model' => $this->modelClass,
                'id' => $this->modelId,
                'asset' => $this->mediaAsset,
                'label' => $reasonLabel,
            ]);

            $this->notifyCreator($record, $reason);
        } catch (\Throwable $e) {
            Log::error('Failed to flag moderated content: '.$e->getMessage());
        }
    }

    /**
     * Map a raw Rekognition label to a soft, creator-facing reason. We never show
     * the raw label (it can be wrong/embarrassing) — just the category + next step.
     */
    private function friendlyReason(string $label): string
    {
        $l = strtolower($label);
        $category = match (true) {
            str_contains($l, 'nud') || str_contains($l, 'sexual') || str_contains($l, 'porn') || str_contains($l, 'explicit') => 'possible adult or explicit content',
            str_contains($l, 'violence') || str_contains($l, 'gore') || str_contains($l, 'disturbing') => 'possible violent or graphic content',
            str_contains($l, 'hate') => 'possible hateful content or symbols',
            default => 'content that may not meet our guidelines',
        };

        $asset = self::ASSET_LABELS[$this->mediaAsset] ?? 'image';

        return "Held by our automated check on your {$asset} ({$category}). Replace that {$asset} to make it live, or contact support if you think this is a mistake.";
    }

    /** Tell the creator their content is held and how to fix it. */
    private function notifyCreator($record, string $reason = ''): void
    {
        try {
            // Profile media is scanned on the User row itself, which has neither
            // user_id nor creator_id — without this the creator whose avatar was
            // held would never be told.
            $creator = $record instanceof User
                ? $record
                : (($creatorId = $record->user_id ?? $record->creator_id ?? null) ? User::find($creatorId) : null);

            if (! $creator) {
                return;
            }

            // ⚠️ An unmapped class falls back to the literal word "item", so a held
            // profile photo told the creator "your item is held" — which names nothing
            // they can go and fix. A media scan already knows which asset it looked at.
            $label = self::FEATURE_LABELS[class_basename($this->modelClass)]
                ?? self::ASSET_LABELS[$this->mediaAsset]
                ?? 'item';
            $title = $record->title ?? $record->name ?? '';
            $why = $reason !== '' ? $reason : 'Edit it and upload a different image to make it live, or contact support if you think this is a mistake.';

            ModerationNotice::send($creator, $label, (string) $title, $why);
        } catch (\Throwable $e) {
            // A notification failure must not break the moderation hold itself.
            Log::warning('Moderation notify failed: '.$e->getMessage());
        }
    }
}

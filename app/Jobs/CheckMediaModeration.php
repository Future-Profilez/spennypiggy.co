<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Rekognition label words that trigger a moderation hold. */
    private const REST_WORDS = [
        'Adult', '18+', 'Pornographic', 'xxx', 'nsfw', 'NSFW', 'XXX', 'Blood',
        'Brutality', 'Explicit', 'Mature', 'Weapons', 'Aggression', 'Combat',
        'Sexual', 'Porn', 'Fucking', 'Graphic',
    ];

    /**
     * @param class-string $modelClass  Eloquent model to flag on violation.
     * @param int|string   $modelId     Primary key of the record.
     * @param string|null  $mediaUuid   Uploadcare file UUID to scan.
     * @param array        $flagOnViolation  Attributes to set when content is rejected (e.g. ['status' => 'moderation_hold']).
     */
    public function __construct(
        public string $modelClass,
        public $modelId,
        public ?string $mediaUuid,
        public array $flagOnViolation = []
    ) {
    }

    public function handle(): void
    {
        if (empty($this->mediaUuid)) {
            return;
        }

        $headers = [
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . config('services.uploadcare.public') . ':' . config('services.uploadcare.secret'),
        ];

        // Kick off the Rekognition add-on. Processing is asynchronous, so the
        // moderation labels are not available on the immediate read — poll the
        // file's appdata until they appear (or we give up after a few tries).
        Http::withHeaders($headers + ['Content-Type' => 'application/json'])
            ->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
                'target' => $this->mediaUuid,
            ]);

        $tags = null;
        for ($attempt = 0; $attempt < 5; $attempt++) {
            sleep(3);

            $response = Http::withHeaders($headers)
                ->get("https://api.uploadcare.com/files/" . $this->mediaUuid . "/?include=appdata");

            if (!$response->successful()) {
                Log::error('Uploadcare moderation check failed', [
                    'model' => $this->modelClass,
                    'id' => $this->modelId,
                    'status' => $response->status(),
                ]);
                continue;
            }

            $labels = $response->json('appdata.aws_rekognition_detect_moderation_labels.data.ModerationLabels');
            if (is_array($labels)) {
                $tags = $labels;
                break;
            }
        }

        if (!is_array($tags)) {
            // Fail CLOSED: if we never got a verdict (API error / Rekognition timeout),
            // flag the content for manual review rather than leaving monetised content
            // live unscanned.
            Log::warning('Moderation labels unavailable after polling — flagging for manual review', [
                'model' => $this->modelClass,
                'id' => $this->modelId,
            ]);
            $this->flag();
            return;
        }

        // Any moderation label that matches a restricted word holds the content.
        // Match case-insensitively against the full label name (labels can be
        // multi-word, e.g. "Explicit Nudity", "Graphic Violence").
        foreach ($tags as $tag) {
            $label = $tag['Name'] ?? '';
            foreach (self::REST_WORDS as $word) {
                if (stripos($label, $word) !== false) {
                    $this->flag();
                    return;
                }
            }
        }
    }

    private function flag(): void
    {
        if (empty($this->flagOnViolation)) {
            return;
        }

        try {
            $record = ($this->modelClass)::find($this->modelId);
            if ($record) {
                $record->forceFill($this->flagOnViolation)->save();
                Log::warning('Content held by moderation gate', [
                    'model' => $this->modelClass,
                    'id' => $this->modelId,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to flag moderated content: ' . $e->getMessage());
        }
    }
}

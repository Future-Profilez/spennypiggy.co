<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The one place that talks to Uploadcare's AWS Rekognition moderation add-on.
 *
 * ⚠️ THE BUG THIS EXISTS TO KILL: the add-on is asynchronous. `execute` returns a
 * `request_id` immediately, and from that moment the file's appdata contains
 *
 *     "ModerationLabels": []
 *
 * — an EMPTY ARRAY that means "not finished", and is byte-for-byte identical to
 * the result for a perfectly clean image. Both callers used to read that array
 * straight after executing and conclude the image was safe, so an explicit
 * upload passed whenever the read beat Rekognition to it — which is almost
 * always, because the read is the very next HTTP call.
 *
 * The add-on exposes a status endpoint keyed on the request id. Polling THAT is
 * the only way to tell "clean" from "still thinking", so every scan goes
 * through here and an unfinished scan is reported as `null`, never as "clean".
 *
 * Callers decide what null means for them: the queued job holds the content for
 * manual review (fail closed), the upload-time check lets it through (it is
 * fast feedback, and the job is the authority behind it).
 */
class RekognitionModeration
{
    private const ADDON = 'aws_rekognition_detect_moderation_labels';

    private const BASE = 'https://api.uploadcare.com';

    /** Rekognition labels that hold content, and the confidence they need. */
    public const REST_WORDS = [
        'Nudity', 'Sexual', 'Porn', 'Explicit', 'Gore', 'Graphic Violence',
        'Visually Disturbing', 'Hate Symbol', 'Self-Injury', 'Self Injury',
    ];

    public const MIN_CONFIDENCE = 80.0;

    /**
     * Run the scan and return its labels once it has genuinely finished.
     *
     * @param  int  $maxWaitSeconds  How long to wait for a verdict before giving up.
     * @return array|null The labels (possibly an empty array — that now honestly
     *                    means "scanned, nothing found"), or null when the scan
     *                    did not complete or could not be run.
     */
    public static function labels(string $uuid, int $maxWaitSeconds = 15): ?array
    {
        $headers = self::headers();

        $execute = Http::withHeaders($headers + ['Content-Type' => 'application/json'])
            ->post(self::BASE.'/addons/'.self::ADDON.'/execute/', ['target' => $uuid]);

        if (! $execute->successful()) {
            Log::warning('Rekognition execute failed', ['uuid' => $uuid, 'status' => $execute->status()]);

            return null;
        }

        $requestId = $execute->json('request_id');

        if (! $requestId) {
            return null;
        }

        // One second between polls: a finished scan usually answers on the first
        // or second, and this is on the request path for the upload check.
        for ($waited = 0; $waited < $maxWaitSeconds; $waited++) {
            $status = Http::withHeaders($headers)
                ->get(self::BASE.'/addons/'.self::ADDON.'/execute/status/', ['request_id' => $requestId]);

            $state = (string) ($status->json('status') ?? '');

            if ($state === 'done') {
                return self::readLabels($uuid);
            }

            if ($state === 'error' || $state === 'unknown') {
                Log::warning('Rekognition scan did not complete', [
                    'uuid' => $uuid, 'state' => $state,
                ]);

                return null;
            }

            sleep(1);
        }

        Log::warning('Rekognition scan still running after wait', [
            'uuid' => $uuid, 'waited' => $maxWaitSeconds,
        ]);

        return null;
    }

    /**
     * The first label that should hold this content, or null when none does.
     *
     * Substring matching, because Rekognition returns multi-word labels
     * ("Explicit Nudity", "Non-Explicit Nudity of Intimate parts and Kissing")
     * whose individual words are not themselves in the list. Anything below
     * MIN_CONFIDENCE is a guess, not a finding.
     */
    public static function restrictedLabel(array $labels): ?string
    {
        foreach ($labels as $label) {
            $name = (string) ($label['Name'] ?? '');

            if ((float) ($label['Confidence'] ?? 0) < self::MIN_CONFIDENCE) {
                continue;
            }

            foreach (self::REST_WORDS as $word) {
                if (stripos($name, $word) !== false) {
                    return $name;
                }
            }
        }

        return null;
    }

    /** Is this file an image? null when it could not be read at all. */
    public static function isImage(string $uuid): ?bool
    {
        $response = Http::withHeaders(self::headers())->get(self::BASE.'/files/'.$uuid.'/');

        if (! $response->successful()) {
            return null;
        }

        $isImage = $response->json('is_image');

        if (is_bool($isImage)) {
            return $isImage;
        }

        $mime = (string) ($response->json('mime_type') ?? '');

        return $mime !== '' ? str_starts_with(strtolower($mime), 'image/') : null;
    }

    /** The bare UUID inside a reference stored as a URL, a UUID, or a UUID with CDN operations. */
    public static function uuidFrom(?string $reference): ?string
    {
        if (empty($reference)) {
            return null;
        }

        return preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i', $reference, $m)
            ? strtolower($m[0])
            : null;
    }

    private static function readLabels(string $uuid): ?array
    {
        $response = Http::withHeaders(self::headers())
            ->get(self::BASE.'/files/'.$uuid.'/?include=appdata');

        $labels = $response->json('appdata.'.self::ADDON.'.data.ModerationLabels');

        return is_array($labels) ? $labels : null;
    }

    private static function headers(): array
    {
        return [
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple '.config('services.uploadcare.public').':'.config('services.uploadcare.secret'),
        ];
    }
}

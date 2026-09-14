<?php

namespace App\Support;

use App\Jobs\CheckMediaModeration;
use App\Models\Post;
use Illuminate\Support\Facades\Log;

/**
 * The automated checks on a post — the half that had to exist before posts could publish
 * themselves.
 *
 * 🚨 A POST'S PICTURES WERE NEVER SCANNED. The TEXT has always been screened — both post
 * paths call `ModerationService::classify`, which refuses a banned term outright with a 422
 * (a refusal at save, which is better than publish-then-retract and is left exactly as it
 * is). But `classifyMedia()` is a STUB that passes everything, and its own comment says so:
 * *"flagged media is caught only by manual moderation"*. Manual moderation is the thing the
 * client's plan removes, so from 11 Sep 2026 a post's images go through `CheckMediaModeration`
 * — the Rekognition path every other module already used — and that scan is what can now pull
 * a published post back.
 *
 * ⚠️ Publish-then-check: `ListingPublication::publish()` runs first and this retracts. The
 * scan is queued, so it **needs `queue:work`** — with no worker a post with a bad image
 * stays up, which is exactly the state every post on this platform was already in.
 */
final class PostModeration
{
    /**
     * Screen a post the creator has just saved.
     *
     * @param  array  $previousMedia  Every media reference the post carried BEFORE this
     *                                save. Pass it on an edit so an unchanged picture is
     *                                not re-scanned — Rekognition is deterministic, and a
     *                                re-scan re-produces a false positive on a post an
     *                                admin already cleared.
     *
     * 🚨 NEVER THROWS. It runs inside the creator's own save; a moderation failure must
     * not turn a saved post into a 500. A failure leaves the post published and unscanned,
     * which is the state every post on this platform was in before today.
     */
    public static function screen(?Post $post, array $previousMedia = []): void
    {
        if (! $post) {
            return;
        }

        try {
            $held = ListingPublication::heldAttributes($post);

            /* ⚠️ NO TEXT CHECK HERE, DELIBERATELY. `ModerationService::classify` already
               refused a banned term with a 422 before this post was ever saved, so a
               second screen would either never fire or would hold a post for wording the
               controller had already accepted. */
            foreach (self::newImages($post, $previousMedia) as $reference) {
                CheckMediaModeration::dispatch(
                    Post::class,
                    $post->getKey(),
                    $reference,
                    $held,
                    'thumbnail'
                );
            }
        } catch (\Throwable $e) {
            Log::error('Post moderation failed: '.$e->getMessage(), [
                'post' => $post->getKey(),
            ]);
        }
    }

    /**
     * Every image on the post that this save introduced.
     *
     * ⚠️ A post's `media` is an ARRAY — the one module where a single save can attach
     * several pictures, so a single scan per post would leave every image after the first
     * unchecked. `image` is the legacy single field and is scanned alongside it.
     */
    public static function newImages(Post $post, array $previousMedia = []): array
    {
        $current = array_merge(
            [$post->getAttribute('image')],
            self::references($post->getAttribute('media'))
        );

        $seen = self::references($previousMedia);

        return array_values(array_filter(
            array_unique(array_map(
                fn ($value) => is_string($value) ? trim($value) : '',
                $current
            )),
            fn ($value) => $value !== '' && ! in_array($value, $seen, true)
        ));
    }

    /**
     * The uuid/url out of whatever shape `media` is holding.
     *
     * ⚠️ Entries are objects written by the uploader (`{uuid, url, …}`) on the current
     * path and bare strings on older rows. Reading only one shape scans half the library.
     */
    private static function references(mixed $media): array
    {
        if (is_string($media)) {
            $decoded = json_decode($media, true);
            $media = is_array($decoded) ? $decoded : [$media];
        }

        if (! is_array($media)) {
            return [];
        }

        $out = [];

        foreach ($media as $entry) {
            $value = is_array($entry)
                ? ($entry['uuid'] ?? $entry['url'] ?? null)
                : $entry;

            if (is_string($value) && trim($value) !== '') {
                $out[] = trim($value);
            }
        }

        return $out;
    }
}

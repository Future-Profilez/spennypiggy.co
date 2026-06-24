<?php

namespace App\Jobs;

use App\Models\VideoPoster;
use App\Uploadcare;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Generate a poster thumbnail for a source video via the Uploadcare
 * conversion API, asynchronously, and cache the result in video_posters.
 *
 * Flow (re-queued between steps so a request never blocks on Uploadcare):
 *   1. no token  -> request conversion, store token, status=processing
 *   2. has token -> poll status; success -> store poster_uuid, status=ready
 *                   still running -> re-dispatch with a delay
 *   3. give up after MAX_POLLS -> status=failed (frontend stays on avatar)
 */
class GenerateVideoPoster implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Max poll re-dispatches before giving up. */
    private const MAX_POLLS = 6;

    public function __construct(public string $sourceUuid)
    {
    }

    public function handle(): void
    {
        $row = VideoPoster::firstOrCreate(
            ['source_uuid' => $this->sourceUuid],
            ['status' => 'pending']
        );

        if ($row->status === 'ready' || $row->status === 'failed') {
            return;
        }

        // Step 1: kick off conversion if we have no job token yet.
        // The `thumbs` op returns the thumbnails-group UUID upfront; the poll
        // below only confirms the conversion finished. Poster = {group}/nth/0/.
        if (empty($row->poster_token)) {
            $res = Uploadcare::generatePoster($this->sourceUuid);
            $entry = $res['result']['result'][0] ?? null;
            $token = $entry['token'] ?? null;
            $group = $entry['thumbnails_group_uuid'] ?? ($entry['uuid'] ?? null);

            if (!$res['status'] || empty($token) || empty($group)) {
                $row->update(['status' => 'failed']);
                Log::warning("GenerateVideoPoster: conversion request failed for {$this->sourceUuid}", [
                    'code' => $res['code'] ?? null,
                ]);
                return;
            }

            $row->update([
                'poster_token' => $token,
                'poster_uuid'  => $group,
                'status'       => 'processing',
            ]);
            self::dispatch($this->sourceUuid)->delay(now()->addSeconds(15));
            return;
        }

        // Step 2: poll conversion status (accepts every documented terminal value).
        try {
            $req = Http::timeout(5)
                ->accept('application/vnd.uploadcare-v0.7+json')
                ->contentType('application/json')
                ->withHeaders([
                    'Authorization' => 'Uploadcare.Simple ' . config('services.uploadcare.public') . ':' . config('services.uploadcare.secret'),
                ])
                ->get(config('services.uploadcare.host', 'https://api.uploadcare.com/') . "convert/video/status/{$row->poster_token}/");

            if ($req->successful()) {
                $res = $req->json();
                $status = $res['status'] ?? null;

                if (in_array($status, ['finished', 'success'], true)) {
                    // Only ready if we actually hold a poster UUID, else fail.
                    $row->update(['status' => empty($row->poster_uuid) ? 'failed' : 'ready']);
                    return;
                }

                if (in_array($status, ['failed', 'canceled', 'error'], true)) {
                    $row->update(['status' => 'failed']);
                    return;
                }
            }
        } catch (\Exception $e) {
            Log::warning("GenerateVideoPoster: status poll failed for {$this->sourceUuid}: " . $e->getMessage());
        }

        // Still processing — re-dispatch until we hit the cap.
        $row->increment('attempts');
        if ($row->attempts >= self::MAX_POLLS) {
            $row->update(['status' => 'failed']);
            return;
        }
        self::dispatch($this->sourceUuid)->delay(now()->addSeconds(20));
    }
}

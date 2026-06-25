<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateVideoPoster;
use App\Models\VideoPoster;
use Illuminate\Http\Request;

/**
 * Lazy poster resolver for videos.
 *
 * The frontend sends the source video UUID(s); we return any cached poster URL
 * (Uploadcare thumbnail) and kick off generation for misses. Decoupled from the
 * upload paths so it covers existing videos too. Until a poster is ready the
 * frontend falls back to the creator avatar.
 */
class VideoPosterController extends Controller
{
    public function resolve(Request $request)
    {
        $data = $request->validate([
            'uuids'   => 'required|array|max:50',
            'uuids.*' => 'string|uuid',
        ]);

        $uuids = array_values(array_unique($data['uuids']));

        $existing = VideoPoster::whereIn('source_uuid', $uuids)->get()->keyBy('source_uuid');

        $posters = [];
        foreach ($uuids as $uuid) {
            $row = $existing->get($uuid);

            if (!$row) {
                // First time we've seen this video — start generation.
                // firstOrCreate avoids a unique-constraint 500 when concurrent
                // requests race on the same new UUID.
                $row = VideoPoster::firstOrCreate(
                    ['source_uuid' => $uuid],
                    ['status' => 'pending']
                );
                if ($row->wasRecentlyCreated) {
                    GenerateVideoPoster::dispatch($uuid);
                }
            }

            $posters[$uuid] = $row->url(); // null unless ready
        }

        return response()->json(['posters' => $posters]);
    }
}

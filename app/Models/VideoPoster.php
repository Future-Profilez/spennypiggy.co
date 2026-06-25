<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Cached Uploadcare video -> poster thumbnail.
 *
 * status: pending (just created) | processing (conversion dispatched)
 *         | ready (poster_uuid set) | failed (gave up).
 */
class VideoPoster extends Model
{
    protected $fillable = [
        'source_uuid',
        'poster_uuid',
        'poster_token',
        'status',
        'attempts',
    ];

    /** CDN URL of the generated poster, or null when not ready. */
    public function url(): ?string
    {
        if ($this->status !== 'ready' || empty($this->poster_uuid)) {
            return null;
        }

        $cdn = config('services.uploadcare.cdn', 'https://ucarecdn.com/');

        return rtrim($cdn, '/') . '/' . $this->poster_uuid . '/nth/0/';
    }
}

<?php

namespace App\Models;

use App\Uploadcare;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserIntro extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'poster',
        'height',
        'width',
        'approved',
    ];

    protected $appends = [
        'perma_link',
        'poster_url',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (! empty($this->uuid)) {
            $url = config('services.uploadcare.cdn', 'https://ucarecdn.com/').$this->uuid.'/';
        }

        return $url;
    }

    /**
     * Non-blocking poster URL for list rendering (discovery, search, homepage).
     *
     * The full `poster_url` accessor makes a synchronous Uploadcare HTTP call (up to 3s)
     * per row, which is fine for a single profile but catastrophic in a list of creators.
     * When a poster already exists, `{poster}/nth/0/` is the exact thumbnail URL the slow
     * accessor produces anyway — the HTTP round trip only swaps the stored uuid without
     * changing the rendered image. When no poster exists yet, we warm it on the queue and
     * return null this render; the frontend already falls back to the creator avatar when
     * poster_url is null/false.
     */
    public function posterUrlNonBlocking(): ?string
    {
        $cdn = config('services.uploadcare.cdn', 'https://ucarecdn.com/');

        if (! empty($this->poster)) {
            return $cdn.$this->poster.'/nth/0/';
        }

        if (! empty($this->uuid)) {
            // Generate off the web request; harmless no-op if already warmed.
            $id = $this->id;
            dispatch(function () use ($id) {
                $intro = static::find($id);
                if ($intro && empty($intro->poster)) {
                    $intro->poster_url; // triggers generation + save inside the worker
                }
            })->afterResponse();
        }

        return null;
    }

    public function getPosterUrlAttribute()
    {
        $url = null;
        if (! empty($this->poster) && ! empty($this->poster_token)) {
            try {
                // Use a short timeout to prevent blocking the request for too long
                $req = Http::timeout(3)
                    ->accept('application/vnd.uploadcare-v0.7+json')
                    ->contentType('application/json')
                    ->withHeaders([
                        'Authorization' => 'Uploadcare.Simple '.config('services.uploadcare.public').':'.config('services.uploadcare.secret'),
                    ])
                    ->get(config('services.uploadcare.host', 'https://api.uploadcare.com/')."convert/video/status/$this->poster_token/");

                if ($req->successful()) {
                    $res = json_decode($req->body());
                    if ($res->status == 'success') {
                        $url = config('services.uploadcare.cdn', 'https://ucarecdn.com/').$res->result->uuid.'/nth/0/';

                        // Update the model to store the final URL and clear the token
                        // This prevents future network calls for this video
                        $this->poster = $res->result->uuid;
                        $this->poster_token = null;
                        $this->save();
                    } else {
                        // Fallback to the original UUID if still processing
                        $url = config('services.uploadcare.cdn', 'https://ucarecdn.com/').$this->uuid.'/';
                    }
                } else {
                    $url = config('services.uploadcare.cdn', 'https://ucarecdn.com/').$this->uuid.'/';
                }
            } catch (\Exception $e) {
                Log::warning("Uploadcare status check failed for UserIntro {$this->id}: ".$e->getMessage());
                $url = config('services.uploadcare.cdn', 'https://ucarecdn.com/').$this->uuid.'/';
            }
        } elseif (empty($this->poster)) {
            $uuid = Uploadcare::generateThumb($this->uuid, $this->duration);

            /*
             * 🚨 GUARD THE SHAPE — THIS BRANCH HAS NO try/catch AROUND IT.
             *
             * `generateThumb` returns whatever Uploadcare answered. An error
             * envelope (a rejected key, a rate limit, a file it will not
             * convert) is a non-empty array with no `result` key, so
             * `! empty($uuid)` passed and the very next line threw "Undefined
             * array key" — a 500 on a PUBLIC PROFILE, because that is where the
             * accessor is read. A missing poster must degrade to no poster, not
             * take the creator's page down.
             */
            $thumb = $uuid['result']['result'][0] ?? null;

            if (is_array($thumb) && ! empty($thumb['thumbnails_group_uuid'])) {
                $this->poster = $thumb['thumbnails_group_uuid'];
                $this->poster_token = $thumb['token'] ?? null;

                $this->save();
                // $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(config('services.uploadcare.secret'), 300));
                // $config = Configuration::create(config('services.uploadcare.public'), config('services.uploadcare.secret'))->setAuthUrlConfig($authUrlConfig);
                // $api = new Api($config);
                // $api->file()->deleteFile($uuid['result']['result'][0]['uuid']);
                // $api->file()->deleteFile($uuid['result']['result'][1]['thumbnails_group_uuid']);

                $url = config('services.uploadcare.cdn', 'https://ucarecdn.com/').$this->poster.'/nth/0/';
            } else {
                if (! empty($uuid)) {
                    Log::warning("Uploadcare returned no thumbnail for UserIntro {$this->id}", [
                        'keys' => array_keys((array) $uuid),
                    ]);
                }

                $url = false;
            }
        } else {
            /*
             * 🚨 POSTER KNOWN, NOTHING LEFT TO POLL — SERVE IT.
             *
             * This branch is reached when `poster` is set and `poster_token` is
             * not, which is EXACTLY the state the successful conversion above
             * leaves behind: it stores the poster and clears the token on
             * purpose ("prevents future network calls for this video"). So every
             * intro whose thumbnail finished converting returned `false` on the
             * very next read — the poster was fetched, stored, and then never
             * shown again. The token is only ever used to poll the conversion
             * status API; the CDN URL does not need it.
             */
            $url = ! empty($this->poster)
                ? config('services.uploadcare.cdn', 'https://ucarecdn.com/').$this->poster.'/nth/0/'
                : false;
        }

        return $url;
    }
}

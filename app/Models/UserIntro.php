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
        'poster_url'
    ];


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->uuid)) {
            $url = config("services.uploadcare.cdn", "https://ucarecdn.com/") . $this->uuid . '/';
        }
        return $url;
    }

    public function getPosterUrlAttribute()
    {
        $url = null;
        if (!empty($this->poster) && !empty($this->poster_token)) {
            try {
                // Use a short timeout to prevent blocking the request for too long
                $req = Http::timeout(3)
                    ->accept('application/vnd.uploadcare-v0.7+json')
                    ->contentType('application/json')
                    ->withHeaders([
                        'Authorization' => "Uploadcare.Simple " . config("services.uploadcare.public") . ":" . config('services.uploadcare.secret')
                    ])
                    ->get(config("services.uploadcare.host", "https://api.uploadcare.com/") . "convert/video/status/$this->poster_token/");

                if ($req->successful()) {
                    $res = json_decode($req->body());
                    if ($res->status == "success") {
                        $url = config("services.uploadcare.cdn", "https://ucarecdn.com/") . $res->result->uuid . "/nth/0/";
                        
                        // Update the model to store the final URL and clear the token
                        // This prevents future network calls for this video
                        $this->poster = $res->result->uuid;
                        $this->poster_token = null;
                        $this->save();
                    } else {
                        // Fallback to the original UUID if still processing
                        $url = config("services.uploadcare.cdn", "https://ucarecdn.com/") . $this->uuid . "/";
                    }
                } else {
                    $url = config("services.uploadcare.cdn", "https://ucarecdn.com/") . $this->uuid . "/";
                }
            } catch (\Exception $e) {
                Log::warning("Uploadcare status check failed for UserIntro {$this->id}: " . $e->getMessage());
                $url = config("services.uploadcare.cdn", "https://ucarecdn.com/") . $this->uuid . "/";
            }
        } elseif (empty($this->poster)) {
            $uuid = Uploadcare::generateThumb($this->uuid, $this->duration);

            if (!empty($uuid)) {
                $this->poster = $uuid['result']['result'][0]['thumbnails_group_uuid'];
                $this->poster_token = $uuid['result']['result'][0]['token'];

                $this->save();
                // $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(config('services.uploadcare.secret'), 300));
                // $config = Configuration::create(config('services.uploadcare.public'), config('services.uploadcare.secret'))->setAuthUrlConfig($authUrlConfig);
                // $api = new Api($config);
                // $api->file()->deleteFile($uuid['result']['result'][0]['uuid']);
                // $api->file()->deleteFile($uuid['result']['result'][1]['thumbnails_group_uuid']);

                $url = config("services.uploadcare.cdn", "https://ucarecdn.com/") . $this->poster . "/nth/0/";
            } else {
                $url = false;
            }
        } else {
            $url = false;
        }
        return $url;
    }
}

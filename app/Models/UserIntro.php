<?php

namespace App\Models;

use App\Uploadcare;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Http;
use App\Traits\InvalidatesUserCache;

class UserIntro extends Model
{
    use HasFactory, SoftDeletes, InvalidatesUserCache;

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
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0)->where('is_uk', 0);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->uuid)) {
            $url = env("UPLOADCARE_CDN") . $this->uuid . '/';
        }
        return $url;
    }

    public function getPosterUrlAttribute()
    {
        $url = null;
        if (!empty($this->poster) && !empty($this->poster_token)) {
            $req = Http::accept('application/vnd.uploadcare-v0.7+json')
                ->contentType('application/json')
                ->withHeaders([
                    'Authorization' => "Uploadcare.Simple " . env("UPLOADCARE_PUBLIC_KEY") . ":" . env('UPLOADCARE_SECRET_KEY')
                ])
                ->get(env("UPLOADCARE_HOST") . "convert/video/status/$this->poster_token/");

            if ($req->successful()) {
                $request = $req->json();

                // echo $request['status'];
                // die;

                if ($request['status'] == 'processing') {
                    $url = false;
                } elseif ($request['status'] == 'finished') {
                    $url = env("UPLOADCARE_CDN") . $this->poster . "/nth/0/";
                }
            } else {
                $url = false;
            }
        } elseif (empty($this->poster)) {
            $uuid = Uploadcare::generateThumb($this->uuid, $this->duration);

            if (!empty($uuid)) {
                $this->poster = $uuid['result']['result'][0]['thumbnails_group_uuid'];
                $this->poster_token = $uuid['result']['result'][0]['token'];

                $this->save();
                // $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(env('UPLOADCARE_SECRET_KEY'), 300));
                // $config = Configuration::create(env('UPLOADCARE_PUBLIC_KEY'), env('UPLOADCARE_SECRET_KEY'))->setAuthUrlConfig($authUrlConfig);
                // $api = new Api($config);
                // $api->file()->deleteFile($uuid['result']['result'][0]['uuid']);
                // $api->file()->deleteFile($uuid['result']['result'][1]['thumbnails_group_uuid']);

                $url = env("UPLOADCARE_CDN") . $this->poster . "/nth/0/";
            } else {
                $url = false;
            }
        } else {
            $url = false;
        }
        return $url;
    }
}

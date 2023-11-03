<?php

namespace App\Models;

use App\Uploadcare;
use App\WatermarkHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class WishItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        "user_id",
        "stripe_product_id",
        "wishname",
        "price",
        "item_url",
        "thumbnail",
        "subscription",
        "subscription_period",
        "repeat_purchase",
        "category",
    ];

    protected $appends = [ 
        "perma_link"
    ];

    public static function boot(){
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }

    protected $hidden = [
        "id",
        "user_id",
        "created_at",
        "deleted_at"
    ];


    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }


    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->thumbnail)) {
                    $api = Uploadcare::getApiObj()->file();
                    $info = $api->fileInfo($this->thumbnail)->getContentInfo();
                    $width = $info->getImage()->getWidth();
                    $height = $info->getImage()->getHeight();

                $watermark = WatermarkHelper::getWatermarkImage($width, $height);
                $check = "";
                    $wm = "spennypiggy.co~s" . $this->user->username;
                    $textWm = WatermarkHelper::addUcTextWatermark($width, $height);
                    $wm = urlencode($wm);
                    $fontsize = $textWm['fontsize'];
                    $check = "-/preview/-/text_align/left/center/-/font/$fontsize/fff/-/text/80px8p/8p,100p/$wm/";
                $url = Uploadcare::getUrl($this->thumbnail, $this->type, $watermark, $check);
            
        }
        return $url;
    }
}

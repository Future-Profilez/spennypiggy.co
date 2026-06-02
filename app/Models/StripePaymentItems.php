<?php

namespace App\Models;

use App\Helpers;
use App\Uploadcare;
use App\WatermarkHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class StripePaymentItems extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'uuid',
        'stripe_payment_detail_id',
        'wish_item_id',
        'user_cart_id',
        'amount',
        'total_paid',
        'message_media',
        'media_type',
        'thank_you_approved',
        'tax',
        'vat_amount',
        'deleted_at',
        'quantity',
        'twitter_response',
        'anonymous',
        'message'
    ];

    protected $appends = [
        'sender',
        'message_url',
    ];

    protected $hidden   =   [
        // 'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function payment()
    {
        return $this->belongsTo(StripePaymentDetail::class, 'stripe_payment_detail_id');
    }

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_item_id')->withTrashed();
    }

    public function cart()
    {
        return $this->belongsTo(UserCart::class, 'user_cart_id');
    }

    public function getSenderAttribute()
    {
        $sender = false;
        if (Auth::check()) {
            $sender = $this->payment->owner_id == Auth::id() ? false : true;
        }
        return $sender;
    }

    public function getMessageUrlAttribute()
    {
        $url = false;
        if (!empty($this->message_media)) {

            // if ($this->media_type == 'image') {
            //     $api = Uploadcare::getApiObj()->file();
            //     $info = $api->fileInfo($this->message_media)->getContentInfo();
            //     $width = $info->getImage()->getWidth();
            //     $height = $info->getImage()->getHeight();

            //     $watermark = WatermarkHelper::getWatermarkImage($width, $height);
            //     $check = "";
            //     $wm = "spennypiggy.co~s" . $this->username;
            //     $textWm = WatermarkHelper::addUcTextWatermark($width, $height);
            //     $wm = urlencode($wm);
            //     $fontsize = $textWm['fontsize'];
            //     $check = "-/preview/-/text_align/left/center/-/font/$fontsize/fff/-/text/80px8p/8p,100p/$wm/";
            //     $url = Uploadcare::getUrl($this->message_media, $this->media_type, $watermark, $check);
            // } else {
            //     $url = Uploadcare::getUrl($this->message_media, $this->media_type, false, false);
            // }

            $url =  'https://ucarecdn.com/' . $this->message_media . '/';
        }

        return $url;
    }
}

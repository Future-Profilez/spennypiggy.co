<?php

namespace App\Models;

use App\Uploadcare;
use App\WatermarkHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class WishItem extends Model
{
    use HasFactory, SoftDeletes;
    protected $dates = ['deleted_at'];

    protected $fillable = [
        "user_id",
        "stripe_product_id",
        "wishname",
        "price",
        "currency",
        'price_id',
        "item_url",
        "thumbnail",
        "subscription",
        "subscription_period",
        "repeat_purchase",
        "category",
        'is_pin',
        "fullfill_amount",
        'tax_amount',
        'delete_reason',
        'deleted_at'
    ];

    protected $appends = [
        "perma_link",
        'is_cart'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    protected $hidden = [
        'stripe_product_id',
        'thumbnail',
        'category',
        'is_pin',
        "created_at",
        "updated_at",
        "deleted_at"
    ];


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }


    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->thumbnail)) {
            // $api = Uploadcare::getApiObj()->file();
            // $info = $api->fileInfo($this->thumbnail)->getContentInfo();
            // $width = $info->getImage()->getWidth();
            // $height = $info->getImage()->getHeight();

            // $watermark = WatermarkHelper::getWatermarkImage($width, $height);
            // $check = "";
            // $wm = "spennypiggy.co~s" . $this->user->username;
            // $textWm = WatermarkHelper::addUcTextWatermark($width, $height);
            // $wm = urlencode($wm);
            // $fontsize = $textWm['fontsize'];
            // $check = "-/preview/-/text_align/left/center/-/font/$fontsize/fff/-/text/80px8p/8p,100p/$wm/";
            // $url = Uploadcare::getUrl($this->thumbnail, $this->type, $watermark, $check);
            $url = "https://ucarecdn.com/" . $this->thumbnail . "/";
        } else {
            $url = "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/";
        }

        return $url;
    }
    public function categories()
    {
        return $this->hasMany(WishCategory::class, 'wish_item_id');
    }

    public function wishCategories()
    {
        return $this->hasMany(WishCategory::class);
    }

    public function getIsCartAttribute()
    {
        $is_cart = false;
        if (Auth::check()) {
            $cart = UserCart::where('user_id', Auth::id())->where('wish_item_id', $this->id)->where('status', 1)->first();

            if ($cart) {
                $is_cart = true;
            }
        }

        return $is_cart;
    }

    public function wishItemsSubscription()
    {
        return $this->hasMany(WishItemSubscription::class, 'wish_item_id');
    }
}

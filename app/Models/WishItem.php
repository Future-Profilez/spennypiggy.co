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
        'reward',
        "subscription",
        "subscription_period",
        "repeat_purchase",
        "category",
        'is_pin',
        "fullfill_amount",
        'tax_amount',
        "twitter_response",
        'delete_reason',
        'edited_reason',
        'edited_status',
        'deleted_at',
        'is_approved'
    ];

    protected $appends = [
        "perma_link",
        'is_cart',
        'reward_url',
        'real_category'
    ];

    protected $casts = [
        "twitter_response" => "array",
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    protected $hidden = [
        'thumbnail',
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
            $url = "https://ucarecdn.com/" . $this->thumbnail . "/-/format/jpeg/";
        } else {
            $url = "https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/";
        }

        return $url;
    }

    public function getRewardUrlAttribute()
    {
        $url = false;
        if (!empty($this->reward)) {
            $url = "https://ucarecdn.com/" . $this->reward . "/-/format/jpeg/";
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

    public function getRealCategoryAttribute()
    {
        $arr = [];
        foreach ($this->wishCategories as $category) {
            $arr[] = $category->category;
        }

        return $arr;
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

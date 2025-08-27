<?php

namespace App\Models;

use App\Traits\CacheableModel;
use App\Uploadcare;
use App\WatermarkHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class WishItem extends Model
{
    use HasFactory, SoftDeletes, CacheableModel;
    protected $dates = ['deleted_at'];

    protected $fillable = [
        "user_id",
        "stripe_product_id",
        "wishname",
        // Deprecated monetary fields - use supporterCount and social metrics instead
        "price",
        "currency",
        "fullfill_amount",
        'tax_amount',
        'price_id',
        "item_url",
        "thumbnail",
        'reward',
        'ai_generated',
        "subscription",
        "subscription_period",
        "repeat_purchase",
        "category",
        'is_pin',
        "twitter_response",
        'delete_reason',
        'edited_reason',
        'edited_status',
        'deleted_at',
        'is_approved',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status'
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
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
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
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0)->where('is_uk', 0);
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

    // ───────────────────────
    // Performance Optimizations
    // ───────────────────────

    /**
     * Define common relationships for eager loading
     */
    protected function getCommonRelations(): array
    {
        return [
            'user' => function ($query) {
                $query->select('id', 'username', 'name', 'avatar', 'bio');
            },
            'wishCategories.category'
        ];
    }

    /**
     * Define optimized columns for queries
     */
    protected function getOptimizedColumns(): array
    {
        return [
            'id', 'uuid', 'user_id', 'wishname', 'thumbnail', 'reward',
            'subscription', 'is_pin', 'supporter_count', 'trending_status', 'created_at'
        ];
    }

    /**
     * Scope for trending wish items
     */
    public function scopeTrending($query, int $limit = 20)
    {
        return $query
            ->where('is_approved', true)
            ->where('trending_status', 'hot')
            ->orderByDesc('rising_score')
            ->orderByDesc('supporter_count')
            ->limit($limit);
    }

    /**
     * Scope for popular wish items by category
     */
    public function scopePopularByCategory($query, $categoryId, int $limit = 10)
    {
        return $query
            ->whereHas('wishCategories', function ($q) use ($categoryId) {
                $q->where('user_category_id', $categoryId);
            })
            ->where('is_approved', true)
            ->orderByDesc('supporter_count')
            ->orderByDesc('engagement_level')
            ->limit($limit);
    }

    /**
     * Scope for user's pinned items
     */
    public function scopePinned($query)
    {
        return $query->where('is_pin', true);
    }

    /**
     * Scope for approved items only
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope with essential data for listings
     */
    public function scopeForListing($query)
    {
        return $query
            ->select($this->getOptimizedColumns())
            ->with($this->getCommonRelations())
            ->approved();
    }
}

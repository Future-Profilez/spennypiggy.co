<?php

namespace App\Models;

use App\Models\Concerns\HasCreatorWatermark;
use App\Models\Concerns\HasRewardContract;
use App\Models\Concerns\HasScheduledPublishing;
use App\Support\MediaUrl;
use App\Support\SecureMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class WishItem extends Model
{
    use HasCreatorWatermark, HasFactory, HasRewardContract, HasScheduledPublishing, SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'publish_at',
        'schedule_released_at',
        'payment_methods_accepted',
        'user_id',
        'stripe_product_id',
        'wishname',
        'goal_label',
        'price',
        'currency',
        'fullfill_amount',
        'tax_amount',
        'price_id',
        'item_url',
        'thumbnail',
        'moderation_reason',
        'moderation_asset',
        'reward',
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
        'content_file',
        'content_file_type',
        'content_file_name',
        'content_file_size',
        'ai_generated',
        'subscription',
        'subscription_period',
        'repeat_purchase',
        'category',
        'is_pin',
        'twitter_response',
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
        'trending_status',
        'is_suspended',
    ];

    protected $appends = [
        'perma_link',
        'is_cart',
        'reward_url',
        'content_file_url',
        'real_category',
    ];

    protected $casts = [
        'publish_at' => 'datetime',
        'schedule_released_at' => 'datetime',
        'twitter_response' => 'array',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    /*
     * 🚨 THE PAID FILE'S URL IS NOT PUBLIC DATA, and it was being serialised
     * on every card. The raw column is hidden here while the ACCESSOR BUILT
     * FROM IT was appended — hiding the column and publishing its URL, which
     * is the wrong way round. `Shop` already had the correct shape; these
     * three did not.
     *
     * ⚠️ Signing the URL (SecureMedia, Aug 2026) does not close this: a
     * signed URL handed to somebody who never bought is still a working
     * download for the life of the token. Signing is delivery, not
     * entitlement.
     *
     * ⚠️ `$hidden` ONLY affects toArray()/toJson(). Every entitled surface in
     * this app reads the accessor as a PROPERTY and builds its own payload
     * (see `GifterHubController`, which does `$t->tipGoal?->reward_url`), so
     * nothing that is meant to deliver the file is affected. If a surface
     * ever does need it in a serialised payload, `->makeVisible()` on that
     * query is the deliberate way to say so.
     */
    protected $hidden = [
        'reward_url',
        'content_file_url',
        // 'thumbnail',
        // 'is_pin',
        // The paid deliverable when the reward is a message or a link —
        // revealReward() opts entitled surfaces back in.
        'reward_body',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (! empty($this->thumbnail)) {
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
            $url = MediaUrl::thumb($this->thumbnail);
        } else {
            $url = MediaUrl::thumb(MediaUrl::FALLBACK_THUMBNAIL);
        }

        // Creator attribution watermark. The fallback above is a PLATFORM
        // placeholder, not this creator's work — MediaUrl refuses it by uuid.
        return MediaUrl::watermark($url, $this->creatorWatermarkUuid());
    }

    /**
     * The PAID reward file. Signed.
     *
     * 🚨 The operation chain is UNCHANGED and must stay that way — a paid
     * reward file is never width-capped (see MediaUrl), because it is the thing
     * the buyer paid for. The token is a query string appended after the whole
     * operation path, so it adds authorisation without touching the bytes.
     */
    public function getRewardUrlAttribute()
    {
        $url = false;
        if (! empty($this->reward)) {
            $url = 'https://ucarecdn.com/'.$this->reward.'/-/format/jpeg/';
        }

        return SecureMedia::sign($url);
    }

    /**
     * The PAID content deliverable (Field B of the two-field goal/deliverable
     * model). Signed; `perma_link` above is the public card thumbnail and is
     * deliberately not.
     */
    public function getContentFileUrlAttribute()
    {
        $url = null;
        if (! empty($this->content_file)) {
            // If it's a full Uploadcare URL (with modifiers), return as is
            if (strpos($this->content_file, 'https://ucarecdn.com/') === 0) {
                $url = $this->content_file;
            } else {
                // If it's just a UUID, construct the Uploadcare URL
                $url = 'https://ucarecdn.com/'.$this->content_file.'/';
            }
        }

        return SecureMedia::sign($url);
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
            'wishCategories.category',
        ];
    }

    /**
     * Define optimized columns for queries
     */
    protected function getOptimizedColumns(): array
    {
        return [
            'id', 'uuid', 'user_id', 'wishname', 'thumbnail', 'reward',
            'subscription', 'is_pin', 'supporter_count', 'trending_status', 'created_at',
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

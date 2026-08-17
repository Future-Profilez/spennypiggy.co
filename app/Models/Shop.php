<?php

namespace App\Models;

use App\Models\Concerns\HasCreatorWatermark;
use App\Models\Concerns\HasRewardContract;
use App\Models\Concerns\HasScheduledPublishing;
use App\Support\MediaUrl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class Shop extends Model
{
    use HasCreatorWatermark, HasFactory, HasRewardContract, HasScheduledPublishing, SoftDeletes;

    protected $fillable = [
        'publish_at',
        'schedule_released_at',
        'payment_methods_accepted',
        'user_id',
        'type',
        'stripe_product_id',
        'price_id',
        'shipping_profile_id',
        'name',
        'description',
        'image',
        'moderation_reason',
        'moderation_asset',
        'price',
        'currency',
        'special_member_price',
        'success_page_type',
        'success_page_value',
        'reward_file_type',
        'reward_file',
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
        'ai_generated',
        'ask_question',
        'slot_limitation',
        'quantity_allow',
        'shipping_information',
        'vat_applicable',
        'approved',
        'status',
        'edited_reason',
        'edited_status',
        'is_suspended',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status',
    ];

    protected $casts = [
        'publish_at' => 'datetime',
        'schedule_released_at' => 'datetime',
    ];

    /**
     * `reward_file` and `success_page_value` ARE the paid digital deliverable —
     * serialising them on a public listing hands the content to anyone who can
     * see the card. They stay hidden by default; entitled surfaces (the owner,
     * or a buyer with a paid ShopPayment) opt back in with entitledFor()/
     * withDeliverable().
     */
    protected $hidden = [
        'id',
        // 'user_id',
        'stripe_product_id',
        'image',
        'reward_file',
        'reward_body',
        'success_page_value',
        'price_id',
        'paid_payments_count',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $appends = [
        'perma_link',
        'total_sold',
        'real_category',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (! empty($this->image)) {
            // Capped — an uncapped original decodes to tens of MB of bitmap in
            // the browser and is what killed the mobile Safari tab on a profile
            // full of listings. See MediaUrl::THUMB_WIDTH.
            $url = MediaUrl::thumb($this->image);
        }

        // Creator attribution watermark — no-op unless the feature is on and
        // the owner relation is already loaded (see HasCreatorWatermark).
        return MediaUrl::watermark($url, $this->creatorWatermarkUuid());
    }

    /**
     * Get optimized image URL with modern format support
     */
    public function getOptimizedImageUrl(string $format = 'webp', int $quality = 85, array $options = []): string
    {
        if (empty($this->image)) {
            return '';
        }

        $baseUrl = 'https://ucarecdn.com/'.$this->image;
        $transformations = [];

        // Add format transformation
        if (in_array($format, ['webp', 'avif', 'jpeg', 'png'])) {
            $transformations[] = "format/{$format}";
        }

        // Add quality transformation
        $transformations[] = "quality/{$quality}";

        // Add resize if specified
        if (isset($options['width'])) {
            $width = $options['width'];
            $height = $options['height'] ?? '';
            $transformations[] = "resize/{$width}x{$height}";
        }

        // Add other transformations
        if (isset($options['progressive']) && $options['progressive']) {
            $transformations[] = 'progressive/yes';
        }

        return $baseUrl.'/-/'.implode('/-/', $transformations).'/';
    }

    /**
     * Get responsive image data for modern formats
     */
    public function getResponsiveImageData(): array
    {
        if (empty($this->image)) {
            return [];
        }

        $baseUrl = 'https://ucarecdn.com/'.$this->image;
        $sizes = [320, 640, 768, 1024, 1280, 1920];
        $formats = ['original', 'webp', 'avif'];

        $data = [
            'original' => $baseUrl.'/-/format/jpeg/-/quality/85/',
            'formats' => [
                'webp' => $baseUrl.'/-/format/webp/-/quality/85/',
                'avif' => $baseUrl.'/-/format/avif/-/quality/85/',
            ],
            'responsive' => [],
        ];

        foreach ($formats as $format) {
            $formatUrl = $format === 'original' ? $data['original'] : $data['formats'][$format];
            $data['responsive'][$format] = [];

            foreach ($sizes as $size) {
                $data['responsive'][$format][$size] = str_replace('/-/quality/', "/-/resize/{$size}x/-/quality/", $formatUrl);
            }
        }

        return $data;
    }

    public function getRewardFileUrlAttribute()
    {
        $url = false;
        if (! empty($this->reward_file)) {
            if (Str::startsWith($this->reward_file, ['http://', 'https://'])) {
                $url = $this->reward_file;
            } else {
                $url = 'https://ucarecdn.com/'.$this->reward_file.'/';
            }
        }

        return $url;
    }

    /**
     * Reveal the paid deliverable on this model instance. Only call once the
     * viewer is known to be entitled (owner, or a paid ShopPayment).
     */
    public function withDeliverable(): self
    {
        return $this->makeVisible(['reward_file', 'reward_body', 'success_page_value'])
            ->append('reward_file_url');
    }

    /**
     * Reveal the deliverable only when $userId owns the listing or has paid for
     * it. Safe to call with a null user (guest) — it simply reveals nothing.
     */
    public function entitledFor(?int $userId, ?string $sessionId = null): self
    {
        if ($userId && (int) $this->user_id === (int) $userId) {
            return $this->withDeliverable();
        }

        // No identity at all (guest with no checkout session) → reveal nothing.
        if (! $userId && ! $sessionId) {
            return $this;
        }

        // A logged-in user unlocks ONLY their own paid rows (user_id bound); a
        // guest unlocks only via the session_id from their own checkout return.
        // Never let a bare session_id override the user_id scope — that lets an
        // authenticated attacker replay someone else's session id.
        $paid = ShopPayment::where('shop_id', $this->id)
            ->where('payment_status', 'paid')
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when(! $userId && $sessionId, fn ($q) => $q->where('session_id', $sessionId))
            ->exists();

        return $paid ? $this->withDeliverable() : $this;
    }

    /**
     * Paid sales for this listing. Eager-load with `withCount('paidPayments')`
     * on list queries so `total_sold` does not fire one COUNT per row.
     */
    public function paidPayments()
    {
        return $this->hasMany(ShopPayment::class, 'shop_id')->where('payment_status', 'paid');
    }

    public function getTotalSoldAttribute()
    {
        // Uses the eager-loaded count when the query asked for it (withCount),
        // otherwise falls back to a direct count for single-model reads.
        if (array_key_exists('paid_payments_count', $this->attributes)) {
            return (int) $this->attributes['paid_payments_count'];
        }

        return ShopPayment::where('shop_id', $this->id)->where('payment_status', 'paid')->count();
    }

    public function category()
    {
        return $this->hasMany(ShopCategory::class, 'shop_id');
    }

    public function getRealCategoryAttribute()
    {
        $arr = [];
        foreach ($this->category as $category) {
            $arr[] = $category->category;
        }

        return $arr;
    }

    public function shop_shipping_info()
    {
        return $this->hasMany(ShopShippingInfo::class);
    }

    public function shipping_profile()
    {
        return $this->belongsTo(ShippingProfile::class);
    }
}

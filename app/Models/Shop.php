<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Shop extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'stripe_product_id',
        'name',
        'description',
        'image',
        'price',
        'currency',
        'special_member_price',
        'success_page_type',
        'success_page_value',
        'reward_file_type',
        'reward_file',
        'ai_generated',
        'ask_question',
        'slot_limitation',
        'quantity_allow',
        'shipping_information',
        'vat_applicable',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status'
    ];

    protected $hidden   =   [
        'id',
        // 'user_id',
        'stripe_product_id',
        'image',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $appends = [
        'perma_link',
        'reward_file_url',
        'total_sold',
        'real_category'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }


    public function getPermaLinkAttribute(){
        $url = false;
        if(!empty($this->image)){
            // Use only format transformation, quality seems to cause 400 errors
            $url = "https://ucarecdn.com/" . $this->image . "/-/format/jpeg/";
        }

        return $url;
    }

    /**
     * Get optimized image URL with modern format support
     */
    public function getOptimizedImageUrl(string $format = 'webp', int $quality = 85, array $options = []): string
    {
        if (empty($this->image)) {
            return '';
        }

        $baseUrl = "https://ucarecdn.com/" . $this->image;
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

        return $baseUrl . '/-/' . implode('/-/', $transformations) . '/';
    }

    /**
     * Get responsive image data for modern formats
     */
    public function getResponsiveImageData(): array
    {
        if (empty($this->image)) {
            return [];
        }

        $baseUrl = "https://ucarecdn.com/" . $this->image;
        $sizes = [320, 640, 768, 1024, 1280, 1920];
        $formats = ['original', 'webp', 'avif'];

        $data = [
            'original' => $baseUrl . '/-/format/jpeg/-/quality/85/',
            'formats' => [
                'webp' => $baseUrl . '/-/format/webp/-/quality/85/',
                'avif' => $baseUrl . '/-/format/avif/-/quality/85/'
            ],
            'responsive' => []
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


    public function getRewardFileUrlAttribute(){
        $url = false;
        if(!empty($this->reward_file)){
            $url = "https://ucarecdn.com/" . $this->reward_file . "/";
        }

        return $url;
    }


    public function getTotalSoldAttribute(){
        $payments = ShopPayment::where('shop_id',$this->id)->where('payment_status','paid')->count();

        return $payments;
    }


    public function category(){
        return $this->hasMany(ShopCategory::class,'shop_id');
    }

    public function getRealCategoryAttribute()
    {
        $arr = [];
        foreach ($this->category as $category) {
            $arr[] = $category->category;
        }

        return $arr;
    }


    public function shop_varients(){
        return $this->hasMany(ShopVarients::class,'shop_id');
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

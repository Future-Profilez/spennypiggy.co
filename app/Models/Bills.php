<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\InvalidatesUserCache;
use Ramsey\Uuid\Uuid;

class Bills extends Model
{
    use HasFactory, SoftDeletes, InvalidatesUserCache;

    protected $table = 'bills';

    protected $fillable = [
        'uuid',
        'user_id',
        'product_id',
        'price_id',
        'name',
        // Deprecated monetary fields - use supporterCount and social metrics instead
        // 'price',
        // 'currency',
        // 'tax_amount',
        'thumbnail',
        'status',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status'
    ];

    protected $appends = [
        'perma_link',
        'content_file_url'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('is_uk', 0);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->thumbnail)) {
            $url = "https://ucarecdn.com/" . $this->thumbnail . "/-/format/jpeg/";
        } else {
            $url = "https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/";
        }

        return $url;
    }

    public function payments()
    {
        return $this->hasMany(BillPayment::class);
    }

    public function getContentFileUrlAttribute()
    {
        $url = null;
        if (!empty($this->content_file)) {
            if (strpos($this->content_file, 'https://ucarecdn.com/') === 0) {
                $url = $this->content_file;
            } else {
                $url = 'https://ucarecdn.com/' . $this->content_file . '/';
            }
        }
        return $url;
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\HasRewardContract;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class TipGoal extends Model
{
    use HasFactory, HasRewardContract, SoftDeletes;

    protected $fillable = [
        'payment_methods_accepted',
        'uuid',
        'user_id',
        'name',
        // Deprecated monetary fields - use supporterCount and social metrics instead
        // "target",
        // "default_price",
        // 'fullfilled',
        // 'tax_amount',
        // 'currency',
        'description',
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
        'status',
        'days',
        'completed',
        'completed_at',
        'price_id',
        'product_id',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status',
    ];

    protected $hidden = [
        'id',
        'user_id',
        // The paid deliverable when the reward is a message or a link —
        // revealReward() opts entitled surfaces back in.
        'reward_body',
        'price_id',
        'completed_at',
        'product_id',
        'created_at',
        'updated_at',
    ];

    protected $appends = [
        'complete_at',
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

    public function getCompleteAtAttribute()
    {
        if (! empty($this->completed_at)) {
            return Carbon::createFromFormat('Y-m-d H:i:s', $this->completed_at)->isoFormat('DD MMM YYYY');
        }

        return false;
    }
}

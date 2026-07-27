<?php

namespace App\Models;

use App\Models\Concerns\HasRewardContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Task extends Model
{
    use HasFactory, HasRewardContract, SoftDeletes;

    /**
     * The paid deliverable when the reward is a message or a link — entitled
     * surfaces opt back in with revealReward().
     */
    protected $hidden = [
        'reward_body',
    ];

    protected $fillable = [
        'payment_methods_accepted',
        'uuid',
        'creator_id',
        'title',
        'description',
        'price',
        'category',
        'type',
        'status',
        'media_url',
        'moderation_reason',
        'deliverable_content_type',
        'deliverable_content',
        'deliverable_note',
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
        'sla_hours',
        'stripe_product_id',
        'stripe_price_id',
        'is_approved',
        'is_suspended',
    ];

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}

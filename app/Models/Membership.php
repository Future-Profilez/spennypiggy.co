<?php

namespace App\Models;

use App\Models\Concerns\HasRewardContract;
use App\Models\Concerns\HasScheduledPublishing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Membership extends Model
{
    use HasFactory, HasRewardContract, HasScheduledPublishing, SoftDeletes;

    protected $fillable = [
        'publish_at',
        'schedule_released_at',
        'uuid',
        'user_id',
        'product_id',
        'price_id',
        'level',
        'price',
        'currency',
        'tax_amount',
        'thumbnail',
        'moderation_reason',
        'moderation_asset',
        'rewards',
        // Memberships had no content file at all — only perk checkboxes, so a
        // supporter received nothing at the moment of purchase.
        'content_file',
        'content_file_type',
        'content_file_name',
        'content_file_size',
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
        'status',
        'approved',
        'edited_reason',
        'edited_status',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status',
        'is_suspended',
    ];

    protected $casts = [
        'publish_at' => 'datetime',
        'schedule_released_at' => 'datetime',
    ];

    protected $appends = [
        'perma_link',
        'content_file_url',
    ];

    /**
     * The paid deliverable when the reward is a message or a link — entitled
     * surfaces opt back in with revealReward().
     */
    protected $hidden = [
        'reward_body',
    ];

    /**
     * Uploadcare UUIDs are stored bare; every display surface needs the CDN
     * URL. Mirrors Bills::getContentFileUrlAttribute().
     */
    public function getContentFileUrlAttribute()
    {
        if (empty($this->content_file)) {
            return null;
        }

        if (strpos($this->content_file, 'https://ucarecdn.com/') === 0) {
            return $this->content_file;
        }

        return 'https://ucarecdn.com/'.$this->content_file.'/';
    }

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function payments()
    {
        return $this->hasMany(MembershipPayment::class);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (! empty($this->thumbnail)) {
            $url = 'https://ucarecdn.com/'.$this->thumbnail.'/-/format/jpeg/';
        } else {
            if ($this->level == 'bronze') {
                $url = 'https://ucarecdn.com/70d610ae-b6b0-4f5a-a144-2d49765c4140/';
            } elseif ($this->level == 'silver') {
                $url = 'https://ucarecdn.com/be570b7f-9a2f-49ef-9228-aa88c457c215/';
            } elseif ($this->level == 'gold') {
                $url = 'https://ucarecdn.com/efb9fec0-ee98-499a-a82b-e90137357f8b/';
            } elseif ($this->level == 'platinum') {
                $url = 'https://ucarecdn.com/e44e62d6-295f-4c6c-a907-537998f54192/';
            } elseif ($this->level == 'lifetime') {
                $url = 'https://ucarecdn.com/58a3bd82-a089-423c-b3f8-f9da5ece4e90/';
            }
        }

        return $url;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

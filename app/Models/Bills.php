<?php

namespace App\Models;

use App\Models\Concerns\HasRewardContract;
use App\Models\Concerns\HasScheduledPublishing;
use App\Support\MediaUrl;
use App\Support\SecureMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Bills extends Model
{
    use HasFactory, HasRewardContract, HasScheduledPublishing, SoftDeletes;

    protected $table = 'bills';

    protected $fillable = [
        'publish_at',
        'schedule_released_at',
        'uuid',
        'user_id',
        'product_id',
        'price_id',
        'name',
        'goal_label',
        'price',
        'currency',
        'tax_amount',
        'thumbnail',
        'moderation_reason',
        'moderation_asset',
        'content_file',
        'content_file_type',
        'content_file_name',
        'content_file_size',
        // A Bill sells ONE recurring content stream: an instant welcome reward
        // plus the creator's subscriber-only posts. No perks list — that is a
        // Membership, and giving Bills one made the two indistinguishable.
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
        'period',
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
        'content_file_url',
        'reward_body',
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

    public function payments()
    {
        return $this->hasMany(BillPayment::class);
    }

    public function totalRevenue()
    {
        return $this->payments()->where('status', 'paid')->sum('amount');
    }

    public function uniqueBuyersCount()
    {
        return $this->payments()
            ->where('status', 'paid')
            ->selectRaw('COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE guest_email END) as count')
            ->value('count');
    }

    public function totalPaymentsCount()
    {
        return $this->payments()->where('status', 'paid')->count();
    }

    public function monthlyRevenue($month = null, $year = null)
    {
        $month = $month ?? now()->month;
        $year = $year ?? now()->year;

        return $this->payments()
            ->where('status', 'paid')
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->sum('amount');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeApproved($query)
    {
        return $query->where('approved', 1);
    }

    public function uniqueBuyers()
    {
        return $this->payments()
            ->where('status', 'paid')
            ->distinct('user_id', 'guest_email')
            ->count('user_id');
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (! empty($this->thumbnail)) {
            $url = MediaUrl::thumb($this->thumbnail);
        } else {
            $url = MediaUrl::thumb(MediaUrl::FALLBACK_THUMBNAIL);
        }

        return $url;
    }

    /**
     * The PAID recurring-content deliverable. Signed, so the link expires
     * instead of outliving the subscription that bought it — a cancelled or
     * refunded subscriber otherwise keeps a permanent shareable URL.
     *
     * ⚠️ `perma_link` above is the PUBLIC card thumbnail and stays unsigned.
     * ⚠️ The raw `content_file` column is untouched; only this derived
     * attribute carries the token, so an edit form round-trip cannot persist an
     * expired URL back into the database.
     */
    public function getContentFileUrlAttribute()
    {
        $url = null;
        if (! empty($this->content_file)) {
            if (strpos($this->content_file, 'https://ucarecdn.com/') === 0) {
                $url = $this->content_file;
            } else {
                $url = 'https://ucarecdn.com/'.$this->content_file.'/';
            }
        }

        return SecureMedia::sign($url);
    }
}

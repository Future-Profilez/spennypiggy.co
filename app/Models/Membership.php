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

    /**
     * Uploadcare UUIDs are stored bare; every display surface needs the CDN
     * URL. Mirrors Bills::getContentFileUrlAttribute().
     *
     * PAID deliverable, so it is SIGNED — a member who cancels or charges back
     * must not keep a permanent link to the tier's content. `perma_link` (the
     * tier art) is public and stays unsigned.
     */
    public function getContentFileUrlAttribute()
    {
        if (empty($this->content_file)) {
            return null;
        }

        $url = strpos($this->content_file, 'https://ucarecdn.com/') === 0
            ? $this->content_file
            : 'https://ucarecdn.com/'.$this->content_file.'/';

        return SecureMedia::sign($url);
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

    /**
     * A membership with no thumbnail of its own falls back to its TIER's art,
     * not to the generic platform placeholder — the tier is the product here.
     *
     * ⚠️ The ONE definition of that map. The catalogue ("My Listings") resolves
     * its own square thumbnail rather than reading `perma_link`, so a second copy
     * of these uuids is how one screen shows gold art and another shows a broken
     * tile. An unrecognised level returns null; the caller decides what to do.
     */
    public static function defaultThumbnailUuid(?string $level): ?string
    {
        return match (strtolower(trim((string) $level))) {
            'bronze' => '70d610ae-b6b0-4f5a-a144-2d49765c4140',
            'silver' => 'be570b7f-9a2f-49ef-9228-aa88c457c215',
            'gold' => 'efb9fec0-ee98-499a-a82b-e90137357f8b',
            'platinum' => 'e44e62d6-295f-4c6c-a907-537998f54192',
            'lifetime' => '58a3bd82-a089-423c-b3f8-f9da5ece4e90',
            default => null,
        };
    }

    public function getPermaLinkAttribute()
    {
        if (! empty($this->thumbnail)) {
            return MediaUrl::thumb($this->thumbnail);
        }

        $uuid = self::defaultThumbnailUuid($this->level);

        // ⚠️ An unknown tier used to return `false` — a bare `false` reaching an
        // <img src> is a broken image, so it now falls through to the platform
        // placeholder like every other listing type.
        return MediaUrl::thumb($uuid ?? MediaUrl::FALLBACK_THUMBNAIL);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

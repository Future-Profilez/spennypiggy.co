<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

/**
 * An edit to a profile asset that is already live to the public.
 *
 * The live column on `users` / `social_links` is never touched while one of these
 * is open, so the approved version stays public and rejecting costs nothing.
 *
 * ⚠️ This model exists in BOTH apps against one shared table. Keep `$fillable`,
 * `$casts` and the uuid hook in step — the admin `Notification` model shipped
 * without a uuid hook and every admin-written bell row failed on insert, silently,
 * for exactly this reason.
 */
class ProfileChangeRequest extends Model
{
    use HasFactory;

    public const ASSET_AVATAR = 'avatar';

    public const ASSET_COVER = 'cover';

    public const ASSET_BIO = 'bio';

    public const ASSET_SOCIALS = 'socials';

    /**
     * The assets that can travel through this table.
     *
     * ⚠️ `intro` is deliberately absent. `user_intros` is already row-per-upload,
     * so an intro is naturally versioned — a new one does not destroy the old.
     * `identity` is Stripe's verdict and is not ours to diff.
     */
    public const ASSETS = [
        self::ASSET_AVATAR,
        self::ASSET_COVER,
        self::ASSET_BIO,
        self::ASSET_SOCIALS,
    ];

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    /** Replaced by a newer edit before anyone decided it. */
    public const STATUS_SUPERSEDED = 'superseded';

    /**
     * The `social_links` columns a socials change carries.
     *
     * ⚠️ `status`, `reason` and `uuid` are deliberately absent — they are review
     * state and identity, not the creator's submission, and copying them through a
     * change request would let an approval overwrite the row's own moderation state
     * with a snapshot taken before the review happened.
     */
    public const SOCIAL_FIELDS = [
        'whoyouinto',
        'twitter',
        'instagram',
        // Accepted since 11 Aug 2026. A field missing from this snapshot is a
        // field an approval silently drops — the creator's edit would be
        // reviewed and then not applied.
        'tiktok',
        'facebook',
        'youtube',
        'twitch',
        'tumblr',
        'reddit',
        'discord',
        'onlyfans',
        'loyalfans',
        'fansly',
        'manyvids',
        'other',
    ];

    public const SCAN_CLEAN = 'clean';

    public const SCAN_FLAGGED = 'flagged';

    protected $fillable = [
        'uuid',
        'user_id',
        'asset',
        'status',
        'proposed',
        'previous',
        'scan_state',
        'moderation_reason',
        'moderation_asset',
        'reason',
        'decided_by_admin_id',
        'decided_at',
        'submitted_at',
        'active_key',
    ];

    protected $casts = [
        'proposed' => 'array',
        'previous' => 'array',
        'decided_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $request) {
            if (empty($request->uuid)) {
                // Cast to string: a Ramsey object in an array key or a route query
                // serialises as an object, not its value.
                $request->uuid = (string) Uuid::uuid4();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The key that makes "one open row per asset" a database guarantee.
     *
     * 🚨 Never build this string anywhere else. It is a unique index, and a second
     * spelling of it is a second, silently weaker constraint.
     */
    public static function activeKey(int $userId, string $asset): string
    {
        return $userId.':'.$asset;
    }

    /**
     * Record an edit, replacing any undecided one for the same asset.
     *
     * The supersede and the insert are one transaction because the unique index on
     * `active_key` allows exactly one open row: closing the old one is what frees
     * the key for the new one.
     */
    public static function open(User $user, string $asset, array $proposed, array $previous = []): self
    {
        return DB::transaction(function () use ($user, $asset, $proposed, $previous) {
            static::query()
                ->where('user_id', $user->id)
                ->where('asset', $asset)
                ->where('status', self::STATUS_PENDING)
                ->update([
                    'status' => self::STATUS_SUPERSEDED,
                    'active_key' => null,
                    'updated_at' => now(),
                ]);

            return static::create([
                'user_id' => $user->id,
                'asset' => $asset,
                'status' => self::STATUS_PENDING,
                'proposed' => $proposed,
                'previous' => $previous,
                'submitted_at' => now(),
                'active_key' => static::activeKey($user->id, $asset),
            ]);
        });
    }

    /** The open request for one asset, if there is one. */
    public static function openFor(int $userId, string $asset): ?self
    {
        return static::query()
            ->where('active_key', static::activeKey($userId, $asset))
            ->first();
    }

    /**
     * Settle this request.
     *
     * ⚠️ `active_key` MUST be nulled. Clearing only `status` leaves the key held
     * and that asset can never be edited again — the same trap the review-assignment
     * release documents.
     */
    public function close(string $status, ?string $reason = null, ?int $adminId = null): bool
    {
        return $this->forceFill([
            'status' => $status,
            'reason' => $reason,
            'decided_by_admin_id' => $adminId,
            'decided_at' => now(),
            'active_key' => null,
        ])->save();
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }
}

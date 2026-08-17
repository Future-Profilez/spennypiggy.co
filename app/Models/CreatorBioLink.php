<?php

namespace App\Models;

use App\Support\BioLinkPlatforms;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

/**
 * One override on a creator's bio page — see the migration for why this table
 * holds overrides rather than the page itself.
 *
 * ⚠️ `platform` and `handle` are the ONLY stored parts of an external
 * destination. There is no URL column on purpose; read `resolvedUrl()`, which
 * rebuilds it through App\Support\BioLinkPlatforms. Adding a `url` column would
 * hand the redirect a value the request supplied.
 */
class CreatorBioLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'kind',
        'platform',
        'handle',
        'target_type',
        'target_key',
        'label',
        'sort_order',
        'is_active',
        'click_count',
        'last_clicked_at',
        'moderation_reason',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'click_count' => 'integer',
        'last_clicked_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $link) {
            if (empty($link->uuid)) {
                // Cast to string: a Ramsey object in an array key or a route
                // query serialises as an object, not its value.
                $link->uuid = (string) Uuid::uuid4();
            }
        });

        // 🚨 Maintained on BOTH create and update, and never set by a caller.
        // `target_key` IS the uniqueness constraint (see migration
        // 2026_08_16_000003) — a row that reaches the table without it, or with
        // one that no longer matches its own columns, silently allows the
        // duplicate button the index exists to prevent.
        static::saving(function (self $link) {
            $link->target_key = self::targetKey(
                $link->kind,
                $link->platform,
                $link->target_type
            );
        });
    }

    /**
     * The ONE definition of a link's uniqueness key.
     *
     * ⚠️ Exactly one of `platform` / `target_type` is populated on any row, and
     * the other is NULL — which is precisely why the original composite unique
     * index could never fire. Collapsing them into one non-null string is what
     * lets a plain unique index work. Its shape is mirrored by the backfill in
     * migration `2026_08_16_000003`; change one and you must change both.
     */
    public static function targetKey(?string $kind, ?string $platform, ?string $targetType): string
    {
        return ($kind ?? '').':'.($platform ?? $targetType ?? '');
    }

    /**
     * ⚠️ Normalise on the way IN, so no writer can store a raw pasted URL.
     *
     * BioLinkController already normalises before validating (it has to, or the
     * error it shows would be about a value the creator never typed). This is
     * the backstop for every other writer — an import, a future admin tool, a
     * console fixup — because a raw handle fails `handleIsValid()` at render
     * time and the button simply never appears, with nothing logged and nothing
     * to see in the database but a value that looks fine.
     *
     * 🚨 It normalises, it does NOT validate. Anything this cannot reduce is
     * still refused by BioLinkPlatforms at render and at click time, which is
     * what keeps "reduce a pasted URL" from becoming "force a bad value to pass".
     */
    protected function setHandleAttribute(?string $value): void
    {
        $this->attributes['handle'] = $value === null
            ? null
            : BioLinkPlatforms::normaliseHandle($value);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExternal(): bool
    {
        return $this->kind === BioLinkPlatforms::KIND_EXTERNAL;
    }

    public function isInternal(): bool
    {
        return $this->kind === BioLinkPlatforms::KIND_INTERNAL;
    }

    /**
     * The wording shown on the button: the creator's own if they set one, the
     * platform or section default otherwise.
     */
    public function displayLabel(): string
    {
        if (filled($this->label)) {
            return $this->label;
        }

        if ($this->isExternal()) {
            return BioLinkPlatforms::platform($this->platform)['label'] ?? 'Link';
        }

        return BioLinkPlatforms::internalTarget($this->target_type)['label'] ?? 'Link';
    }

    /**
     * Where this button actually goes.
     *
     * 🚨 Returns null for anything that cannot be rebuilt from the whitelist —
     * a platform since removed from PLATFORMS, a handle that no longer matches
     * its pattern. The caller must treat null as "do not redirect", never as
     * "fall back to the stored value", because there is no stored value.
     */
    public function resolvedUrl(?string $username = null): ?string
    {
        if ($this->isExternal()) {
            return BioLinkPlatforms::externalUrl($this->platform, $this->handle);
        }

        $username = $username ?? $this->user?->username;

        if (! filled($username)) {
            return null;
        }

        return BioLinkPlatforms::internalUrl($this->target_type, $username);
    }
}

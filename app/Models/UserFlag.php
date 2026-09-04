<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One "somebody should look at this account".
 *
 * 🚨 A FLAG BLOCKS NOTHING — see the migration and config/user_flags.php. Nothing
 * in either app reads this table to decide whether money moves. If a query here
 * ever starts gating behaviour, it has become a risk control and belongs in
 * app/Services/Risk.
 *
 * ⚠️ SHARED TABLE, TWO WRITERS. `user_flags` is created by a migration in
 * spennypiggy.co and used by BOTH apps. This class exists in both repositories
 * and must be kept in step by hand — adding a column means editing two models.
 *
 * ⚠️ `reason` is already redacted when written (SecurityRedactor). It is rendered
 * to admins who are not behind `can:view-pii`, so never bypass the writer to
 * insert a raw value.
 */
class UserFlag extends Model
{
    protected $table = 'user_flags';

    protected $fillable = [
        'user_id',
        'user_role',
        'flag_type',
        'severity',
        'status',
        'source',
        'reason',
        'context',
        'occurrences',
        'first_seen_at',
        'last_seen_at',
        'raised_by_admin_id',
        'resolved_by_admin_id',
        'resolved_at',
        'resolution_note',
    ];

    protected $casts = [
        'context' => 'array',
        'user_role' => 'integer',
        'occurrences' => 'integer',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    /** Still needs a person to look at it. */
    public const STATUS_OPEN = 'open';

    /** An admin looked and decided nothing needed doing. */
    public const STATUS_REVIEWED = 'reviewed';

    /** An admin looked and did something — suspended, refunded, contacted. */
    public const STATUS_ACTIONED = 'actioned';

    public const SEVERITY_CRITICAL = 'critical';

    public const SEVERITY_WARNING = 'warning';

    public const SEVERITY_INFO = 'info';

    /**
     * Worst first. `critical` before `warning` before anything else, then most
     * recently seen — MySQL has no enum ordering here because `severity` is a
     * plain string on purpose (either app can record a new one).
     */
    public function scopeWorstFirst($query)
    {
        return $query
            ->orderByRaw("FIELD(severity, 'critical', 'warning', 'info') ")
            ->orderByDesc('last_seen_at');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function user(): BelongsTo
    {
        // No foreign key on the column — a flag outlives the account it is about,
        // so this relation is legitimately null for a deleted user and every
        // caller must handle that.
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Human label for the type, from config. Falls back to the raw type. */
    public function getLabelAttribute(): string
    {
        return (string) config("user_flags.types.{$this->flag_type}.label", $this->flag_type);
    }

    /** What this type means, for an admin who has not seen it before. */
    public function getTypeDescriptionAttribute(): ?string
    {
        $description = config("user_flags.types.{$this->flag_type}.description");

        return $description ? (string) $description : null;
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }
}

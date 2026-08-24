<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Dedup ledger for engagement notifications — see the migration for the
 * meaning of `dedup_key` per type.
 */
class EngagementNotification extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type',
        'dedup_key',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public const TYPE_REACTIVATION = 'reactivation';

    public const TYPE_CREATOR_EVENT = 'creator_event';

    public const TYPE_MILESTONE = 'milestone';

    public const TYPE_WHALE_RISK = 'whale_risk';

    /**
     * Discovery Phase 4 — one row per supporter, per creator, per stage, per
     * year. `dedup_key` is "{creatorId}|{stage}|{year}".
     */
    public const TYPE_BIRTHDAY_REMINDER = 'birthday_reminder';

    /**
     * Discovery Phase 4 — 🚨 THE "ONE COPY PER PERSON" GUARANTEE for the Monday
     * campaign. `dedup_key` is the ISO year-and-week ("2026-W36") and NOTHING
     * ELSE: no creator id, so a recipient who supports eight creators with
     * birthdays that week still claims exactly one row and receives exactly one
     * e-mail. The unique index on (user_id, type, dedup_key) is what enforces
     * it, so two overlapping runs cannot both win.
     */
    public const TYPE_BIRTHDAYS_THIS_WEEK = 'birthdays_this_week';

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

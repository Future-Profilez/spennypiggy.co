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

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

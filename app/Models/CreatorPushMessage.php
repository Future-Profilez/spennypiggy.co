<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * One push a creator sent (or tried to send) to their supporters.
 * See the migration: this table IS the rate limit and the audit trail.
 */
class CreatorPushMessage extends Model
{
    public const STATUS_SENT = 'sent';

    public const STATUS_BLOCKED = 'blocked';

    protected $fillable = [
        'uuid', 'creator_id', 'body', 'status', 'blocked_reason', 'recipients',
        'flagged_at', 'flagged_reason', 'flagged_by_admin_id',
    ];

    protected $casts = [
        'recipients' => 'integer',
        'flagged_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $row) {
            $row->uuid = $row->uuid ?: (string) Str::uuid();
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}

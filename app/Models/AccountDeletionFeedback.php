<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One row per account deletion: why they left, in their own words if they gave
 * any.
 *
 * ⚠️ Mirrored in admin.spennypiggy.co (shared database, separate code). The
 * back office only READS these — nothing an admin does should be able to write
 * or edit somebody's stated reason for leaving.
 */
class AccountDeletionFeedback extends Model
{
    use HasFactory;

    protected $table = 'account_deletion_feedback';

    protected $fillable = [
        'user_id',
        'user_uuid',
        'username',
        'email',
        'user_role',
        'reason_code',
        'comment',
        'ip_address',
        'deleted_account_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'user_role' => 'integer',
        'deleted_account_at' => 'datetime',
    ];

    /**
     * The sentence this code stood for, as configured right now.
     *
     * ⚠️ Falls back to the raw code rather than to an empty string: a reason
     * whose key was removed from the config still has to render as SOMETHING,
     * and the code is at least searchable.
     */
    public function reasonLabel(): string
    {
        return config('account_deletion.reasons.'.$this->reason_code, $this->reason_code ?: 'Not given');
    }
}

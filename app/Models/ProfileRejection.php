<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/**
 * A creator's rejection history — READ here, WRITTEN by the admin app.
 *
 * 🚨 EMPTY `$fillable`, deliberately. Nothing on the website decides a rejection;
 * a row a posted form could create is a rejection nobody took. The admin app's
 * copy of this model carries the fillable list. See the migration's docblock.
 */
class ProfileRejection extends Model
{
    protected $table = 'profile_rejections';

    protected $fillable = [];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The most recent reason this creator was turned down for, or null.
     *
     * ⚠️ Falls back to the live column: a rejection written before this table
     * existed has no history row, and telling that creator nothing when the
     * reason is sitting on their own row would be the wrong direction to fail.
     * Guarded on the table because the two apps deploy separately.
     */
    public static function latestReasonFor(User $user): ?string
    {
        $fromHistory = null;

        try {
            if (Schema::hasTable('profile_rejections')) {
                $fromHistory = static::query()
                    ->where('user_id', $user->id)
                    ->orderByDesc('id')
                    ->value('reason');
            }
        } catch (\Throwable) {
            $fromHistory = null;
        }

        $reason = $fromHistory ?: $user->profile_reject_reason;

        return is_string($reason) && trim($reason) !== '' ? trim($reason) : null;
    }
}

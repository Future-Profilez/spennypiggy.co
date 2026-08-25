<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A marketing opt-out recorded against an EMAIL ADDRESS.
 *
 * 🚨 THIS IS THE RECORD THAT SURVIVES THE ACCOUNT. `users.marketing_emails_enabled`
 * is the day-to-day switch; this table is the one that still says "no" after the
 * user row is gone, after they sign up again with the same address, or when the
 * address never had an account at all. UK brief §6: do not delete an
 * unsubscriber's address — suppress it.
 *
 * ⚠️ Addresses are normalised to lower case on the way in and on every lookup.
 * `Naveen@x.com` and `naveen@x.com` are one inbox, and two rows would let one of
 * them keep receiving mail.
 */
class MarketingSuppression extends Model
{
    protected $table = 'marketing_suppressions';

    protected $fillable = [
        'email',
        'suppressed_at',
        'source',
        'user_id',
    ];

    protected $casts = [
        'suppressed_at' => 'datetime',
    ];

    /** The one normalisation, so a write and a read can never disagree. */
    public static function normalise(?string $email): string
    {
        return mb_strtolower(trim((string) $email));
    }
}

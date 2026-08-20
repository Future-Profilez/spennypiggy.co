<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One observation from the security log — Security Checklist §3.
 *
 * ⚠️ SHARED TABLE, TWO WRITERS. `security_events` is created by a migration in
 * spennypiggy.co and written by BOTH apps (the `app` column says which). Adding
 * a column means updating this model in both repositories; adding the migration
 * twice would try to create the table twice against one database.
 *
 * Rows are written for every observation, not only the ones that trigger a mail.
 * `alerted_at` is null when something was seen and deliberately not shouted
 * about — under a threshold, or inside a cooldown. Being able to tell that apart
 * from "nothing happened" is the difference between tuning a threshold and
 * guessing at one.
 */
class SecurityEvent extends Model
{
    protected $table = 'security_events';

    protected $fillable = [
        'event_type',
        'severity',
        'app',
        'user_id',
        'admin_id',
        'subject_type',
        'subject_id',
        'email',
        'ip_address',
        'is_new_ip',
        'description',
        'context',
        'alerted_at',
    ];

    protected $casts = [
        'context' => 'array',
        'is_new_ip' => 'boolean',
        'alerted_at' => 'datetime',
    ];

    // Event types. Strings rather than an enum column so either app can record a
    // new kind without a migration the other has not run yet.
    public const ADMIN_LOGIN = 'admin_login';

    public const LOGIN_FAILED = 'login_failed';

    public const LOGIN_FAILED_BURST = 'login_failed_burst';

    public const LOGIN_LOCKOUT = 'login_lockout';

    public const OTP_FAILED = 'otp_failed';

    public const OTP_FAILED_BURST = 'otp_failed_burst';

    public const PAYOUT_DESTINATION_CHANGE = 'payout_destination_change';

    public const ACCOUNT_EMAIL_CHANGE = 'account_email_change';

    public const CONTENT_DOWNLOAD = 'content_download';

    public const CONTENT_DOWNLOAD_BURST = 'content_download_burst';

    public const REFUND_VOLUME = 'refund_volume';
}

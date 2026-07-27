<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MorConsent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'consent_given',
        'consent_given_at',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'platform',
        // 'country',
        // 'city',
        // 'latitude',
        // 'longitude',
        'metadata',
    ];

    protected $casts = [
        'consent_given' => 'boolean',
        'consent_given_at' => 'datetime',
        'metadata' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /**
     * Get the user that owns the consent
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get latest consent for a user
     */
    public function scopeLatestForUser($query, $userId)
    {
        return $query->where('user_id', $userId)
            ->orderBy('consent_given_at', 'desc')
            ->limit(1);
    }

    /**
     * Check if user has given consent
     */
    public static function userHasGivenConsent($userId): bool
    {
        return self::where('user_id', $userId)
            ->where('consent_given', true)
            ->exists();
    }

    /**
     * Get latest consent for user
     */
    public static function getLatestConsent($userId)
    {
        return self::where('user_id', $userId)
            ->where('consent_given', true)
            ->latest('consent_given_at')
            ->first();
    }
}

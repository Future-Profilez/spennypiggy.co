<?php

namespace App\Models;

use App\Services\Pricing\CreatorFeeResolver;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A negotiated commercial rate for one creator.
 *
 * Rows are VERSIONED, never edited in place by the admin flow: changing a deal
 * ends the current row (`effective_to`) and opens a new one, so the rate that
 * priced any past transaction stays readable via `*.fee_override_id`.
 *
 * Only the platform rate is negotiable — the 2% compliance fee is fixed and
 * always read from config/payments.php.
 *
 * @see CreatorFeeResolver
 */
class CreatorFeeOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'platform_rate_card',
        'platform_rate_bank',
        'effective_from',
        'effective_to',
        'created_by',
        'ended_by',
        'note',
    ];

    protected $casts = [
        'platform_rate_card' => 'decimal:2',
        'platform_rate_bank' => 'decimal:2',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The live agreement for a creator: started, and not yet ended.
     */
    public function scopeLive($query)
    {
        return $query
            ->where(function ($q) {
                $q->whereNull('effective_from')->orWhere('effective_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>', now());
            });
    }

    /**
     * The negotiated platform rate for one fee profile, or NULL when this deal
     * says nothing about that payment method (which means: standard rate).
     */
    public function platformRateFor(string $feeProfile): ?float
    {
        $rate = $feeProfile === 'bank'
            ? $this->platform_rate_bank
            : $this->platform_rate_card;

        return $rate === null ? null : (float) $rate;
    }
}

<?php

namespace App\Models;

use App\Support\DiscoverySources;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One thing that happened to a creator because of a Discovery surface.
 *
 * See the migration for the privacy note — this table holds personal data and
 * `site_visit_stats` deliberately does not.
 */
class DiscoveryEvent extends Model
{
    use HasFactory;

    public const TYPE_VISIT = 'visit';

    public const TYPE_FOLLOW = 'follow';

    public const TYPE_PURCHASE = 'purchase';

    protected $fillable = [
        'creator_id',
        'source',
        'traffic_class',
        'campaign',
        'user_id',
        'visitor_id',
        'event_type',
        'transactable_type',
        'transactable_id',
        'financial_transaction_id',
        'value_gbp',
        'is_new_to_creator',
        'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'value_gbp' => 'decimal:2',
        'is_new_to_creator' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function supporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function financialTransaction(): BelongsTo
    {
        return $this->belongsTo(FinancialTransaction::class);
    }

    /** Only the traffic Spenny Piggy generated — what every creator-facing number reports. */
    public function scopeSpGenerated($query)
    {
        return $query->where('traffic_class', DiscoverySources::CLASS_SP);
    }
}

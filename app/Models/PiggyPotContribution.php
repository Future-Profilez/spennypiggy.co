<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class PiggyPotContribution extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // Discovery Phase 1 — the source that earned this sale, read back by
        // finance:sync-transactions when it writes the ledger row (no browser,
        // no Stripe event metadata in that worker). Class is derived, never stored.
        'discovery_source',
        'platform_fee_rate',
        'compliance_fee_rate',
        'fee_source',
        'fee_override_id',
        'fee_profile',
        'uuid',
        'piggy_pot_id',
        'creator_id',
        'user_id',
        'guest_name',
        'guest_email',
        'amount',
        'tax',
        'vat_amount',
        'total_paid',
        'currency',
        'message',
        'is_anonymous',
        'session_id',
        'payment_intent_id',
        'status',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
        'creator_notified_at',
        'supporter_notified_at',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'digital_waiver_confirmed_at' => 'datetime',
        'creator_notified_at' => 'datetime',
        'supporter_notified_at' => 'datetime',
    ];

    protected $appends = [
        'sender',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($model) => $model->uuid = Uuid::uuid4());
    }

    public function piggyPot()
    {
        return $this->belongsTo(PiggyPot::class, 'piggy_pot_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getSenderAttribute()
    {
        $sender = false;
        if (isset($this->creator_id)) {
            if (Auth::check() && $this->creator_id != Auth::id()) {
                $sender = true;
            }
        }

        return $sender;
    }
}

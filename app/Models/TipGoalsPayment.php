<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class TipGoalsPayment extends Model
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
        'session_id',
        'tip_goal_id',
        'user_id',
        'creator_id',
        'guest_name',
        'guest_email',
        'currency',
        'amount',
        'tax',
        'vat_amount',
        'total_paid',
        'message',
        'anonymous',
        'twitter_response',
        'certificate_url',
        'status',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'tip_goal_id',
        'session_id',
        // 'currency',
        // 'created_at',
        'updated_at',
    ];

    protected $appends = [
        'sender',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($s) => $s->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tipGoal()
    {
        return $this->belongsTo(TipGoal::class, 'tip_goal_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
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

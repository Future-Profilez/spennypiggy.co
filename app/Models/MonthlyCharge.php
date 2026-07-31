<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class MonthlyCharge extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'stripe_id',
        'session_id',
        'user_id',
        'name',
        'email',
        'currency',
        'amount',
        'tax',
        'status',
        'first_sale_activated_at',
        'cancelled_at',
        'current_start_trial_date',
        'current_end_trial_date',
        'current_start_subscription_date',
        'current_end_subscription_date',
        'upcoming_payment',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
    ];

    protected $casts = [
        'current_start_subscription_date' => 'date',
        'current_end_subscription_date' => 'date',
        'current_start_trial_date' => 'date',
        'current_end_trial_date' => 'date',
        'upcoming_payment' => 'datetime',
        'first_sale_activated_at' => 'datetime',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($s) => $s->uuid = Uuid::uuid4());
    }

    /**
     * Newest period first.
     *
     * Never order these rows by created_at: a Stripe backfill can write several
     * consecutive billing periods in the same second, and the tie makes latest()
     * return an arbitrary (often the oldest) period.
     */
    public function scopeNewestFirst($query)
    {
        return $query->orderByDesc('id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get user relationship (for backwards compatibility)
     */
    public function nonUkUser()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

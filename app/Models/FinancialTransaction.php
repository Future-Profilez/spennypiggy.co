<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class FinancialTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'platform_fee_rate',
        'compliance_fee_rate',
        'fee_source',
        'fee_override_id',
        'compliance_fee',
        'admin_fee',
        'fee_profile',
        'uuid',
        'user_id',
        'supporter_id',
        'source_type',
        'source_id',
        'type',
        'gross_amount',
        'platform_fee',
        'stripe_fee',
        'vat_amount',
        'net_amount',
        'reserve_amount',
        'reserve_status',
        'payout_run_id',
        'reserve_released_at',
        'reserve_payout_id',
        'currency',
        'status',
        'description',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'reserve_released_at' => 'datetime',
        'gross_amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'stripe_fee' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });

        // Money-ledger invariant: once a reserve is 'released' (paid back to the creator),
        // it can never be reverted to 'held'. This protects against SyncFinancialTransactions
        // (updateOrCreate) clobbering an already-released reserve, which would otherwise let the
        // reserve:release command pay the same reserve a second time.
        static::updating(function ($model) {
            if (
                $model->isDirty('reserve_status')
                && $model->getOriginal('reserve_status') === 'released'
                && $model->reserve_status !== 'released'
            ) {
                $model->reserve_status = 'released';
                $model->reserve_released_at = $model->getOriginal('reserve_released_at');
                // Without this, a resync that nulls reserve_payout_id leaves the row 'released'
                // with no link to its Stripe payout — and the payout.failed revert, which matches
                // on reserve_payout_id, can then never re-hold it.
                $model->reserve_payout_id = $model->getOriginal('reserve_payout_id');
            }

            // Reserve MONEY is equally immutable once the row has been paid out or released.
            // determineReserve() in SyncFinancialTransactions recomputes reserve_amount from the
            // creator's CURRENT risk percent, so raising a creator to 20% today would otherwise
            // rewrite historical rows and hand reserve:release a reserve that was never withheld.
            $isSettled = $model->getOriginal('reserve_status') === 'released'
                || ! empty($model->getOriginal('payout_run_id'));

            if ($isSettled && $model->isDirty('reserve_amount')) {
                $model->reserve_amount = $model->getOriginal('reserve_amount');
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function supporter()
    {
        return $this->belongsTo(User::class, 'supporter_id');
    }

    public function source()
    {
        return $this->morphTo();
    }
}

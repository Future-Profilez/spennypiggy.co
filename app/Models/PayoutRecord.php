<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PayoutRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'creator_id',
        'payout_run_id',
        'stripe_payout_id',
        'amount_minor',
        'currency',
        'status',
        'arrival_date',
        'failure_code',
        'failure_message',
        'metadata',
    ];

    protected $casts = [
        'arrival_date' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid');
    }

    public function payoutRun()
    {
        return $this->belongsTo(PayoutRun::class);
    }
}

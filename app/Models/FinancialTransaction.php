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
        'currency',
        'status',
        'description',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StripeWebhookStatus extends Model
{
    use HasFactory;

    public $table = 'stripe_webhook_status';

    protected $fillable = [
        'data',
        'event_id',
        'event_type',
        'status',
        'processed_at',
        'last_error',
        'subscription_id',
        'invoice_type',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];
}

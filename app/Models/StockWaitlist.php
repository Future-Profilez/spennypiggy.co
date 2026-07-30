<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Somebody waiting for a sold-out shop item to come back.
 *
 * Written only by StockWaitlistService. `notified_at` doubles as the state and the
 * claim: once set the entry is spent, so nobody is nagged on every future restock.
 */
class StockWaitlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'creator_id',
        'user_id',
        'email',
        'notified_at',
        'notified_stock',
    ];

    protected $casts = [
        'notified_at' => 'datetime',
        'notified_stock' => 'integer',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Still waiting to be told. */
    public function scopeWaiting($query)
    {
        return $query->whereNull('notified_at');
    }

    /** Where the notice goes. The account email wins over the typed one. */
    public function recipientEmail(): ?string
    {
        return $this->user?->email ?: ($this->email ?: null);
    }
}

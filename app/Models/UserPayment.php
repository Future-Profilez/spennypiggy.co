<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'product_type',
        'amount',
        'currency',
        'payment_method',
        'payment_details',
        'paid_at',
        'status',
    ];
    protected $casts = [
        'from_user_id' => 'integer',
        'to_user_id' => 'integer',
        'amount' => 'integer',
        'paid_at' => 'datetime',
    ];
    protected $table = 'user_payments';

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    // Optional: filtered accessor
    public function getFromUserIfActiveAttribute()
    {
        return $this->fromUser()->where('profile_status_lock', 0)->where('role', 0)->first();
    }


    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConnectedAccountCustomer extends Model
{
    use HasFactory;

    protected $table = 'connected_account_customers';

    protected $fillable = [
        'user_id',
        'creator_id',
        'connected_account_id',
        'stripe_customer_id',
        'product_type',
        'product_id',
        'price_id',
        'is_active',
        'currency',
    ];
    protected $hidden = [
        'created_at',
        'updated_at',
    ];
    protected $casts = [
        'is_active' => 'boolean',
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id')->where('suspended_account', 0);
    }
}

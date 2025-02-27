<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOrderDetail extends Model
{
    use HasFactory, HasUuids;

    public function uniqueIds()
    {
        return ['uuid'];
    }

    protected $fillable = ['user_id', 'creater_id', 'cart_id', 'order_id', 'details', 'payment_status','session_id'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creater_id');
    }
}

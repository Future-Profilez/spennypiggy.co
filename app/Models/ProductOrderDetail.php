<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOrderDetail extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'creater_id', 'cart_id', 'order_id', 'details', 'payment_status'];
}

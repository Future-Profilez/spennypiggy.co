<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RyeProduct extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    public function uniqueIds()
    {
        return ['uuid'];
    }

    protected $fillable = [
        'stripe_product_id',
        'creator_id',
        'user_id',
        'product_id',
        'details',
        'deleted_at',
    ];
}

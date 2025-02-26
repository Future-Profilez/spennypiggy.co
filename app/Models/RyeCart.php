<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RyeCart extends Model
{
    use HasFactory, HasUuids;

    public function uniqueIds()
    {
        return ['uuid'];
    }

    protected $fillable = ['user_id', 'creator_id', 'cart_id', 'cart_details'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GifterCardVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'currency',
        'status',
        'payment_details',
        'payment_method'
    ];
    protected $casts = [
        'payment_details' => 'array',
    ];
    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

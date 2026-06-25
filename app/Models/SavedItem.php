<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedItem extends Model
{
    use HasFactory;

    public const TYPES = ['wish', 'shop', 'membership', 'bill', 'piggypot', 'task'];

    protected $fillable = [
        'user_id',
        'product_type',
        'item_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

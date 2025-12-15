<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchClick extends Model
{
    use HasFactory;

    protected $table = 'search_clicks';

    protected $fillable = [
        'creator_id',
        'user_id',
        'ip_address',
        'user_agent',
        'referer',
    ];

    protected $casts = [
        'creator_id' => 'integer',
        'user_id' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}


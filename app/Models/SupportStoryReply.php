<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportStoryReply extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'gifter_id',
        'event_type',
        'source',
        'source_id',
        'user_id',
        'message',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportStoryReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'gifter_id',
        'event_type',
        'source',
        'source_id',
        'emoji',
        'user_id',
    ];
}

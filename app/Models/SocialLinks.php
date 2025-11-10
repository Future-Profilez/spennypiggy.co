<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialLinks extends Model
{
    use HasFactory, SoftDeletes;
    protected $dates = ['deleted_at'];
    protected $fillable = [
        'uuid',
        'user_id',
        'whoyouinto',
        'twitter',
        'instagram',
        'facebook',
        'youtube',
        'twitch',
        'tumblr',
        'reddit',
        'discord',
        'onlyfans',
        'loyalfans',
        'fansly',
        'manyvids',
        'other',
        'deleted_at'
    ];

    protected $hidden   =   [
        'id',
        'uuid',
        'user_id',
        'created_at',
        'updated_at',
        'deleted_at'
    ];
}

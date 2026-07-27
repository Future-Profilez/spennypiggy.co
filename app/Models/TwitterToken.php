<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class TwitterToken extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'twitter_id',
        'username',
        'token',
        'secret',
        'refresh_token',
        'expires_at',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'token',
        'secret',
        'refresh_token',
        'created_at',
        'deleted_at',
        'updated_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($t) => $t->uuid = Uuid::uuid4());
    }
}

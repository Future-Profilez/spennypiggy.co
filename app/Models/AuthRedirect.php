<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class AuthRedirect extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'country',
        'origin',
        'target',
        'ip_address',
        'user_agent',
        'query_string',
        'used_at',
    ];

    protected $casts = [
        'user_at' => 'datetime',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($a) => $a->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

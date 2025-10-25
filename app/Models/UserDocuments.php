<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserDocuments extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'doc_type',
        'front',
        'back'
    ];

    protected $hidden = [
        'id',
        'created_at',
        'updated_at'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = \Ramsey\Uuid\Uuid::uuid4());
    }
}

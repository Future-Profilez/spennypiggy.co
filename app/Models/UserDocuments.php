<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class UserDocuments extends Model
{
    use HasFactory,SoftDeletes;

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
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }
}

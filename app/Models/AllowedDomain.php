<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class AllowedDomain extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'uuid'];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($model) => $model->uuid = Uuid::uuid4());
    }
}

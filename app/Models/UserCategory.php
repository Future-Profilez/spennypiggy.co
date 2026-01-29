<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\InvalidatesUserCache;

class UserCategory extends Model
{
    use HasFactory,  SoftDeletes, InvalidatesUserCache;
    protected $dates = ['deleted_at'];
    protected $fillable = [
        "user_id",
        "category",
        'deleted_at',
    ];

    protected $hidden   =   [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

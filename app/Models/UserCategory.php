<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserCategory extends Model
{
    use HasFactory,  SoftDeletes;
    protected $dates = ['deleted_at'];
    protected $fillable = [
        "user_id",
        "category",
        'deleted_at',
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

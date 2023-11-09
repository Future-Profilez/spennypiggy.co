<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class UserCategory extends Model {
    use HasFactory;

    protected $fillable = [
        "user_id",
        "category",
    ];

    public static function boot(){
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }


    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }

}
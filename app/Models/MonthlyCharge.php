<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class MonthlyCharge extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable =   [
        'uuid',
        'stripe_id',
        'session_id',
        'user_id',
        'name',
        'email',
        'currency',
        'amount',
        'tax',
        'end',
        'upcoming_payment',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($s) =>  $s->uuid = Uuid::uuid4());
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class MembershipPayment extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'uuid',
        'stripe_id',
        'session_id',
        'membership_id',
        'user_id',
        'guest_email',
        'guest_name',
        'currency',
        'amount',
        'tax',
        'recurring_for',
        'recurring_type',
        'message',
        'anonymous',
        'end',
        'upcoming_payment',
        'status',
        'twitter_response'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }


    public function membership(){
        return $this->belongsTo(Membership::class);
    }

    public function user(){
        return $this->belongsTo(User::class);
    }
}

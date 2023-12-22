<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class TipGoalsPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'session_id',
        'tip_goal_id',
        'user_id',
        'guest_name',
        'guest_email',
        'currency',
        'amount',
        'tax',
        'message',
        'status',
    ];

    protected $hidden = [
        'id',
        'uuid',
        'user_id',
        'tip_goal_id',
        'session_id',
        'currency',
        'created_at',
        'updated_at',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($s) =>  $s->uuid = Uuid::uuid4());
    }


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }


    public function tipGoal()
    {
        return $this->belongsTo(TipGoal::class, 'tip_goal_id');
    }
}

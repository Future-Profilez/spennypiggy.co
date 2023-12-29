<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
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
        'user_id',
        'tip_goal_id',
        'session_id',
        'created_at',
        'updated_at',
    ];

    protected $appends = [
        'sender'
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


    public function getSenderAttribute()
    {
        $sender = false;
        if (Auth::check()) {
            $sender = $this->tipGoal->user_id == Auth::id() ? false : true;
        }
        return $sender;
    }
}

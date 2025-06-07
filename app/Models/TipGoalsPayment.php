<?php

namespace App\Models;

use App\Helpers;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class  TipGoalsPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'session_id',
        'tip_goal_id',
        'user_id',
        'creator_id',
        'guest_name',
        'guest_email',
        'currency',
        'amount',
        'tax',
        'message',
        'anonymous',
        'twitter_response',
        'status',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'tip_goal_id',
        'session_id',
        // 'currency',
        // 'created_at',
        'updated_at',
    ];

    protected $appends = [
        'sender',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($s) =>  $s->uuid = Uuid::uuid4());
    }


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('is_uk', 0);
    }


    public function tipGoal()
    {
        return $this->belongsTo(TipGoal::class, 'tip_goal_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id')->where('is_uk', 0);
    }

    public function getSenderAttribute()
    {
        $sender = false;
        if (isset($this->creator_id)) {
            if (Auth::check() && $this->creator_id != Auth::id()) {
                $sender = true;
            }
        }
        return $sender;
    }
}

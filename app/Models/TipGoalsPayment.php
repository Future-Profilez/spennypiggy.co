<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipGoalsPayment extends Model
{
    use HasFactory;


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


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }


    public function tipGoal()
    {
        return $this->belongsTo(TipGoal::class, 'tip_goal_id');
    }
}

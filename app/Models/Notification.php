<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'notifiable_id',
        'notifiable_type',
        'notification',
        'is_read'
    ];

    protected $hidden = [
        'id',
        'user_id',
        'notifiable_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];


    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }

    public function notifiable(){
        return $this->belongsTo(User::class,'notifiable_id');
    }
}

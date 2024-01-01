<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Logs extends Model
{
    use HasFactory;
    protected $fillable = [
        'remove_wish_id',
        'edited_wish_id',
        'deleted_user_id',
        'suspended_user_id',
        'message',
        'created_at',
        'updated_at'
    ];
}

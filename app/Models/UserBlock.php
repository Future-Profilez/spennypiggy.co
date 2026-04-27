<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'blocked_id',
        'reason',
    ];

    /**
     * The creator who blocked the user.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * The user who is blocked.
     */
    public function blockedUser()
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }
}

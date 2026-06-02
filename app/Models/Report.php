<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_name',
        'reporter_email',
        'reported_url',
        'reported_user_id',
        'reason',
        'status',
        'admin_notes',
        'good_faith_confirmed',
    ];

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }
}

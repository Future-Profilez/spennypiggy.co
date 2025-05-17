<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserVerificationStatus extends Model
{
    use HasFactory;

    protected $table = 'user_verification_status';

    protected $fillable = [
        'user_id',
        'role',
        'bio_status',
        'social_status',
        'address_status',
        'user_profile_status',
        'address_verification_error',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0)->where('is_uk', 0);
    }
}

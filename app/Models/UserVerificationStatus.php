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
        'address_verification_error',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];
}

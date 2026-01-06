<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReferralCode extends Model
{
    use HasFactory;

    protected $table = 'referral_codes';

    protected $fillable = [
        'creator_id',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /* ================= RELATIONSHIPS ================= */

    // Creator who owns the referral code
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    // All referrals made using this code
    public function referrals()
    {
        return $this->hasMany(CreatorReferral::class, 'referral_code_id');
    }
}

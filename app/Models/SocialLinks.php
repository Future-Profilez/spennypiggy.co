<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialLinks extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'uuid',
        'user_id',
        'whoyouinto',
        'twitter',
        'instagram',
        'facebook',
        'youtube',
        'twitch',
        'tumblr',
        'reddit',
        'discord',
        'onlyfans',
        'loyalfans',
        'fansly',
        'manyvids',
        'other',
        'status',
        // ⚠️ `reason` was missing here while `saveSocialLinks()` passes
        // `'reason' => null` on every save, so mass assignment silently dropped it
        // and a previous admin rejection reason survived the re-save — the profile
        // then showed a stale rejection next to a pending status. The admin app's
        // copy of this model has always carried it; the two had drifted.
        'reason',
        'deleted_at',
    ];

    protected $hidden = [
        'id',
        'uuid',
        'user_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Get the user that owns the social links.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

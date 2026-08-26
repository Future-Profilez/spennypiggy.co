<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialLinks extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];

    /**
     * The platforms a creator may verify against (client decision, 11 Aug 2026).
     *
     * 🚨 The ONE definition — the controller, the form and the tests all read it.
     * The accepted list used to be written out by hand in the controller and had
     * grown to thirteen, while the public documentation said three; that gap is
     * exactly what this constant exists to close.
     *
     * ⚠️ The remaining columns below are NOT removed. Creators verified on them
     * before the narrowing keep their approved handles, and their profiles keep
     * rendering them — this list governs what can be SUBMITTED, not what exists.
     */
    public const ACCEPTED_PLATFORMS = [
        'twitter',
        'instagram',
        'tiktok',
    ];

    protected $fillable = [
        'uuid',
        'user_id',
        'whoyouinto',
        // Where the handle came from — 'signup' (contact data, kept out of the admin
        // review queue) or NULL (submitted from Creator Studio, i.e. offered for the
        // public profile). See the 2026_08_25_120000 migration.
        'source',
        'twitter',
        'instagram',
        'tiktok',
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

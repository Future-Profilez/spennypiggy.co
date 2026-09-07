<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CrmCreator extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'crm_creators';

    protected $fillable = [
        'user_id',
        'full_name',
        'username',
        'email',
        'twitter',
        'instagram',
        'tiktok',
        'youtube',
        'twitch',
        'website',
        'current_platform',
        'creator_category',
        'estimated_monthly_value',
        'estimated_monthly_earnings',
        'follower_count',
        'assigned_team_member_id',
        'last_contact_date',
        'next_follow_up_date',
        'notes',
        'crm_stage',
        'invite_token',
        'invite_token_used_at',
        'social_match_suggested_at',
        'social_match_suggested_user_id',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        // Outreach columns are OWNED and WRITTEN by the admin app (cold-outreach
        // sequences). Cast here so the unsubscribe route reads them typed; never
        // $fillable — this app only ever writes them via forceFill on that one route.
        'outreach_meta' => 'array',
        'do_not_contact_at' => 'datetime',
        'bounced_at' => 'datetime',
        'last_outreach_at' => 'datetime',
        'last_contact_date' => 'datetime',
        'next_follow_up_date' => 'datetime',
        'invite_token_used_at' => 'datetime',
        'social_match_suggested_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTeamMember()
    {
        return $this->belongsTo(Admin::class, 'assigned_team_member_id');
    }

    public function suggestedUser()
    {
        return $this->belongsTo(User::class, 'social_match_suggested_user_id');
    }

    public function stageHistory()
    {
        return $this->hasMany(CrmCreatorStageHistory::class, 'crm_creator_id');
    }

    public function activities()
    {
        return $this->hasMany(CrmCreatorActivity::class, 'crm_creator_id');
    }
}

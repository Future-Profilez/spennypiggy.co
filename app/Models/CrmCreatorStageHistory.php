<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmCreatorStageHistory extends Model
{
    use HasFactory;

    protected $table = 'crm_creator_stage_histories';

    protected $fillable = [
        'crm_creator_id',
        'from_stage',
        'to_stage',
        'trigger_source',
        'triggered_by',
        'notes',
    ];

    public function crmCreator()
    {
        return $this->belongsTo(CrmCreator::class, 'crm_creator_id');
    }

    public function triggeredByAdmin()
    {
        return $this->belongsTo(Admin::class, 'triggered_by');
    }
}


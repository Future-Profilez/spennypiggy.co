<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmCreatorActivity extends Model
{
    use HasFactory;

    protected $table = 'crm_creator_activities';

    protected $fillable = [
        'crm_creator_id',
        'activity_type',
        'description',
        'activity_date',
        'created_by',
    ];

    protected $casts = [
        'activity_date' => 'datetime',
    ];

    public function crmCreator()
    {
        return $this->belongsTo(CrmCreator::class, 'crm_creator_id');
    }

    public function createdByAdmin()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
}

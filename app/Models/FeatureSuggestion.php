<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeatureSuggestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'suggestion',
        'image_url',
        'image_uuid',
        'status',
        'admin_notes',
    ];

    const STATUSES = ['pending', 'accepted', 'under_review', 'planned', 'rejected'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

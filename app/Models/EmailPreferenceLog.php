<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailPreferenceLog extends Model
{
    use HasFactory;

    protected $table = 'email_preference_logs';

    protected $fillable = [
        'user_id',
        'old_value',
        'new_value',
        'source',
    ];

    protected $casts = [
        'old_value' => 'boolean',
        'new_value' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

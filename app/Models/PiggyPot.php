<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class PiggyPot extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'payment_methods_accepted',
        'uuid',
        'user_id',
        'title',
        'description',
        'target_amount',
        'currency',
        'cover_media',
        'content_file',
        'content_description',
        'deadline',
        'is_pinned',
        'enable_leaderboard',
        'allow_anonymous',
        'status',
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'is_pinned' => 'boolean',
        'enable_leaderboard' => 'boolean',
        'allow_anonymous' => 'boolean',
    ];

    public static function boot()
    {
        parent::boot();
        // Cast to string — a Ramsey UUID object breaks same-request array
        // lookups keyed by uuid (same bug already fixed on User).
        static::creating(fn ($model) => $model->uuid = (string) Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contributions()
    {
        return $this->hasMany(PiggyPotContribution::class, 'piggy_pot_id');
    }
}

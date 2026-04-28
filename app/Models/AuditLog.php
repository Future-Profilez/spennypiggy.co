<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'actor',
        'action_type',
        'reference_id',
        'metadata_json',
    ];

    protected $casts = [
        'metadata_json' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
            if (!$model->created_at) {
                $model->created_at = now();
            }
        });
    }
    
    // Helper methods
    public function getActorType(): string
    {
        return explode(':', $this->actor)[0] ?? 'unknown';
    }
    
    public function getActorId(): ?string
    {
        $parts = explode(':', $this->actor);
        return $parts[1] ?? null;
    }
    
    public function isUserAction(): bool
    {
        return str_starts_with($this->actor, 'user:');
    }
    
    public function isAdminAction(): bool
    {
        return str_starts_with($this->actor, 'admin:');
    }
    
    public function isSystemAction(): bool
    {
        return $this->actor === 'system';
    }
    
    public function getMetadata(string $key = null)
    {
        if ($key === null) {
            return $this->metadata_json;
        }
        return $this->metadata_json[$key] ?? null;
    }
}

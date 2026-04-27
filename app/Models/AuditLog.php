<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'id';
    
    protected $table = 'audit_logs';
    
    protected $fillable = [
        'id',
        'actor',
        'action_type',
        'reference_id',
        'metadata_json',
        'created_at',
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'metadata_json' => 'array',
        'created_at' => 'datetime',
    ];
    
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
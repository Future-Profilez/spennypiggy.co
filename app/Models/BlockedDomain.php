<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

/**
 * A domain nobody may register with.
 *
 * Read through `App\Support\EmailDomainPolicy` — never queried directly at a
 * call site, so the block, the mail-server check and the override cannot be
 * applied in different orders on different screens.
 */
class BlockedDomain extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'note', 'uuid'];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->uuid = $model->uuid ?: (string) Uuid::uuid4();
            $model->name = strtolower(trim((string) $model->name));
        });

        static::updating(function ($model) {
            $model->name = strtolower(trim((string) $model->name));
        });
    }
}

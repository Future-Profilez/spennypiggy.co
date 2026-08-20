<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

/**
 * One listing a creator has chosen to sell from their bio page.
 *
 * 🚨 A SELECTION, NOT A COPY OF THE LISTING. See the migration: this row holds a
 * type and an id, and every word, price and picture on the rendered card comes
 * from the live listing. Never add a title, price or image column here — the
 * bio page would then be able to advertise a price the checkout does not charge.
 *
 * ⚠️ There is no polymorphic relation, deliberately. `item_type` is a
 * `CatalogueRegistry` key (`piggy_pot`, `bill`, …), not a class name, and it is
 * the same vocabulary the catalogue screen, the funnels and the ledger already
 * use. A `morphTo` would need a second parallel map from key to class and would
 * eager-load six models' accessors — the documented per-row query trap.
 */
class CreatorBioItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'item_type',
        'item_id',
        'sort_order',
        'is_active',
        'click_count',
        'last_clicked_at',
    ];

    protected $casts = [
        'item_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'click_count' => 'integer',
        'last_clicked_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $row) {
            if (empty($row->uuid)) {
                // Cast to string — a Ramsey object in a route parameter
                // serialises as an object rather than its value.
                $row->uuid = (string) Uuid::uuid4();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** The key the render payload and the editor both index on. */
    public function catalogueKey(): string
    {
        return $this->item_type.':'.$this->item_id;
    }
}

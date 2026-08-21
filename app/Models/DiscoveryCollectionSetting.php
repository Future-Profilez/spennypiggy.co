<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Which Discovery collections are switched on. See the migration for why a
 * MISSING ROW MEANS ENABLED.
 *
 * 🚨 SHARED TABLE, TWO WRITERS — but only one of them should be writing.
 * The ADMIN app owns the switch (it has the audit trail and the roles); this app
 * only READS it, in `CollectionService`. A write from here would be a way to
 * change what the platform shows with no admin, no reason and no record.
 */
class DiscoveryCollectionSetting extends Model
{
    protected $table = 'discovery_collection_settings';

    protected $fillable = [
        'collection_key',
        'is_enabled',
        'sort_order',
        'note',
        'updated_by_admin_id',
        'updated_by_name',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'sort_order' => 'integer',
    ];
}

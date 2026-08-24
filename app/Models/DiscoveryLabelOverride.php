<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A Discovery marketing label forced to COMING SOON without a deploy.
 * See the migration for why this can only ever turn a label OFF.
 *
 * 🚨 THE ADMIN APP OWNS THE WRITE. This app only reads it, in
 * `DiscoveryPayload`. A write from here would be a way to change what three
 * public marketing pages claim, with no admin, no reason and no record.
 */
class DiscoveryLabelOverride extends Model
{
    protected $table = 'discovery_label_overrides';

    protected $fillable = ['label_key', 'note', 'created_by_admin_id', 'created_by_name'];
}

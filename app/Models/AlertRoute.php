<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One channel's recipients, for one environment.
 *
 * 🚨 SHARED TABLE, TWO READERS, ONE WRITER. The rows are owned and edited by
 * admin.spennypiggy.co (System → Alert Routing); spennypiggy.co only reads them
 * through `App\Support\AlertRouter`. Keep this model in step by hand in both
 * apps — shared database, separate code.
 *
 * `environment` is 'production' or 'non_production', the same two buckets
 * `AlertEnvironment` and config/alerts.php already split on.
 */
class AlertRoute extends Model
{
    protected $table = 'alert_routes';

    /*
     * 🚨 NO `$fillable`, DELIBERATELY. This app READS the routing; the admin
     * panel writes it. A website code path able to mass-assign these columns is
     * a route by which a request re-aims the platform's own security and fraud
     * alerts — the same rule the shared-DB consent and journey columns follow.
     */

    protected $casts = [
        'emails' => 'array',
        'roles' => 'array',
        'enabled' => 'boolean',
    ];
}

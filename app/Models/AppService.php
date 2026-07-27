<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppService extends Model
{
    use HasFactory;

    public static $statuses = [
        'Error',
        'Running',
        'Stopped',
    ];

    protected $fillable = [
        'slug',
        'name',
    ];

    protected $hidden = [
        'id',
        'created_at',
        'updated_at',
        'status',
        'last_error_at',
        'last_error',
    ];

    protected $casts = [
        'last_error_at' => 'datetime',
    ];

    protected $appends = [
        'state',
        'issue_at',
        'error',
    ];

    public function getStateAttribute()
    {
        return static::$statuses[$this->status] ?? 'Unknown';
    }

    public function getIssueAtAttribute()
    {
        return empty($this->last_error_at) ? null : $this->last_error_at->format('h:i:s a d-m-Y');
    }

    public function getErrorAttribute()
    {
        return $this->last_error;
    }

    /**
     * Get Service Status
     *
     * @param  $service  Service Slug
     * @return bool
     */
    public static function getStatus($service)
    {
        $s = static::firstWhere('slug', $service);
        if (isset($s->status)) {
            return $s->status === 1;
        }

        return false;
    }

    /**
     * Set Service Status
     *
     * @param  $service  Service Slug
     * @param  $status  Status of service
     * @param  $error  Error Message if any
     * @return void
     */
    public static function setStatus($service, $status = 1, $error = null)
    {
        $s = static::firstWhere('slug', $service);
        if ($s) {
            $s->status = $status;
            if (! empty($error)) {
                $s->last_error = $error;
            }
            if ($status == 0) {
                $s->last_error_at = Carbon::now();
            }
            $s->save();
        }
    }
}

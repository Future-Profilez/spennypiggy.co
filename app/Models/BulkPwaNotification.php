<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BulkPwaNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'body',
        'creator_id',
        'users_count',
        'user_ids',
        'created_at',
    ];

    protected $hidden = ['updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    protected $casts = [
        'user_ids' => 'array',
    ];

    protected function createdAt(): Attribute
    {
        return Attribute::get(function ($value) {
            return Carbon::parse($value)->format('d M Y');
        });
    }
}

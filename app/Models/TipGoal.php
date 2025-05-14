<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class TipGoal extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        "uuid",
        "user_id",
        'name',
        "target",
        "default_price",
        'fullfilled',
        'description',
        'status',
        'days',
        'completed',
        'completed_at',
        'tax_amount',
        'currency',
        'price_id',
        'product_id'
    ];


    protected $hidden = [
        'id',
        'user_id',
        'price_id',
        'completed_at',
        'product_id',
        'created_at',
        'updated_at',
    ];

    protected $appends = [
        'complete_at'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('is_uk', 0);
    }

    public function getCompleteAtAttribute()
    {
        if (!empty($this->completed_at)) {
            return Carbon::createFromFormat('Y-m-d H:i:s', $this->completed_at)->isoFormat('DD MMM YYYY');
        }

        return false;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class ShopPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'session_id',
        'amount',
        'tax_amount',
        'vat_tax_amount',
        'currency',
        'shop_id',
        'user_id',
        'name',
        'email',
        'message',
        'anonymous',
        'answer',
        'payment_status',
        'twitter_response',
        'quantity',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
    ];


    protected $hidden = [
        'id',
        'user_id',
        'shop_id',
        'updated_at',
        'deleted_at',
    ];

    protected $appends = [
        'sender',
    ];


    public static function boot()
    {
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }

    public function getSenderAttribute()
    {
        $sender = false;
        if (isset($this->user_id)) {
            if (Auth::check() && $this->user_id == Auth::id()) {
                $sender = true;
            }
        }
        return $sender;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('is_uk', 0);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }
}

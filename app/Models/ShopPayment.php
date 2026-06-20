<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;
use App\Models\Deliverable;

class ShopPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'session_id',
        'amount',
        'total_paid',
        'tax_amount',
        'vat_tax_amount',
        'shipping_amount',
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
        'shipping_info',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
        'creator_note',
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
        return $this->belongsTo(User::class, 'user_id');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }

    public function deliverable()
    {
        return $this->hasOne(Deliverable::class, 'session_id', 'session_id');
    }

    public function financialTransaction()
    {
        return $this->morphOne(FinancialTransaction::class, 'source');
    }
}

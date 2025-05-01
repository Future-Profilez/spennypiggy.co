<?php

namespace App\Models;

use App\Helpers;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class BillPayment extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'uuid',
        'stripe_id',
        'session_id',
        'user_id',
        'bills_id',
        'guest_name',
        'guest_email',
        'amount',
        'currency',
        'recurring_for',
        'tax',
        'vat_tax_amount',
        'recurring_type',
        'message',
        'anonymous',
        'status',
        'twitter_response',
        'end',
        'upcoming_payment',
    ];

    protected $appends = [
        'sender',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }

    public function bill(){
        return $this->belongsTo(Bills::class,'bills_id');
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

}

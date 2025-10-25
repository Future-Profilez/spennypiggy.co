<?php

namespace App\Models;

use App\Helpers;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class MembershipPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'stripe_id',
        'session_id',
        'iban',
        'sort_code',
        'membership_id',
        'user_id',
        'guest_email',
        'guest_name',
        'currency',
        'amount',
        'tax',
        'vat_tax_amount',
        'recurring_for',
        'recurring_type',
        'payment_method',
        'message',
        'anonymous',
        'end',
        'upcoming_payment',
        'status',
        'twitter_response',
        'payout_at',
    ];

    protected $appends = [
        'sender',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }


    public function membership()
    {
        return $this->belongsTo(Membership::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class)->where('is_uk', 0);
    }
    
    public function deliverables()
    {
        return $this->hasMany(Deliverable::class, 'gifter_id', 'user_id')
                    ->where('product_type', 'membership')
                    ->whereRaw('JSON_EXTRACT(metadata, "$.membership_id") = ?', [$this->membership_id]);
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

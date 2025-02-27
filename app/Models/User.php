<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Uploadcare;
use App\WatermarkHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $dates = ['deleted_at'];

    protected $fillable = [
        'uuid',
        '2fa_key',
        'name',
        'email',
        'role',
        'username',
        'country',
        'gender',
        'password',
        'uuid',
        'deleted_at',
        'creator_category',
        'identity_status',
        'identity_verified_at',
        'identity_verification_error',
        'identity_verification_details',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($u) => $u->uuid = Uuid::uuid4());
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'created_at',
        'account_id',
        'created_at',
        'updated_at',
        'deleted_at',
        'stripe_id',
        // 'stripe_details_submitted'
    ];


    protected $appends = [
        'avatar_url',
        'cover_url',
        'twitter_username',
        'monthly_charge_enabled',
        'is_creator_address_found',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];



    public function getAvatarUrlAttribute()
    {
        $url = false;
        if (!empty($this->avatar)) {
            if ($this->avatar_approved == 0) {
                if (Auth::check() && Auth::id() == $this->id) {
                    if (empty($this->avatar_cdn_modifier)) {
                        $url = "https://ucarecdn.com/" . $this->avatar . '/-/format/jpeg/';
                    } else {
                        $url = "https://ucarecdn.com/" . $this->avatar . '/' . $this->avatar_cdn_modifier . '-/preview/';
                    }
                }
            } else {
                if (empty($this->avatar_cdn_modifier)) {
                    $url = "https://ucarecdn.com/" . $this->avatar . '/-/format/jpeg/';
                } else {
                    $url = "https://ucarecdn.com/" . $this->avatar . '/' . $this->avatar_cdn_modifier . '-/preview/';
                }
            }
        }
        return $url;
    }


    public function getCoverUrlAttribute()
    {
        $url = false;
        if (!empty($this->cover)) {
            if ($this->cover_approved == 0) {
                if (Auth::check() && Auth::id() == $this->id) {
                    if (empty($this->cover_cdn_modifier)) {
                        $url = "https://ucarecdn.com/" . $this->cover . '/';
                    } else {
                        $url = "https://ucarecdn.com/" . $this->cover . '/' . $this->cover_cdn_modifier . '-/preview/';
                    }
                }
            } else {
                if (empty($this->cover_cdn_modifier)) {
                    $url = "https://ucarecdn.com/" . $this->cover . '/';
                } else {
                    $url = "https://ucarecdn.com/" . $this->cover . '/' . $this->cover_cdn_modifier . '-/preview/';
                }
            }
        }
        return $url;
    }

    public function stripePaymentDetails()
    {
        return $this->hasMany(StripePaymentDetail::class, 'owner_id');
    }

    public function wishItems()
    {
        return $this->hasMany(WishItem::class, 'user_id');
        // return $this->hasManyThrough(WishItem::class, UserCategory::class, 'user_id', 'user_id', 'id', 'id');
    }

    public function user_categories()
    {
        return $this->hasMany(UserCategory::class, 'user_id');
    }

    public function user_shop_categories()
    {
        return $this->hasMany(UserShopCategories::class, 'user_id');
    }

    public function paymentitems()
    {
        return $this->hasManyThrough(
            StripePaymentItems::class,
            StripePaymentDetail::class,
            'owner_id',
            'stripe_payment_detail_id',
            'id',
            'id'
        );
    }

    public function tip_goal_payment()
    {
        return $this->hasMany(TipGoalsPayment::class, 'creator_id');
    }


    public function subscriptions()
    {
        return $this->hasManyThrough(WishItemSubscription::class, WishItem::class, 'user_id', 'wish_item_id', 'id', 'id');
    }


    public function membership_payments()
    {
        return $this->hasManyThrough(MembershipPayment::class, Membership::class, 'user_id', 'membership_id', 'id', 'id');
    }

    public function bill_payments()
    {
        return $this->hasManyThrough(BillPayment::class, Bills::class, 'user_id', 'bills_id', 'id', 'id');
    }

    public function twitter_token()
    {
        return $this->hasOne(TwitterToken::class)->latestOfMany();
    }

    public function getTwitterUsernameAttribute()
    {
        return $this->twitter_token->username ?? false;
    }

    public function social_links()
    {
        return $this->hasOne(SocialLinks::class, 'user_id');
    }


    public function memberships()
    {
        return $this->hasMany(Membership::class, 'user_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    public function bills()
    {
        return $this->hasMany(Bills::class, 'user_id');
    }

    public function getDefaultCurrencyAttribute($value)
    {
        return strtoupper($value);
    }

    public function getMonthlyChargeEnabledAttribute()
    {
        if (Auth::check() && $this->id == Auth::id()) {
            $charge = MonthlyCharge::where('user_id', $this->id)->where('status', 'paid')->first();
            if (!empty($charge)) {
                return true;
            }
            return false;
        }
        return false;
    }


    public function intro()
    {
        return $this->hasOne(UserIntro::class, 'user_id');
    }

    public function shop()
    {
        return $this->hasMany(Shop::class, 'user_id');
    }

    public function shop_payments()
    {
        return $this->hasManyThrough(ShopPayment::class, Shop::class, 'user_id', 'shop_id', 'id', 'id');
    }

    // Accessor method to check if the creator has an address
    public function getIsCreatorAddressFoundAttribute(): bool
    {
        return $this->creatorShippingAddress()->exists();
    }

    // Define the relationship separately in the model
    public function creatorShippingAddress()
    {
        return $this->hasOne(CreatorShippingAddress::class, 'creator_id', 'id');
    }
}

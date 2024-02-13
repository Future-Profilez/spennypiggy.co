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
        'name',
        'email',
        'username',
        'password',
        'gender',
        'uuid',
        'deleted_at',
        'suspended_account',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($u) => $u->uuid = Uuid::uuid4());
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
        'twitter_username'
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

            if(empty($this->avatar_cdn_modifier)){
                $url = "https://ucarecdn.com/" . $this->avatar . '/';
            }
            else{
                $url = "https://ucarecdn.com/" . $this->avatar . '/' . $this->avatar_cdn_modifier . '-/preview/';
            }

        }
        return $url;
    }


    public function getCoverUrlAttribute()
    {
        $url = false;
        if (!empty($this->cover)) {
            if(empty($this->cover_cdn_modifier)){
                $url = "https://ucarecdn.com/" . $this->cover . '/';
            }
            else{
                $url = "https://ucarecdn.com/" . $this->cover . '/' . $this->cover_cdn_modifier . '-/preview/';
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
        return $this->hasManyThrough(TipGoalsPayment::class, TipGoal::class, 'user_id', 'tip_goal_id', 'id', 'id');
    }

    public function subscriptions()
    {
        return $this->hasManyThrough(WishItemSubscription::class, WishItem::class, 'user_id', 'wish_item_id', 'id', 'id');
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

    public function memberships(){
        return $this->hasMany(Membership::class, 'user_id');
    }

    public function bills(){
        return $this->hasMany(Bills::class, 'user_id');
    }


    public function getDefaultCurrencyAttribute($value){
        return strtoupper($value);
    }
}

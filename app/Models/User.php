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
        'name',
        'email',
        'role',
        'username',
        'password',
        'gender',
        'uuid',
        'deleted_at',
        'suspended_account',
        'creator_category'
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
            if($this->avatar_approved == 0){
                if(Auth::check() && Auth::id() == $this->id){
                    if(empty($this->avatar_cdn_modifier)){
                        $url = "https://ucarecdn.com/" . $this->avatar . '/-/format/jpeg/';
                    }
                    else{
                        $url = "https://ucarecdn.com/" . $this->avatar . '/' . $this->avatar_cdn_modifier . '-/preview/';
                    }
                }
            }
            else{
                if(empty($this->avatar_cdn_modifier)){
                    $url = "https://ucarecdn.com/" . $this->avatar . '/-/format/jpeg/';
                }
                else{
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
            if($this->cover_approved == 0){
                if(Auth::check() && Auth::id() == $this->id){
                    if(empty($this->cover_cdn_modifier)){
                        $url = "https://ucarecdn.com/" . $this->cover . '/';
                    }
                    else{
                        $url = "https://ucarecdn.com/" . $this->cover . '/' . $this->cover_cdn_modifier . '-/preview/';
                    }
                }
            }
            else{
                if(empty($this->cover_cdn_modifier)){
                    $url = "https://ucarecdn.com/" . $this->cover . '/';
                }
                else{
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

    public function memberships(){
        return $this->hasMany(Membership::class, 'user_id');
    }

    public function posts(){
        return $this->hasMany(Post::class, 'user_id');
    }

    public function bills(){
        return $this->hasMany(Bills::class, 'user_id');
    }


    public function getDefaultCurrencyAttribute($value){
        return strtoupper($value);
    }
}

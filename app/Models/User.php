<?php

namespace App\Models;

use App\Traits\CacheableModel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use Stripe\Subscription;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes, CacheableModel;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'uuid', '2fa_key', 'name', 'email', 'role', 'username', 'country', 'bio', 'bio_approved',
        'gender', 'password', 'deleted_at', 'creator_category', 'identity_status',
        'identity_verified_at', 'identity_verification_error', 'identity_verification_details',
        'ip_address', 'profile_status_lock', 'profile_reject_reason', 'is_500_limit_exceeded',
        'is_subscribed',
    ];

    protected $hidden = [
        'password', 'remember_token', 'created_at', 'account_id',
        'updated_at', 'deleted_at', 'stripe_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = [
        'avatar_url', 'cover_url', 'twitter_username', 
        'monthly_charge_enabled', 'is_creator_address_found','followers_count','following_count',
        'subscription_status',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($u) => $u->uuid = Uuid::uuid4());
    }

    // ───────────────────────
    // Accessors
    // ───────────────────────

    public function getAvatarUrlAttribute()
    {
        if (!$this->avatar) return false;

        $modifier = $this->avatar_cdn_modifier
            ? "{$this->avatar_cdn_modifier}-/preview/"
            : "-/format/jpeg/";

        return "https://ucarecdn.com/{$this->avatar}/{$modifier}";
    }

    public function getCoverUrlAttribute()
    {
        if (!$this->cover) return false;

        $modifier = $this->cover_cdn_modifier
            ? "{$this->cover_cdn_modifier}-/preview/"
            : '';

        return "https://ucarecdn.com/{$this->cover}/{$modifier}";
    }

    public function getDefaultCurrencyAttribute($value)
    {
        return strtoupper($value);
    }

    public function getTwitterUsernameAttribute()
    {
        return $this->twitter_token->username ?? false;
    }

    public function getMonthlyChargeEnabledAttribute()
    {
        if (Auth::check() && $this->id === Auth::id()) {
            return MonthlyCharge::where('user_id', $this->id)
                ->whereIn('status', ['paid', 'trialing', 'active'])
                ->exists();
        }
        return false;
    }
     

    public function getIsCreatorAddressFoundAttribute(): bool {
        return $this->creatorShippingAddress()->exists();
    }

    public function getSubscriptionStatusAttribute()
    {
        if ($this->role == 1) { 
            $subscription = $this->creatorMonthlySubscription;
            Log::info('Subscription status check for user ID ' . $this->id . ': ' . json_encode($subscription));
            if (!$subscription) {
                return 0;
            }
            if ($subscription->status === 'trial_ending') {
                return 2;
            }

            if ($subscription->status === 'paid' || $subscription->status === 'paid' || $subscription->status === 'trialing') {
                if (!isset($subscription->stripe_id) || empty($subscription->stripe_id)) {
                    return 1; 
                }
                try {
                    Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
                    $stripeSubscription = Subscription::retrieve($subscription->stripe_id);
                    
                    if (isset($stripeSubscription) && $stripeSubscription->status === 'active') {
                        return 1;
                    } elseif (isset($stripeSubscription) && $stripeSubscription->status === 'trialing') {
                        return 2;
                    } else {
                        return 0; // canceled, incomplete, etc.
                    }
                } catch (\Exception $e) {
                    Log::error('Stripe subscription check failed: ' . $e->getMessage());
                    return 1;
                }
            }
            return 0;
        }

        if ($this->role == 0) { // Gifter
            return $this->gifterCardVerification ? 1 : 0;
        }
        return 'Unknown';
    }




    // ───────────────────────
    // Scopes
    // ───────────────────────

    public function scopeActive($query)
    {
        return $query->where('approved', 1)->whereNull('deleted_at');
    }

    // ───────────────────────
    // Relationships
    // ───────────────────────

    public function social_links()
    {
        return $this->hasOne(SocialLinks::class, 'user_id');
    }

    public function wishItems()
    {
        return $this->hasMany(WishItem::class, 'user_id');
    }

    public function user_categories()
    {
        return $this->hasMany(UserCategory::class, 'user_id');
    }

    public function user_shop_categories()
    {
        return $this->hasMany(UserShopCategories::class, 'user_id');
    }

    public function stripePaymentDetails()
    {
        return $this->hasMany(StripePaymentDetail::class, 'owner_id');
    }

    public function tip_goal_payment()
    {
        return $this->hasMany(TipGoalsPayment::class, 'creator_id');
    }

    public function subscriptions()
    {
        return $this->hasManyThrough(WishItemSubscription::class, WishItem::class, 'user_id', 'wish_item_id');
    }

    public function membership_payments()
    {
        return $this->hasManyThrough(MembershipPayment::class, Membership::class, 'user_id', 'membership_id');
    }

    public function bill_payments()
    {
        return $this->hasManyThrough(BillPayment::class, Bills::class, 'user_id', 'bills_id');
    }

    public function twitter_token()
    {
        return $this->hasOne(TwitterToken::class)->latestOfMany();
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
        return $this->hasManyThrough(ShopPayment::class, Shop::class, 'user_id', 'shop_id');
    }

    public function creatorShippingAddress()
    {
        return $this->hasOne(CreatorShippingAddress::class, 'creator_id', 'id');
    }

    public function gifterCardVerification()
    {
        return $this->hasOne(GifterCardVerification::class, 'user_id');
    }

    public function creatorMonthlySubscription()
    {
        return $this->hasOne(MonthlyCharge::class, 'user_id');
    }

 public function followers()
{
    return $this->hasMany(Follow::class, 'followed_id');
}

public function following()
{
    return $this->hasMany(Follow::class, 'follower_id');
}


public function getFollowersCountAttribute()
{
    return $this->followers()->count();
}

public function getFollowingCountAttribute()
{
    return $this->following()->count();
}




    public function paymentitems()
    {
        return $this->hasManyThrough(
            StripePaymentItems::class,
            StripePaymentDetail::class,
            'owner_id', 'stripe_payment_detail_id'
        );
    }

    // Optional: inverse relationships (for eager loading)
    public function referredPosts()
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    public function referredMemberships()
    {
        return $this->hasMany(Membership::class, 'user_id');
    }

    public function referredBills()
    {
        return $this->hasMany(Bills::class, 'user_id');
    }

    // ───────────────────────
    // Performance Optimizations
    // ───────────────────────

    /**
     * Define common relationships for eager loading
     */
    protected function getCommonRelations(): array
    {
        return [
            'social_links',
            'user_categories',
            'twitter_token',
            'creatorShippingAddress'
        ];
    }

    /**
     * Define optimized columns for queries
     */
    protected function getOptimizedColumns(): array
    {
        return [
            'id', 'uuid', 'username', 'name', 'email', 'avatar', 'cover',
            'bio', 'country', 'default_currency', 'approved', 'created_at'
        ];
    }

    /**
     * Get user with cached wish items count
     */
    public function getCachedWishItemsCount()
    {
        return $this->rememberComputation('wish_items_count', function () {
            return $this->wishItems()->count();
        });
    }

    /**
     * Get user with cached followers count
     */
    public function getCachedFollowersCount()
    {
        return $this->rememberComputation('followers_count', function () {
            return $this->followers()->count();
        });
    }

    /**
     * Scope for users with recent activity
     */
    public function scopeWithRecentActivity($query, int $days = 30)
    {
        return $query->where(function ($q) use ($days) {
            $q->whereHas('wishItems', function ($wishQuery) use ($days) {
                $wishQuery->where('created_at', '>=', now()->subDays($days));
            })
            ->orWhereHas('posts', function ($postQuery) use ($days) {
                $postQuery->where('created_at', '>=', now()->subDays($days));
            });
        });
    }

    /**
     * Scope for popular users (with caching)
     */
    public function scopePopular($query, int $limit = 10)
    {
        $cacheKey = "popular_users_{$limit}";
        
        return Cache::remember($cacheKey, 3600, function () use ($query, $limit) {
            return $query
                ->withCount(['wishItems', 'followers'])
                ->orderByDesc('wish_items_count')
                ->orderByDesc('followers_count')
                ->limit($limit)
                ->get();
        });
    }
}

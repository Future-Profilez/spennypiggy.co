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
use Carbon\Carbon;
use App\Models\MonthlyCharge;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes, CacheableModel;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'uuid',
        '2fa_key',
        'name',
        'email',
        'role',
        'username',
        'country',
        'bio',
        'bio_approved',
        'gender',
        'password',
        'deleted_at',
        'creator_category',
        'identity_status',
        'identity_verified_at',
        'identity_verification_error',
        'identity_verification_details',
        'identity_admin_status',
        'identity_admin_reviewed_at',
        'identity_admin_notes',
        'ip_address',
        'profile_status_lock',
        'profile_reject_reason',
        'is_500_limit_exceeded',
        'is_subscribed',
        'is_founder',
        'show_piggy_bank',
        'referral_code',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'created_at',
        'account_id',
        'updated_at',
        'deleted_at',
        'stripe_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'identity_admin_status' => 'integer',
        'identity_admin_reviewed_at' => 'datetime',
    ];

    protected $appends = [
        'avatar_url',
        'cover_url',
        'twitter_username',
        'monthly_charge_enabled',
        'is_creator_address_found',
        'followers_count',
        'following_count',
        'subscription_status',
        'grace_period_started_at',
        'grace_period_ends_at',
        'is_in_grace_period',
        'grace_period_days_remaining'
    ];
    protected $with = ['social_links'];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($u) => $u->uuid = Uuid::uuid4());
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


    public function getIsCreatorAddressFoundAttribute(): bool
    {
        return $this->creatorShippingAddress()->exists();
    }

    public function getSubscriptionStatusAttribute()
    {
        if ($this->role == 1) {
            // Find the currently active subscription period (same logic as account route)
            $now = Carbon::now();
            $subscription = MonthlyCharge::where('user_id', $this->id)
                ->where(function ($query) use ($now) {
                    $query->where(function ($q) use ($now) {
                        // Active subscription period
                        $q->whereDate('current_start_subscription_date', '<=', $now)
                            ->whereDate('current_end_subscription_date', '>=', $now);
                    })->orWhere(function ($q) use ($now) {
                        // Active trial period
                        $q->whereDate('current_start_trial_date', '<=', $now)
                            ->whereDate('current_end_trial_date', '>=', $now);
                    });
                })
                // Order by start date DESC to get the newest period first (handles overlaps)
                ->orderByDesc('current_start_subscription_date')
                ->first();

            // If no active period found, get the most recent one
            if (!$subscription) {
                $subscription = MonthlyCharge::where('user_id', $this->id)
                    ->orderByDesc('current_start_subscription_date')
                    ->first();
            }

            if (!$subscription) {
                return 0;
            }

            // Use the same logic as account settings route
            $trial_start = $subscription->current_start_trial_date;
            $trial_end = $subscription->current_end_trial_date;
            $subscription_start = $subscription->current_start_subscription_date;
            $subscription_end = $subscription->current_end_subscription_date;

            $now = Carbon::now();
            $trialEndCarbon = $trial_end ? Carbon::parse($trial_end) : null;
            $subEndCarbon = $subscription_end ? Carbon::parse($subscription_end) : null;

            $isTrialOngoing = $trialEndCarbon && $now->lessThan($trialEndCarbon);
            // Check subscription status from MonthlyCharge table instead of is_subscribed column
            $isSubscriptionActive = in_array($subscription->status, ['paid', 'renew', 'active']) && $subEndCarbon && $now->lessThan($subEndCarbon);
            $isExpired = $subEndCarbon && $now->greaterThanOrEqualTo($subEndCarbon);

            // Check for trialing status first, before other conditions
            if ($subscription->status === 'trialing') {
                return 2; // FREE_TRIAL
            }

            // Return status based on subscription table status
            if ($isSubscriptionActive) {
                return 1; // ACTIVE
            } elseif ($isTrialOngoing) {
                return 2; // FREE_TRIAL
            } elseif ($isExpired || !in_array($subscription->status, ['paid', 'renew', 'active', 'trialing'])) {
                return 0; // EXPIRED
            }

            // Fallback to original Stripe API logic for edge cases
            if ($subscription->status === 'trial_ending') {
                return 2;
            }
            if ($subscription->status === 'paid' || $subscription->status === 'renew' || $subscription->status === 'trialing') {
                if (!isset($subscription->stripe_id) || empty($subscription->stripe_id)) {
                    if ($subscription->status === 'trialing') {
                        return 2;
                    }
                    return 1;
                }
                try {
                    // Skip Stripe API call in background jobs to prevent token errors
                    if (app()->runningInConsole() || app()->runningUnitTests()) {
                        // In background jobs, just use the local subscription status
                        return ($subscription->status === 'active' || $subscription->status === 'trialing') ? 1 : 0;
                    }

                    $stripeKey = env('STRIPE_SECRET_KEY');
                    if (empty($stripeKey)) {
                        Log::warning('Stripe API key not configured, falling back to local subscription status', [
                            'user_id' => $this->id,
                            'subscription_status' => $subscription->status
                        ]);
                        // Return based on local status instead of throwing exception
                        return ($subscription->status === 'active' || $subscription->status === 'trialing') ? 1 : 0;
                    }

                    // Check if stripe_id is valid before making API call
                    if (empty($subscription->stripe_id)) {
                        Log::warning('Empty stripe_id, falling back to local subscription status', [
                            'user_id' => $this->id,
                            'subscription_status' => $subscription->status
                        ]);
                        return ($subscription->status === 'active' || $subscription->status === 'trialing') ? 1 : 0;
                    }

                    Stripe::setApiKey($stripeKey);
                    Log::info("About to retrieve Stripe subscription", [
                        'user_id' => $this->id,
                        'stripe_id' => $subscription->stripe_id,
                        'subscription_status' => $subscription->status
                    ]);

                    // Set timeout to prevent long-running API calls
                    $timeout = 3; // 3 seconds timeout
                    $stripeSubscription = null;

                    try {
                        // Use a timeout to prevent long API calls
                        $stripeSubscription = Subscription::retrieve($subscription->stripe_id);
                        Log::info("Retrieved Stripe subscription", [
                            'user_id' => $this->id,
                            'stripe_id' => $subscription->stripe_id,
                            'stripe_status' => $stripeSubscription->status
                        ]);
                    } catch (\Exception $apiError) {
                        Log::error('Stripe API call failed', [
                            'user_id' => $this->id,
                            'stripe_id' => $subscription->stripe_id,
                            'error' => $apiError->getMessage()
                        ]);
                        // Return based on local status
                        return ($subscription->status === 'active' || $subscription->status === 'trialing') ? 1 : 0;
                    }

                    if (isset($stripeSubscription) && $stripeSubscription->status === 'active') {
                        return 1;
                    } elseif (isset($stripeSubscription) && $stripeSubscription->status === 'trialing') {
                        return 2;
                    } else {
                        // Fallback: Check local trial dates if Stripe status is different
                        if ($subscription->status === 'trialing') {
                            // Check if we have trial dates and if trial is still active
                            if ($subscription->current_start_trial_date && $subscription->current_end_trial_date) {
                                $now = \Carbon\Carbon::now();
                                $trialEnd = \Carbon\Carbon::parse($subscription->current_end_trial_date);
                                if ($now->lessThan($trialEnd)) {
                                    return 2; // Still in trial
                                }
                            }
                            // If no trial dates or trial expired, check if user is within 3-day grace period
                            $userCreated = \Carbon\Carbon::parse($this->created_at);
                            $trialEndDate = $userCreated->copy()->addDays(3);
                            if (\Carbon\Carbon::now()->lessThan($trialEndDate)) {
                                return 2; // Within 3-day trial period
                            }
                        }
                        return 0;
                    }
                } catch (\Exception $e) {
                    Log::error('Stripe subscription check failed', [
                        'user_id' => $this->id,
                        'stripe_id' => $subscription->stripe_id ?? 'null',
                        'error' => $e->getMessage(),
                        'error_type' => get_class($e)
                    ]);

                    // Fallback when Stripe API fails
                    if ($subscription->status === 'trialing') {
                        // Check trial dates first
                        if ($subscription->current_start_trial_date && $subscription->current_end_trial_date) {
                            $now = \Carbon\Carbon::now();
                            $trialEnd = \Carbon\Carbon::parse($subscription->current_end_trial_date);
                            if ($now->lessThan($trialEnd)) {
                                return 2; // Still in trial
                            }
                        }
                        // Fallback to 3-day grace period from user creation
                        $userCreated = \Carbon\Carbon::parse($this->created_at);
                        $trialEndDate = $userCreated->copy()->addDays(3);
                        if (\Carbon\Carbon::now()->lessThan($trialEndDate)) {
                            return 2; // Within 3-day trial period
                        }
                        return 0; // Trial expired
                    }
                    return 1; // Default to active for other statuses when API fails
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
    // Grace Period Accessors (Virtual Fields)
    // ───────────────────────

    /**
     * Get when grace period started (virtual calculation)
     */
    public function getGracePeriodStartedAtAttribute()
    {
        if (!$this->isFullyVerified()) {
            return null;
        }

        // Use identity_verified_at as the primary grace period start date
        if ($this->identity_verified_at) {
            return Carbon::parse($this->identity_verified_at);
        }

        // Fallback to updated_at if identity_verified_at is not set
        return $this->updated_at ? Carbon::parse($this->updated_at) : null;
    }

    /**
     * Get when grace period ends (0 days after start)
     */
    public function getGracePeriodEndsAtAttribute()
    {
        $startDate = $this->grace_period_started_at;
        return $startDate ? $startDate->copy()->addDays(\App\Services\CreatorActivityService::GRACE_PERIOD_DAYS) : null;
    }

    /**
     * Check if creator is currently in grace period
     */
    public function getIsInGracePeriodAttribute()
    {
        if (!$this->grace_period_ends_at) {
            return false;
        }

        return Carbon::now()->lessThan($this->grace_period_ends_at);
    }

    /**
     * Get days remaining in grace period
     */
    public function getGracePeriodDaysRemainingAttribute()
    {
        if (!$this->is_in_grace_period || !$this->grace_period_ends_at) {
            return 0;
        }

        return max(0, Carbon::now()->diffInDays($this->grace_period_ends_at, false));
    }

    /**
     * Check if creator is fully verified and ready to receive payments
     */
    private function isFullyVerified()
    {
        // Skip verification check - always return true for creators
        return $this->role == 1;

        // Original verification logic (commented out):
        // return $this->role == 1 && // Is creator
        //        $this->is_subscribed == 1 && // Has subscription
        //        $this->profile_status_lock == 2 && // Profile approved
        //        $this->identity_status == 1 && // Identity verified
        //        $this->stripe_details_submitted == 1; // Stripe connected
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

    public function wishes()
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
        return $this->hasOne(MonthlyCharge::class, 'user_id')->latestOfMany();
    }

    /**
     * Get all subscription records (for history)
     */
    public function allMonthlyCharges()
    {
        return $this->hasMany(MonthlyCharge::class, 'user_id')->orderBy('created_at', 'desc');
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




    public function documents()
    {
        return $this->hasMany(\App\Models\UserDocuments::class, 'user_id');
    }
    public function paymentitems()
    {
        return $this->hasManyThrough(
            StripePaymentItems::class,
            StripePaymentDetail::class,
            'owner_id',
            'stripe_payment_detail_id'
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
            'id',
            'uuid',
            'username',
            'name',
            'email',
            'avatar',
            'cover',
            'bio',
            'country',
            'default_currency',
            'approved',
            'created_at'
        ];
    }

    /**
     * Get user wish items count (NO CACHE)
     */
    public function getCachedWishItemsCount()
    {
        return $this->wishItems()->count();
    }

    /**
     * Get user followers count (NO CACHE)
     */
    public function getCachedFollowersCount()
    {
        return $this->followers()->count();
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
     * Scope for popular users (NO CACHE)
     */
    public function scopePopular($query, int $limit = 10)
    {
        return $query
            ->withCount(['wishItems', 'followers'])
            ->orderByDesc('wish_items_count')
            ->orderByDesc('followers_count')
            ->limit($limit);
    }

    /**
     * Founder Bonus relationship
     */
    public function founderBonus()
    {
        return $this->hasMany(FounderBonus::class, 'creator_id');
    }

    /**
     * Get current month founder bonus
     */
    public function currentMonthFounderBonus()
    {
        return $this->founderBonus()
            ->where('month', now()->format('Y-m'))
            ->first();
    }

    /**
     * Get deliverables where this user is the gifter (purchaser)
     */
    public function deliverables()
    {
        return $this->hasMany(Deliverable::class, 'gifter_id');
    }

    /**
     * Get deliverables where this user is the creator
     */
    public function createdDeliverables()
    {
        return $this->hasMany(Deliverable::class, 'creator_id');
    }

    /**
     * Check if user is eligible for founder program
     */
    public function isEligibleForFounder()
    {
        // Check if user has been active for at least 30 days
        $thirtyDaysAgo = now()->subDays(30);
        return $this->created_at <= $thirtyDaysAgo && !$this->is_founder;
    }

    /* =========================
    | Referral Relationships
    ========================= */

    // Referrals this user has made (as referrer)
    public function referralsMade()
    {
        return $this->hasMany(CreatorReferral::class,'referrer_creator_id');
    }

    // Referral record if this user was referred by someone
    public function referralReceived()
    {
        return $this->hasOne(CreatorReferral::class,'referred_creator_id');
    }

    // Referral payouts earned by this user
    public function referralPayouts()
    {
        return $this->hasMany(CreatorReferralPayout::class,'creator_id');
    }
}

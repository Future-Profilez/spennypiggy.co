<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;
use Stripe\Subscription;
use Carbon\Carbon;
use App\Models\MonthlyCharge;
use Laragear\WebAuthn\Contracts\WebAuthnAuthenticatable;
use Laragear\WebAuthn\WebAuthnAuthentication;

class User extends Authenticatable implements WebAuthnAuthenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, WebAuthnAuthentication;

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
        'default_currency',
        'terms_accepted_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
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
        'terms_accepted_at' => 'datetime',
    ];

    protected $appends = [
        'avatar_url',
        'cover_url',
        'twitter_username',
        'is_creator_address_found',
        'followers_count',
        'following_count',
        'subscription_status',
        'is_site_subscription_active',
        'display_subscription_status',
        'grace_period_started_at',
        'grace_period_ends_at',
        'is_in_grace_period',
        'grace_period_days_remaining',
        'social_url',
        'upcoming_payment_date',
        'subscription_end',
        'is_subscription_cancelled',
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

    public function getBioAttribute($value)
    {
        if ($this->bio_approved != 1 && (!Auth::check() || Auth::id() !== $this->id)) {
            return null;
        }
        return $value;
    }

    public function getAvatarUrlAttribute()
    {
        if ($this->avatar_approved != 1 && (!Auth::check() || Auth::id() !== $this->id)) {
            return "https://ucarecdn.com/2c6afc02-8ae1-4e8b-8f53-d71f6066dd77/-/preview/600x600/";
        }

        if (!$this->avatar) return "https://ucarecdn.com/2c6afc02-8ae1-4e8b-8f53-d71f6066dd77/-/preview/600x600/";

        $modifier = $this->avatar_cdn_modifier
            ? "{$this->avatar_cdn_modifier}-/preview/"
            : "-/format/jpeg/";

        return "https://ucarecdn.com/{$this->avatar}/{$modifier}";
    }

    public function getSocialUrlAttribute()
    {
        if (!$this->social_image) return false;
        $modifier = "-/format/jpeg/";
        return "https://ucarecdn.com/{$this->social_image}/{$modifier}";
    }

    public function getCoverUrlAttribute()
    {
        if ($this->cover_approved != 1 && (!Auth::check() || Auth::id() !== $this->id)) {
            return false;
        }

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
        // 1. Check for active subscription period in MonthlyCharge table
        // We look through all charges to find one that is CURRENTLY active.
        // We prioritize ACTIVE > FREE_TRIAL > EXPIRED.
        $allCharges = $this->allMonthlyCharges()
            ->whereIn('status', ['paid', 'active', 'renew', 'trialing', 'canceled'])
            ->get();

        $nowDate = Carbon::now();
        $hasExpiredRecord = false;

        foreach ($allCharges as $charge) {
            // Check if within paid period (including canceled but not yet expired)
            if (in_array($charge->status, ['paid', 'active', 'renew', 'canceled'])) {
                $startDate = $charge->current_start_subscription_date ? Carbon::parse($charge->current_start_subscription_date)->startOfDay() : null;
                $endDate = $charge->current_end_subscription_date ? Carbon::parse($charge->current_end_subscription_date)->endOfDay() : null;
                
                if ($startDate && $endDate) {
                    if ($nowDate->between($startDate, $endDate)) {
                        return 1; // ACTIVE
                    }
                    if ($nowDate->greaterThan($endDate)) {
                        $hasExpiredRecord = true;
                    }
                }
            }

            // Check if within trial period
            if ($charge->status === 'trialing') {
                $trialStart = $charge->current_start_trial_date ? Carbon::parse($charge->current_start_trial_date)->startOfDay() : null;
                $trialEnd = $charge->current_end_trial_date ? Carbon::parse($charge->current_end_trial_date)->endOfDay() : null;

                if ($trialStart && $trialEnd) {
                    if ($nowDate->between($trialStart, $trialEnd)) {
                        return 2; // FREE_TRIAL
                    }
                    if ($nowDate->greaterThan($trialEnd)) {
                        $hasExpiredRecord = true;
                    }
                }
            }
        }

        // If we found any expired record but no active ones, return EXPIRED
        if ($hasExpiredRecord) {
            return 0; // EXPIRED
        }

        // 2. Fallback: If is_subscribed is 1, be lenient to allow payments
        // This handles cases where dates might be slightly off or sync is pending
        if ($this->is_subscribed) {
            // Try to find any valid-looking record even if dates are missing/off
            $latestValid = $allCharges->first();
            if ($latestValid && !in_array($latestValid->status, ['failed', 'canceled', 'unpaid'])) {
                if ($latestValid->status === 'trialing') return 2;
                return 1; // Assume active
            }
            
            // If is_subscribed is 1 but no records found, still return 1 to allow payment
            return 1; 
        }

        return 3; // INACTIVE
    }

    /**
     * Check if site subscription is active (either status 1 or 2)
     */
    public function getIsSiteSubscriptionActiveAttribute()
    {
        $status = $this->subscription_status;
        return ($status === 1 || $status === 2) ? 1 : 0;
    }

    /**
     * Get a unified subscription status for display purposes
     */
    public function getDisplaySubscriptionStatusAttribute()
    {
        $status = $this->subscription_status;
        
        if ($status === 1) return 'Active';
        if ($status === 2) return 'Free Trial';
        
        return 'Inactive';
    }

    /**
     * Get the next upcoming payment date for the subscription
     */
    public function getUpcomingPaymentDateAttribute()
    {
        $latest = $this->allMonthlyCharges()
            ->whereNotNull('upcoming_payment')
            ->first();

        return $latest ? $latest->upcoming_payment->format('d M Y') : null;
    }

    /**
     * Get the current subscription end date
     */
    public function getSubscriptionEndAttribute()
    {
        $latest = $this->allMonthlyCharges()
            ->whereIn('status', ['paid', 'active', 'renew', 'trialing', 'canceled'])
            ->first();

        if ($latest) {
            $date = $latest->current_end_subscription_date ?? $latest->current_end_trial_date;
            return $date ? $date->format('d M Y') : null;
        }

        return null;
    }

    /**
     * Check if the auto-renewal is cancelled
     */
    public function getIsSubscriptionCancelledAttribute()
    {
        // Unset the relation to ensure we're not using a cached version of the charges
        $this->unsetRelation('allMonthlyCharges');
        
        $latest = $this->allMonthlyCharges()
            ->whereIn('status', ['paid', 'active', 'renew', 'trialing', 'canceled'])
            ->first();

        if (!$latest) return false;

        // Force a fresh check of the actual status in the database
        $latest->refresh();

        $isCancelled = $latest->status === 'canceled' || 
                       $latest->upcoming_payment === null || 
                       $latest->cancelled_at !== null;

        if (app()->environment('local')) {
            \Log::debug("User {$this->id} is_subscription_cancelled check", [
                'charge_id' => $latest->id,
                'stripe_id' => $latest->stripe_id,
                'status' => $latest->status,
                'upcoming' => $latest->upcoming_payment,
                'cancelled_at' => $latest->cancelled_at,
                'result' => $isCancelled
            ]);
        }

        return $isCancelled;
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
        // Require all verification steps to be completed for creators
        return $this->role == 1 && // Is creator
               $this->is_subscribed == 1 && // Has subscription
               $this->profile_status_lock == 2 && // Profile approved
               $this->identity_status == 1 && // Identity verified
               $this->stripe_details_submitted == 1; // Stripe connected
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
        return $this->hasMany(MonthlyCharge::class, 'user_id')
            ->orderByRaw('COALESCE(current_end_subscription_date, current_end_trial_date, created_at) DESC');
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

    public function blockedUsers()
    {
        return $this->hasMany(UserBlock::class, 'creator_id');
    }

    public function blockedBy()
    {
        return $this->hasMany(UserBlock::class, 'blocked_id');
    }

    public function isBlockedBy($creatorId)
    {
        return $this->blockedBy()->where('creator_id', $creatorId)->exists();
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

    public function tasks()
    {
        return $this->hasMany(Task::class, 'creator_id');
    }

    public function searchClicks()
    {
        return $this->hasMany(SearchClick::class, 'creator_id');
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
        return $this->hasMany(CreatorReferral::class, 'referrer_creator_id');
    }

    // Referral record if this user was referred by someone
    public function referralReceived()
    {
        return $this->hasOne(CreatorReferral::class, 'referred_creator_id');
    }

    // Referral payouts earned by this user
    public function referralPayouts()
    {
        return $this->hasMany(CreatorReferralPayout::class, 'creator_id');
    }

    // Referral code owned by creator
    public function referralCode()
    {
        return $this->hasOne(ReferralCode::class, 'creator_id');
    }

    /**
     * Get the merchant of record consents for the user
     */
    public function morConsents()
    {
        return $this->hasMany(MorConsent::class);
    }

    /**
     * Get the latest merchant of record consent
     */
    public function latestMorConsent()
    {
        return $this->hasOne(MorConsent::class)->latest('consent_given_at');
    }

    /**
     * Check if user has given MoR consent
     */
    public function hasGivenMorConsent(): bool
    {
        return $this->morConsents()->where('consent_given', true)->exists();
    }

    public function financialTransactions()
    {
        return $this->hasMany(FinancialTransaction::class);
    }

    public function financialProfile()
    {
        return $this->hasOne(CreatorFinancialProfile::class);
    }

    /**
     * Get the creator metric record associated with the user.
     */
    public function metric()
    {
        return $this->hasOne(CreatorMetric::class, 'creator_id', 'uuid');
    }
}

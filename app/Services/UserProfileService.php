<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\MonthlyCharge;
use App\Models\Notification;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\Post;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\Task;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use App\Support\MediaUrl;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Invoice;
use Stripe\Subscription;

class UserProfileService
{
    /** Per-request memo of creator id => watermark uuid (see stampWatermark). */
    private array $watermarkUuids = [];

    /**
     * Get user with optimized relationships
     */
    public function getUserWithRelations(string $username): ?User
    {
        $callback = function () use ($username) {
            // Direct DB query
            $userId = User::where('username', $username)->value('id');

            if (! $userId) {
                return null;
            }

            return User::select([
                'id',
                'name',
                'uuid',
                'username',
                'email',
                'role',
                'bio',
                'bio_approved',
                'avatar',
                'avatar_approved',
                'avatar_cdn_modifier',
                'cover',
                'cover_approved',
                'cover_cdn_modifier',
                'suspended_account',
                'social_image',
                'account_id',
                'stripe_details_submitted',
                'default_currency',
                'country',
                'creator_category',
                // ⚠️ Pride badges ARE public — a badge is worn to be seen, and
                // the creator opted in by picking one. What they must never
                // reach is a meta tag, an OpenGraph card, a share caption, an
                // ad audience or a Stripe payload; that is enforced at those
                // surfaces (see App\Support\Badges) rather than by hiding the
                // column here. An unselected column is null, which would read
                // as "never picked" and silently blank the creator's own badges.
                'pride_badges',
                'identity_status',
                // The badge tier is derived from these; an admin rejection of
                // the identity check outranks Stripe's pass, and a suspended
                // account carries no badge at all. See App\Support\VerifiedBadge.
                'identity_admin_status',
                'edit_bio_reason',
                'profile_status_lock',
                'is_subscribed',
                'is_founder',
                'show_piggy_bank',
                'created_at',
                'vat_amount_percentage',
            ])
                ->with([
                    'social_links:id,user_id,instagram,twitter,twitch,facebook,youtube,tumblr,reddit,discord,other,status,reason',
                    'user_categories:id,user_id,category,created_at',
                    // Include uuid so perma_link accessor can build a playable URL
                    'intro:id,user_id,uuid,poster,poster_token,height,width,approved,created_at',
                ])
                ->where('username', $username)
                ->first();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_profile_basic_'.$username, 600, $callback);
    }

    /**
     * Get ALL profile data in single optimized request for faster loading
     */
    public function getAllProfileData(int $userId, ?int $categoryId = null): array
    {
        $page = request()->route() ? (request()->route()->parameter('page') ?? 'about') : 'about';

        $cacheKey = 'profile_all_data_'.$userId.'_'.($categoryId ?? 'all').'_page_'.$page.'_'.$this->getProfileCacheVersion($userId);
        $isOwner = Auth::check() && Auth::id() === $userId;

        // If not owner, we can cache this whole block for a few minutes
        if (! $isOwner) {
            return Cache::remember($cacheKey, 300, function () use ($userId, $categoryId) {
                return $this->fetchRawProfileData($userId, $categoryId, false);
            });
        }

        return $this->fetchRawProfileData($userId, $categoryId, true);
    }

    /**
     * Internal helper to fetch all profile sections
     * We limit the number of items fetched here to keep initial load fast
     */
    private function fetchRawProfileData(int $userId, ?int $categoryId, bool $isOwner): array
    {
        $data = [];
        // Only load the first few items for initial dashboard load
        // But if we are on 'about' page, we shouldn't even fetch these
        $page = request()->route() ? (request()->route()->parameter('page') ?? 'about') : 'about';

        if ($page !== 'about') {
            $data['wishes'] = $this->getOptimizedWishItems($userId, $categoryId, $isOwner, 8);
            $data['memberships'] = $this->getOptimizedMemberships($userId, $isOwner, 4);
            $data['bills'] = $this->getOptimizedBills($userId, $isOwner, 4);
            $data['shops'] = $this->getOptimizedShopItems($userId, $isOwner, 8);
            $data['tasks'] = $this->getOptimizedTasks($userId, $isOwner, 6);
        } else {
            $data['wishes'] = [];
            $data['memberships'] = [];
            $data['bills'] = [];
            $data['shops'] = [];
            $data['tasks'] = [];
        }

        $data['posts'] = $this->getOptimizedPosts($userId, $isOwner, 5);

        return $data;
    }

    /**
     * Get tasks optimized for profile display
     */
    public function getOptimizedTasks(int $userId, bool $isOwner, ?int $limit = null): array
    {
        $query = Task::where('creator_id', $userId);

        // ⚠️ The owner sees their own scheduled listings — they manage this page, and a
        // listing that silently vanished until launch day would read as lost work. The
        // public sees only what is on sale.
        if ($isOwner) {
            $query->withoutGlobalScope('published');
        }
        if (! $isOwner) {
            $query->where('status', 'active')->where('is_approved', 1)->where('is_suspended', 0);
        }
        $query = $query->select(['id', 'uuid', 'title', 'description', 'price', 'currency', 'type', 'status', 'media_url', 'category', 'created_at', 'sla_hours', 'is_approved', 'reason', 'is_suspended', 'suspend_reason', 'reward_title', 'reward_type', 'reward_description', 'publish_at'])
            ->latest();

        $cacheKey = 'user_tasks_optimized_'.$userId.'_'.($limit ?? 'all').'_'.($isOwner ? 'owner' : 'public').'_'.$this->getProfileCacheVersion($userId);

        return Cache::remember($cacheKey, 600, function () use ($query, $limit) {
            if ($limit) {
                $query->limit($limit);
            }

            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized wish items with minimal data
     */
    private function getOptimizedWishItems(int $userId, ?int $categoryId, bool $isOwner, int $limit = 20): array
    {
        $columns = [
            'id',
            'user_id',
            'uuid',
            'wishname',
            'reward_title',
            'reward_type',
            'reward_description',
            'price',
            'currency',
            'thumbnail',
            'is_approved',
            'sort',
            'created_at',
            'subscription',
            'fullfill_amount',
            'edited_reason',
            'tax_amount',
            'is_suspended',
            'suspend_reason',
            'goal_label',
            'publish_at',
        ];

        // ⚠️ The owner edits a wish straight from their own card, and the edit
        // form patches whatever it sends — a column absent from this payload
        // loads as an empty field and is written back empty. `reward_body` is
        // the paid deliverable of a message/link reward, so it is OWNER ONLY
        // (the model hides it; HasRewardContract reveals it to the owner).
        if ($isOwner) {
            $columns = array_merge($columns, [
                'reward_body',
                'item_url',
                'content_file',
                'content_file_name',
                'content_file_type',
                'content_file_size',
                'subscription_period',
                'repeat_purchase',
                'ai_generated',
                'reward',
            ]);
        }

        $query = WishItem::select($columns)
            ->with('user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn())
            ->where('user_id', $userId);

        if (! $isOwner) {
            $query->where('is_approved', 1)->where('is_suspended', 0);
        } else {
            // See getOptimizedTasks — the owner sees their own scheduled listings.
            $query->withoutGlobalScope('published');
        }

        if ($categoryId && $categoryId !== 'all') {
            $query->whereHas('categories', fn ($q) => $q->where('user_category_id', $categoryId));
        }

        $cacheKey = 'user_wishes_optimized_'.$userId.'_'.($categoryId ?? 'all').'_'.$limit.'_'.($isOwner ? 'owner' : 'public').'_'.$this->getProfileCacheVersion($userId);

        return Cache::remember($cacheKey, 600, function () use ($query, $limit) {
            return $query->orderBy('sort')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }

    /**
     * Get optimized memberships
     */
    private function getOptimizedMemberships(int $userId, bool $isOwner, ?int $limit = null): array
    {
        $query = Membership::select([
            'id',
            'user_id',
            'uuid',
            'name',
            'level',
            'reward_title',
            'reward_type',
            'reward_description',
            'price',
            'currency',
            'thumbnail',
            'approved',
            'created_at',
            'is_suspended',
            'suspend_reason',
            'publish_at',
        ])->with('user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn())
            ->where('user_id', $userId);

        if (! $isOwner) {
            $query->where('approved', 1)->where('is_suspended', 0);
        } else {
            // See getOptimizedTasks — the owner sees their own scheduled listings.
            $query->withoutGlobalScope('published');
        }

        $cacheKey = 'user_memberships_optimized_'.$userId.'_'.($limit ?? 'all').'_'.($isOwner ? 'owner' : 'public').'_'.$this->getProfileCacheVersion($userId);

        return Cache::remember($cacheKey, 600, function () use ($query, $limit) {
            $query = $query->latest();
            if ($limit) {
                $query->limit($limit);
            }

            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized bills
     */
    private function getOptimizedBills(int $userId, bool $isOwner, ?int $limit = null): array
    {
        $columns = [
            'id',
            'user_id',
            'uuid',
            'name',
            'reward_title',
            'reward_type',
            'reward_description',
            'price',
            'currency',
            'period',
            'thumbnail',
            'approved',
            'created_at',
            'is_suspended',
            'suspend_reason',
            'goal_label',
            'publish_at',
        ];

        // ⚠️ The owner edits a bill straight from their own card, and the edit
        // form sends the whole reward object back — a column absent here loads
        // empty, and `billEdit` then either refuses the save (a file/message
        // reward is required) or writes the empty value. `reward_body` is the
        // paid deliverable of a message/link reward, so it is OWNER ONLY.
        if ($isOwner) {
            $columns = array_merge($columns, [
                'reward_body',
                'content_file',
                'content_file_name',
                'content_file_type',
                'content_file_size',
            ]);
        }

        $query = Bills::select($columns)
            ->with('user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn())
            ->where('user_id', $userId);

        if (! $isOwner) {
            $query->where('approved', 1)->where('is_suspended', 0);
        } else {
            // See getOptimizedTasks — the owner sees their own scheduled listings.
            $query->withoutGlobalScope('published');
        }

        $cacheKey = 'user_bills_optimized_'.$userId.'_'.($limit ?? 'all').'_'.($isOwner ? 'owner' : 'public').'_'.$this->getProfileCacheVersion($userId);

        return Cache::remember($cacheKey, 600, function () use ($query, $limit) {
            $query = $query->latest();
            if ($limit) {
                $query->limit($limit);
            }

            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized shop items
     */
    private function getOptimizedShopItems(int $userId, bool $isOwner, ?int $limit = null): array
    {
        $query = Shop::where('user_id', $userId)->where('status', 1)
            ->with('category')
            ->withCount('paidPayments');

        // See getOptimizedTasks — the owner sees their own scheduled listings.
        if ($isOwner) {
            $query->withoutGlobalScope('published');
        }

        if ($isOwner) {
            $query->with(['shop_shipping_info', 'user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn()]);
        } else {
            $query->select([
                'id',
                'user_id',
                'uuid',
                'name',
                'reward_title',
                'reward_type',
                'reward_description',
                'price',
                'currency',
                'image',
                'approved',
                'created_at',
                'type',
                'description',
                'ai_generated',
                // Card renders remaining stock + sold-out from these.
                'slot_limitation',
                'quantity_allow',
                'moderation_reason',
                'is_suspended',
                'suspend_reason',
            ])
                ->with(['shop_shipping_info', 'user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn()])
                ->where('approved', 1)->where('is_suspended', 0);
        }

        $cacheKey = 'user_shop_optimized_'.$userId.'_'.($limit ?? 'all').'_'.($isOwner ? 'owner' : 'public').'_'.$this->getProfileCacheVersion($userId);

        return Cache::remember($cacheKey, 600, function () use ($query, $limit) {
            $query = $query->latest();
            if ($limit) {
                $query->limit($limit);
            }

            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized posts (limited for initial load)
     */
    private function getOptimizedPosts(int $userId, bool $isOwner, int $limit = 5): array
    {
        // The card needs every column it renders or acts on: without `slug` the
        // post link falls back to the uuid, without `is_pinned` the owner menu
        // shows the wrong pin label, and without `for_module` the lock/audience
        // badge cannot be resolved.
        $query = Post::select([
            'id',
            'uuid',
            'user_id',
            'slug',
            'title',
            'content',
            'image',
            'media',
            'type',
            'for_module',
            'is_pinned',
            'approved',
            'created_at',
            // ⚠️ The publish-time scope filters on `scheduled_at`, and
            // `is_scheduled` is appended from it — a select list without the
            // column leaves every card claiming it is not scheduled.
            'scheduled_at',
        ])->where('user_id', $userId);

        if (! $isOwner) {
            $query->where('approved', 1);
        } else {
            $query->withScheduled();
        }

        $viewerId = Auth::id() ?: 0;

        // Eager load counts to avoid N+1 queries during toArray()
        $query->withCount([
            'likes' => fn ($q) => $q->where('status', 1),
            'comments' => fn ($q) => $q->where('is_approved', 1)->orWhere('user_id', $viewerId),
        ]);

        // Mentions travel with the post: the renderer links only handles that
        // resolved to a real creator, so it needs the list, not just the text.
        $query->with('mentionedUsers');

        // Check if current user liked
        if ($viewerId) {
            $query->withExists([
                'likes as liked_exists' => fn ($q) => $q->where('user_id', $viewerId)->where('status', 1),
            ]);
        }

        // We DO NOT cache this because the 'liked_exists' is specific to the viewer
        $posts = $query->latest()->limit($limit)->get();

        return $this->stampWatermark($posts, $userId)->toArray();
    }

    /**
     * Hand every post the owner's watermark uuid.
     *
     * 🚨 Deliberately NOT `->with('user')`. Loading that relation would also
     * SERIALISE it, and `User` carries ~15 appended accessors — several of them
     * querying per row — which on a paginated feed is the documented
     * 206-query blow-up. Every post here shares one owner, so this is a single
     * scalar lookup, memoised for the request, instead of a relation per row.
     */
    public function stampWatermark($posts, int $userId)
    {
        if (! MediaUrl::enabled()) {
            return $posts;
        }

        $uuid = $this->ownerWatermarkUuid($userId);

        if ($uuid === null) {
            return $posts;
        }

        // `creatorWatermarkOverride` feeds the server-side `image_url` accessor
        // (single-image posts); `watermark_ops` is serialised into the payload
        // for the client-rendered media carousel (multi-image posts). Both
        // surfaces exist, so both need answering from the same lookup.
        $ops = MediaUrl::opsFor($uuid);

        foreach ($posts as $post) {
            $post->creatorWatermarkOverride = $uuid;
            $post->setAttribute('watermark_ops', $ops);
        }

        return $posts;
    }

    private function ownerWatermarkUuid(int $userId): ?string
    {
        if (! array_key_exists($userId, $this->watermarkUuids)) {
            try {
                $uuid = User::where('id', $userId)->value('watermark_uuid');
            } catch (\Throwable $e) {
                // The column may not exist yet on a database that has not run
                // the migration. An unwatermarked feed is the right answer;
                // a 500 on every profile is not.
                $uuid = null;
            }

            $this->watermarkUuids[$userId] = is_string($uuid) && $uuid !== '' ? $uuid : null;
        }

        return $this->watermarkUuids[$userId];
    }

    /**
     * Get user's wish items with pagination and caching
     */
    public function getUserWishItems(int $userId, ?int $categoryId = null, int $perPage = 20): array
    {
        $callback = function () use ($userId, $categoryId, $perPage) {
            $isOwner = Auth::check() && Auth::id() === $userId;

            $query = WishItem::where('user_id', $userId)->with('user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn())
                ->when($categoryId && $categoryId !== 'all', function ($query) use ($categoryId) {
                    $query->whereHas('categories', fn ($q) => $q->where('user_category_id', $categoryId));
                });

            // Apply approval filter for non-owners
            if (! $isOwner) {
                $query->where('is_approved', 1)->where('is_suspended', 0);
            }

            return $query->orderBy('sort')
                ->orderBy('created_at', 'desc')
                ->limit($perPage)
                ->get()
                ->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        $cacheKey = 'user_wishes_'.$userId.'_'.($categoryId ?? 'all').'_'.$perPage.'_'.$this->getProfileCacheVersion($userId);

        return Cache::remember($cacheKey, 600, $callback);
    }

    /**
     * Get user's posts with optimized queries and subscription access logic
     */
    public function getUserPosts(int $userId, string $module = 'all', int $perPage = 5, int $page = 1)
    {
        return $this->executePostsQuery($userId, $module, $perPage, $page);
    }

    /**
     * Check access control and apply is_lock to a single post
     */
    /**
     * Hide a locked post's paid content, but say how much of it there is.
     *
     * ⚠️ `media` was NOT being stripped — only `content` and `image` were — so
     * every locked multi-image post shipped the Uploadcare uuids of the paid
     * photos in its payload, and anyone could open them straight off the CDN.
     *
     * What replaces them is a count: "3 photos · 1 video" tells a visitor what
     * they would be buying, which is the whole job of the locked screen, without
     * handing over a single file.
     */
    public static function stripLockedMedia(Post $post): void
    {
        $items = is_array($post->media) ? $post->media : [];

        if (empty($items) && ! empty($post->image)) {
            $items = [['isVideo' => $post->type === 'video']];
        }

        $videos = 0;
        foreach ($items as $item) {
            $isVideo = ($item['isVideo'] ?? false)
                || str_starts_with((string) ($item['mimeType'] ?? ''), 'video');
            if ($isVideo) {
                $videos++;
            }
        }

        $post->content = null;
        $post->image = null;
        $post->media = null;

        $post->setAttribute('locked_image_count', max(0, count($items) - $videos));
        $post->setAttribute('locked_video_count', $videos);
    }

    public function checkPostAccessAndLockStatus(Post $post, int $userId)
    {
        $currentUser = Auth::user();
        $isOwner = $currentUser && $currentUser->id === $userId;

        // Get user's active subscriptions for this creator if not the owner
        $hasActiveSubscription = false;
        $hasMembership = false;
        $hasBill = false;
        $hasSupport = false;

        if ($currentUser && ! $isOwner) {
            // Check active wish item subscriptions
            $hasActiveSubscription = WishItemSubscription::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->whereHas('wish_item', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('status', 'paid')
                ->where('stripe_status', 'active')
                ->where(function ($q) {
                    $q->where(function ($recurring) {
                        $recurring->where('recurring_for', 'continue')
                            ->where('upcoming_payment', '>=', Carbon::now());
                    })->orWhere(function ($onetime) {
                        $onetime->where('recurring_for', 'onetime')
                            ->where('created_at', '>=', Carbon::now()->subDays(30));
                    });
                })
                ->exists();

            // Check active memberships
            $hasMembership = MembershipPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->whereHas('membership', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('status', 'paid')
                ->where('upcoming_payment', '>=', Carbon::now())
                ->exists();

            // Check active bills
            $hasBill = BillPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->whereHas('bill', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('status', 'paid')
                ->where('upcoming_payment', '>=', Carbon::now())
                ->exists();

            // Check support/tip payments
            $hasSupport = TipGoalsPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->where('creator_id', $userId)
                ->where('status', 'paid')
                ->exists();
        }

        if ($isOwner) {
            $post->is_lock = 0;
        } else {
            switch ($post->for_module) {
                case 'subscription':
                    $post->is_lock = ($hasActiveSubscription || $hasBill) ? 0 : 1;
                    break;
                case 'membership':
                    $post->is_lock = $hasMembership ? 0 : 1;
                    break;
                case 'support':
                    $post->is_lock = $hasSupport ? 0 : 1;
                    break;
                default:
                    $post->is_lock = 0;
                    break;
            }

            if ($post->is_lock == 1) {
                self::stripLockedMedia($post);
            }
        }

        return $post;
    }

    private function executePostsQuery($userId, $module, $perPage, $page)
    {
        // Don't cache paginated results to ensure fresh data
        $query = Post::where('user_id', $userId);

        $viewerId = Auth::id() ?: 0;

        // Apply approval filter for non-owners
        if (! Auth::check() || Auth::id() !== $userId) {
            $query->where('approved', 1);
        } else {
            // The owner sees their own queue. `withScheduled()` lifts the global
            // publish-time scope, and the card labels each one — a creator who
            // schedules a post for Friday must be able to see that they did.
            $query->withScheduled();
        }

        // Apply module filtering
        $query->when($module !== 'all', function ($q) use ($module) {
            $q->forModule($module);
        });

        // Eager load counts to avoid N+1 queries during toArray()
        $query->withCount([
            'likes' => fn ($q) => $q->where('status', 1),
            'comments' => fn ($q) => $q->where('is_approved', 1)->orWhere('user_id', $viewerId),
        ]);

        // Mentions travel with the post: the renderer links only handles that
        // resolved to a real creator, so it needs the list, not just the text.
        $query->with('mentionedUsers');

        // Check if current user liked
        if ($viewerId) {
            $query->withExists([
                'likes as liked_exists' => fn ($q) => $q->where('user_id', $viewerId)->where('status', 1),
            ]);
        }

        $posts = $query->orderBy('is_pinned', 'desc')->latest()->paginate($perPage, ['*'], 'page', $page);

        // Attribution watermark — one scalar lookup for the page, never a
        // relation per row (see stampWatermark).
        $this->stampWatermark($posts->getCollection(), $userId);

        // Check subscription access for each post
        $currentUser = Auth::user();
        $isOwner = $currentUser && $currentUser->id === $userId;

        // Get user's active subscriptions for this creator if not the owner
        $hasActiveSubscription = false;
        $hasMembership = false;
        $hasBill = false;
        $hasSupport = false;

        if ($currentUser && ! $isOwner) {
            // Check active wish item subscriptions
            $hasActiveSubscription = WishItemSubscription::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->whereHas('wish_item', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('status', 'paid')
                ->where('stripe_status', 'active')
                ->where(function ($q) {
                    $q->where(function ($recurring) {
                        $recurring->where('recurring_for', 'continue')
                            ->where('upcoming_payment', '>=', Carbon::now());
                    })->orWhere(function ($onetime) {
                        $onetime->where('recurring_for', 'onetime')
                            ->where('created_at', '>=', Carbon::now()->subDays(30));
                    });
                })
                ->exists();

            // Check active memberships
            $hasMembership = MembershipPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->whereHas('membership', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('status', 'paid')
                ->where('upcoming_payment', '>=', Carbon::now())
                ->exists();

            // Check active bills
            $hasBill = BillPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->whereHas('bill', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('status', 'paid')
                ->where('upcoming_payment', '>=', Carbon::now())
                ->exists();

            // Check support/tip payments
            $hasSupport = TipGoalsPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
                ->where('creator_id', $userId)
                ->where('status', 'paid')
                ->exists();
        }

        // Apply is_lock logic to paginated posts using through() method
        $posts->through(function ($post) use ($isOwner, $hasActiveSubscription, $hasMembership, $hasBill, $hasSupport) {
            if ($isOwner) {
                // Owner can always see their own posts
                $post->is_lock = 0;
            } else {
                // Check access based on post type
                switch ($post->for_module) {
                    case 'subscription':
                        // 'subscription' covers both wish-subscriptions and Bills, so an
                        // active bill also unlocks (previously $hasBill was computed but unused).
                        $post->is_lock = ($hasActiveSubscription || $hasBill) ? 0 : 1;
                        break;
                    case 'membership':
                        $post->is_lock = $hasMembership ? 0 : 1;
                        break;
                    case 'support':
                        $post->is_lock = $hasSupport ? 0 : 1;
                        break;
                    default:
                        // Public posts or posts with no module restriction
                        $post->is_lock = 0;
                        break;
                }

                // A locked post must not leak its premium content/media to a non-entitled
                // viewer — strip the body + image so only the lock state is exposed.
                if ($post->is_lock == 1) {
                    self::stripLockedMedia($post);
                }
            }

            return $post;
        });

        return $posts;
    }

    /**
     * Get user's memberships with caching
     */
    public function getUserMemberships(int $userId): array
    {
        $callback = function () use ($userId) {
            $isOwner = Auth::check() && Auth::id() === $userId;
            $query = Membership::where('user_id', $userId)->with('user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn());
            if (! $isOwner) {
                $query->where('approved', 1)->where('is_suspended', 0);
            }

            return $query->latest()->get()->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_memberships_'.$userId.'_'.$this->getProfileCacheVersion($userId), 600, $callback);
    }

    /**
     * Get user's bills with caching
     */
    public function getUserBills(int $userId): array
    {
        $callback = function () use ($userId) {
            $isOwner = Auth::check() && Auth::id() === $userId;

            $query = Bills::where('user_id', $userId)->with('user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn());

            if (! $isOwner) {
                $query->where('approved', 1)->where('is_suspended', 0);
            }

            return $query->latest()->get()->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_bills_'.$userId.'_'.$this->getProfileCacheVersion($userId), 600, $callback);
    }

    /**
     * Get user's shop items with caching
     */
    public function getUserShopItems(int $userId): array
    {
        $callback = function () use ($userId) {
            $isOwner = Auth::check() && Auth::id() === $userId;

            $query = Shop::where('user_id', $userId)->where('status', 1)
                ->with(['shop_shipping_info', 'category', 'user:id,name,username,suspended_account,vat_amount_percentage'.MediaUrl::ownerColumn()])
                ->withCount('paidPayments');

            if (! $isOwner) {
                $query->where('approved', 1)->where('is_suspended', 0);
            }

            $shops = $query->latest()->get();

            // Only the owner's own tab may carry the paid deliverable.
            if ($isOwner) {
                $shops->each->withDeliverable();
            }

            return $shops->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_shop_'.$userId.'_'.$this->getProfileCacheVersion($userId), 600, $callback);
    }

    /**
     * How long a computed cache version may be trusted before it is recomputed
     * from the database.
     *
     * ⚠️ This number is the delay between the ADMIN APP approving a listing and
     * the public profile showing it. The two apps share a database but not a
     * cache, so nothing the back office does can invalidate a key held here —
     * the version therefore has to expire on its own and be re-derived from the
     * rows themselves. It used to be pinned for 24 HOURS by clearUserCaches(),
     * so an approved listing could stay invisible to logged-out visitors for a
     * full day and the reviewer had no way to tell their click had worked.
     */
    private const CACHE_VERSION_TTL = 30;

    private function getProfileCacheVersion(int $userId): string
    {
        $cacheKey = $this->profileCacheTokenKey($userId);
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return (string) $cached;
        }

        // Every table an admin can flip a listing's approval flag on is
        // represented here, so any approve changes `updated_at`, which changes
        // the version, which changes every cache key derived from it.
        $timestamps = [
            User::where('id', $userId)->value('updated_at'),
            WishItem::where('user_id', $userId)->max('updated_at'),
            Membership::where('user_id', $userId)->max('updated_at'),
            Bills::where('user_id', $userId)->max('updated_at'),
            Shop::where('user_id', $userId)->max('updated_at'),
            Task::where('creator_id', $userId)->max('updated_at'),
            PiggyPot::where('user_id', $userId)->max('updated_at'),
        ];

        $latestUnix = 0;
        foreach ($timestamps as $timestamp) {
            if (! $timestamp) {
                continue;
            }

            $parsed = strtotime((string) $timestamp);
            if ($parsed > $latestUnix) {
                $latestUnix = $parsed;
            }
        }

        $version = (string) $latestUnix;
        Cache::put($cacheKey, $version, self::CACHE_VERSION_TTL);

        return $version;
    }

    private function profileCacheTokenKey(int $userId): string
    {
        return 'profile_cache_token_v1_'.$userId;
    }

    /**
     * Get supporters count with optimized query and caching
     */
    public function getSupportersCount(int $userId): int
    {
        $cacheKey = 'user_supporters_count_v2_'.$userId;
        $ttl = (Auth::check() && Auth::id() === $userId) ? 300 : 3600; // 5 mins for owner, 1 hour for others

        return Cache::remember($cacheKey, $ttl, function () use ($userId) {
            // Use raw SQL for better performance
            $query = "
                SELECT COUNT(DISTINCT supporter) as count FROM (
                    SELECT user_id as supporter FROM tip_goals_payments 
                    WHERE creator_id = ? AND status = 'paid' AND user_id IS NOT NULL
                    UNION
                    SELECT id as supporter FROM users 
                    WHERE email IN (
                        SELECT guest_email FROM tip_goals_payments 
                        WHERE creator_id = ? AND status = 'paid' AND guest_email IS NOT NULL
                    )
                    UNION
                    SELECT CONCAT('guest_', ROW_NUMBER() OVER()) as supporter FROM tip_goals_payments 
                    WHERE creator_id = ? AND status = 'paid' AND guest_email IS NOT NULL
                    AND guest_email NOT IN (SELECT email FROM users)
                ) supporters
            ";

            $result = DB::select($query, [$userId, $userId, $userId]);

            return (int) ($result[0]->count ?? 0);
        });
    }

    /**
     * Get user's total earnings with caching
     */
    public function getUserEarnings(int $userId): array
    {
        $cacheKey = 'user_earnings_v2_'.$userId;

        return Cache::remember($cacheKey, 600, function () use ($userId) {
            $goalPayment = TipGoalsPayment::where('creator_id', $userId)
                ->where('status', 'paid')
                ->sum('amount');

            $billPayment = BillPayment::whereHas('bill', fn ($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $memPayment = MembershipPayment::whereHas('membership', fn ($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $wishPayment = StripePaymentDetail::where('owner_id', $userId)
                ->where('payment_status', 'paid')
                ->sum('amount_subtotal');

            $subPayment = WishItemSubscription::whereHas('wish_item', fn ($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $shopPayment = ShopPayment::whereHas('shop', fn ($q) => $q->where('user_id', $userId))
                ->where('payment_status', 'paid')
                ->sum('amount');

            $totalEarnings = $goalPayment + $billPayment + $memPayment + $wishPayment + $subPayment + $shopPayment;

            $target = match (true) {
                $totalEarnings < 100 => 100,
                $totalEarnings < 1000 => 1000,
                $totalEarnings < 10000 => 10000,
                $totalEarnings < 100000 => 100000,
                $totalEarnings < 1000000 => 1000000,
                default => 10000000,
            };

            return [
                'fulfilled' => $totalEarnings,
                'target' => $target,
                'goal_payments' => $goalPayment,
                'bill_payments' => $billPayment,
                'membership_payments' => $memPayment,
                'wish_payments' => $wishPayment,
                'subscription_payments' => $subPayment,
                'shop_payments' => $shopPayment,
            ];
        });
    }

    /**
     * Compact per-creator overview for the profile right rail:
     * live listing counts + the earnings progress pair.
     */
    public function getProfileOverview(int $userId): array
    {
        return Cache::remember('profile_overview_v1_'.$userId, 600, function () use ($userId) {
            $earnings = $this->getUserEarnings($userId);

            return [
                'wishes' => WishItem::where('user_id', $userId)->count(),
                'piggy_pots' => PiggyPot::where('user_id', $userId)->where('status', 'active')->count(),
                'memberships' => Membership::where('user_id', $userId)->count(),
                'shops' => Shop::where('user_id', $userId)->where('approved', 1)->count(),
                'tasks' => Task::where('creator_id', $userId)->where('is_approved', 1)->count(),
                'earned' => (float) $earnings['fulfilled'],
                'earned_target' => (float) $earnings['target'],
            ];
        });
    }

    /**
     * May THIS viewer see the creator's earnings figures?
     *
     * The owner always sees their own — a placeholder on their own screen reads as
     * "the data failed to load". Everyone else waits on users.show_piggy_bank, the
     * toggle the account settings screen has always labelled "Show earnings goal on
     * profile" (MyGoal has honoured it since it shipped).
     */
    public function earningsVisibleTo(User $creator): bool
    {
        if (Auth::check() && Auth::id() === $creator->id) {
            return true;
        }

        return (int) ($creator->show_piggy_bank ?? 0) === 1;
    }

    /**
     * Redact the money out of a cached overview for a viewer who may not see it.
     *
     * The cache is deliberately viewer-agnostic (one entry per creator, shared by
     * everyone), so the gate is applied HERE, at the call site, and never inside
     * the cached closure — baking the viewer into the key would multiply the entry
     * by every visitor.
     *
     * Hidden keeps the milestone bar and its percentage and drops the figures, so
     * the progress device survives without publishing the amount.
     */
    public function overviewForViewer(array $overview, User $creator): array
    {
        if ($this->earningsVisibleTo($creator)) {
            return $overview;
        }

        $earned = (float) ($overview['earned'] ?? 0);
        $target = (float) ($overview['earned_target'] ?? 0);

        unset($overview['earned'], $overview['earned_target']);

        $overview['earnings_hidden'] = true;
        $overview['earned_percent'] = $target > 0
            ? (int) round(min(100, max(0, ($earned / $target) * 100)))
            : 0;

        return $overview;
    }

    /**
     * The `goal` body of /user/tip/goal/{username}, gated for this viewer.
     *
     * Lives here because TWO controllers answer that shape — the live
     * AuthenticatedSessionController and the (currently unrouted)
     * OptimizedProfileController. Gating one and not the other is a hole that
     * opens the moment the second is wired up, and the endpoint is public, so
     * hiding the figure in the component alone leaves it a URL away.
     *
     * Hidden keeps the percentage and drops the money, matching overviewForViewer.
     */
    public function goalPayloadFor(User $creator): array
    {
        $earnings = $this->getUserEarnings($creator->id);
        $target = (float) $earnings['target'];

        if (! $this->earningsVisibleTo($creator)) {
            return [
                'hidden' => true,
                'percent' => $target > 0
                    ? (int) round(min(100, max(0, ((float) $earnings['fulfilled'] / $target) * 100)))
                    : 0,
            ];
        }

        return [
            'fullfilled' => $earnings['fulfilled'],
            'target' => $earnings['target'],
            'currency' => $creator->default_currency,
        ];
    }

    /**
     * Public social proof for a creator profile: who is actually buying, and how
     * reliably this creator delivers.
     *
     * Supporters come from the ledger rather than one module, so a wish buyer and
     * a shop buyer both count — Piggy Pot's own board only ever saw pot
     * contributions. Ranked and labelled by PURCHASE COUNT, never by amount
     * (Stripe compliance: this is a most-active board, not a spend race).
     */
    public function getProfileSocialProof(int $userId): array
    {
        $token = $this->getProfileCacheToken($userId);

        return Cache::remember('profile_social_proof_v1_'.$userId.'_v'.$token, 600, function () use ($userId) {
            $rows = FinancialTransaction::query()
                ->where('user_id', $userId)
                ->where('type', 'income')
                ->whereNotIn('status', ['refunded', 'failed', 'cancelled', 'disputed'])
                ->whereNotNull('supporter_id')
                ->selectRaw('supporter_id, COUNT(*) as purchases, MAX(transaction_date) as last_purchase')
                ->groupBy('supporter_id')
                ->orderByDesc('last_purchase')
                ->limit(12)
                ->get();

            $ids = $rows->pluck('supporter_id')->all();

            $users = User::whereIn('id', $ids)
                ->get(['id', 'name', 'username', 'avatar', 'avatar_cdn_modifier', 'avatar_approved'])
                ->keyBy('id');

            // Same badges the gifter hub and public leaderboard show, so a
            // supporter reads identically wherever they appear.
            $badges = $ids ? app(VipScoreService::class)->badgesFor($ids) : [];

            $supporters = [];
            foreach ($rows as $row) {
                $u = $users->get($row->supporter_id);
                if (! $u) {
                    continue;
                }
                $supporters[] = [
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar' => $u->avatar_url,
                    'purchases' => (int) $row->purchases,
                    'vip' => $badges[$row->supporter_id] ?? null,
                ];
            }

            $active30d = FinancialTransaction::query()
                ->where('user_id', $userId)
                ->where('type', 'income')
                ->whereNotIn('status', ['refunded', 'failed', 'cancelled', 'disputed'])
                ->whereNotNull('supporter_id')
                ->where('transaction_date', '>=', Carbon::now()->subDays(30))
                ->distinct()
                ->count('supporter_id');

            return [
                'supporters' => $supporters,
                'supporters_30d' => $active30d,
                'delivery' => $this->deliveryReliability($userId),
            ];
        });
    }

    /**
     * How this creator has actually delivered: how many were handed over, and how
     * many of those with a deadline landed before it. A buyer of a paid task has
     * no other way to judge that before paying.
     *
     * Only deadlines that exist are judged — an instant unlock has no `due_at`
     * and counting it as "on time" would inflate the figure into meaninglessness.
     */
    private function deliveryReliability(int $userId): array
    {
        $delivered = Deliverable::query()
            ->where('creator_id', $userId)
            ->whereIn('status', ['delivered', 'completed', 'fulfilled'])
            ->whereNotNull('delivered_at');

        $total = (clone $delivered)->count();

        if ($total < 3) {
            // Too few to be a claim rather than noise.
            return ['total' => $total, 'on_time' => null, 'median_hours' => null];
        }

        $withDeadline = (clone $delivered)->whereNotNull('due_at');
        $deadlineCount = (clone $withDeadline)->count();
        $onTime = $deadlineCount > 0
            ? (clone $withDeadline)->whereColumn('delivered_at', '<=', 'due_at')->count()
            : null;

        // Median beats mean here: one forgotten order shouldn't define the creator.
        $hours = (clone $delivered)
            ->whereNotNull('created_at')
            ->orderBy('id')
            ->limit(200)
            ->get(['created_at', 'delivered_at'])
            ->map(fn ($d) => $d->created_at && $d->delivered_at
                ? $d->created_at->diffInMinutes($d->delivered_at) / 60
                : null)
            ->filter(fn ($h) => $h !== null && $h >= 0)
            ->sort()
            ->values();

        $median = $hours->count() ? $hours[intdiv($hours->count(), 2)] : null;

        return [
            'total' => $total,
            'on_time' => $onTime,
            'on_time_of' => $deadlineCount,
            'median_hours' => $median !== null ? round($median, 1) : null,
        ];
    }

    /**
     * What the signed-in viewer has already bought from this creator. Not cached
     * with the public payload — it is per-viewer by definition.
     */
    public function getViewerSupportHistory(int $creatorId, ?int $viewerId): ?array
    {
        if (! $viewerId || $viewerId === $creatorId) {
            return null;
        }

        $row = FinancialTransaction::query()
            ->where('user_id', $creatorId)
            ->where('type', 'income')
            ->whereNotIn('status', ['refunded', 'failed', 'cancelled', 'disputed'])
            ->where('supporter_id', $viewerId)
            ->selectRaw('COUNT(*) as purchases, MIN(transaction_date) as first_purchase')
            ->first();

        if (! $row || ! $row->purchases) {
            return null;
        }

        return [
            'purchases' => (int) $row->purchases,
            'since' => $row->first_purchase ? Carbon::parse($row->first_purchase)->format('M Y') : null,
        ];
    }

    /**
     * Public supporter profile payload — engagement level, badges, activity.
     *
     * ⚠️ MONEY IS NEVER RETURNED. A supporter's lifetime spend is private: the
     * engagement Level is already public (leaderboard + every creator's supporter
     * wall), but the amount behind it is not, and a public profile is the one place
     * it could leak to anyone with the URL. Counts only — purchases, creators,
     * feature types. That also matches the Stripe compliance rule that supporters
     * are ranked by purchase count, never by amount.
     */
    public function getGifterStats(int $userId): ?array
    {
        $user = User::select('id', 'created_at')->find($userId);
        if (! $user) {
            return null;
        }

        // Lifetime, from the canonical ledger. The VIP payload below is a rolling
        // 90-day engagement window, so it cannot answer "how long have they been here".
        $row = FinancialTransaction::query()
            ->where('type', 'income')
            ->whereNotIn('status', ['refunded', 'failed', 'cancelled', 'disputed'])
            ->where('supporter_id', $userId)
            ->selectRaw('COUNT(*) as purchases, COUNT(DISTINCT user_id) as creators, MIN(transaction_date) as first_purchase')
            ->first();

        $vip = app(VipScoreService::class)->for($user);
        unset($vip['totals']['amount_gbp'], $vip['breakdown']['spend']);

        return [
            'vip' => $vip,
            'purchases' => (int) ($row->purchases ?? 0),
            'creators' => (int) ($row->creators ?? 0),
            'since' => $row?->first_purchase
                ? Carbon::parse($row->first_purchase)->format('M Y')
                : Carbon::parse($user->created_at)->format('M Y'),
            'member_since' => Carbon::parse($user->created_at)->format('M Y'),
        ];
    }

    /**
     * The creators this supporter backs — OWNER ONLY.
     *
     * ⚠️ This is deliberately not public, and the caller must gate it. Each edge
     * is already public from the other side (a creator's page lists its own
     * supporters, the leaderboard lists VIPs), but collecting every creator one
     * person buys from onto a single page is a different exposure: it is a taste
     * profile, on a platform that hosts adult-adjacent work, and the supporter
     * never opted into it. The public card shows the COUNT; only the owner sees
     * who. Flip this only as a deliberate product decision.
     */
    public function getGifterCreators(int $userId, int $limit = 12): array
    {
        $rows = FinancialTransaction::query()
            ->where('type', 'income')
            ->whereNotIn('status', ['refunded', 'failed', 'cancelled', 'disputed'])
            ->where('supporter_id', $userId)
            // An income row's user_id IS the creator — there is no creator_id column.
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->selectRaw('user_id, COUNT(*) as purchases, MAX(transaction_date) as last_purchase')
            ->orderByDesc('purchases')
            ->limit($limit)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        // avatar_url is an accessor over a bare Uploadcare uuid and reads the
        // approval flag, so the model must carry all four columns — a hand-built
        // CDN string would serve unapproved avatars.
        $creators = User::whereIn('id', $rows->pluck('user_id'))
            ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'suspended_account'])
            ->keyBy('id');

        return $rows->map(function ($row) use ($creators) {
            $creator = $creators->get($row->user_id);
            if (! $creator) {
                return null;
            }

            $suspended = (int) $creator->suspended_account === 1;

            return [
                'name' => $creator->name,
                // A suspended creator's page answers 410, so the tile is shown
                // without a link rather than dropped — the supporter did buy from
                // them, and silently losing that is worse than an inert tile.
                'username' => $suspended ? null : $creator->username,
                'avatar' => $creator->avatar_url,
                'purchases' => (int) $row->purchases,
            ];
        })->filter()->values()->all();
    }

    /**
     * Get notification count for authenticated user
     */
    public function getNotificationCount(?int $userId): int
    {
        if (! $userId) {
            return 0;
        }

        // NO CACHE - REAL TIME DATA
        return Notification::where('notifiable_id', $userId)
            ->where('is_read', 0)
            ->count();
    }

    /**
     * Clear ALL profile related caches for a user
     */
    public function getProfileCacheToken(int $userId): string
    {
        return $this->getProfileCacheVersion($userId);
    }

    public function clearUserCaches(string $username, int $userId): void
    {
        // Forget, don't overwrite. Writing a fresh `time()` here pinned the
        // version for 24 hours, which meant the version could no longer follow
        // the rows — so a change made anywhere else (notably an approval in the
        // admin app) was invisible until that token happened to expire.
        // Forgetting makes the very next read recompute it from the database.
        Cache::forget($this->profileCacheTokenKey($userId));

        // Clear basic profile cache
        Cache::forget('user_profile_basic_'.$username);
        Cache::forget('user_followers_count_'.$userId);
        Cache::forget('user_following_count_'.$userId);

        // Clear all data cache variations (common ones)
        Cache::forget('profile_all_data_'.$userId.'_all_page_about');
        Cache::forget('profile_all_data_'.$userId.'_all_page_feed');
        Cache::forget('profile_all_data_'.$userId.'_all_page_wishes');
        Cache::forget('profile_all_data_'.$userId.'_all_page_shop');
        Cache::forget('profile_all_data_'.$userId.'_all_page_tasks');
        Cache::forget('profile_all_data_'.$userId.'_all_page_memberships');
        Cache::forget('profile_all_data_'.$userId.'_all_page_bills');

        // Clear category variations if any exist
        $categories = UserCategory::where('user_id', $userId)->pluck('id');
        foreach ($categories as $catId) {
            Cache::forget('profile_all_data_'.$userId.'_'.$catId.'_page_about');
            Cache::forget('profile_all_data_'.$userId.'_'.$catId.'_page_wishes');
        }

        // Clear other related caches
        Cache::forget('user_categories_with_items_'.$userId);
        Cache::forget('user_wishes_'.$userId.'_all_20');
        Cache::forget('user_memberships_'.$userId);
        Cache::forget('user_bills_'.$userId);
        Cache::forget('user_shop_'.$userId);
        Cache::forget("user_sub_posts_count_{$userId}");
        Cache::forget("user_mem_posts_count_{$userId}");
        Cache::forget('user_piggy_pot_top_'.$userId);
        Cache::forget('user_piggy_pot_top_supporters_'.$userId);
        Cache::forget('user_piggy_pot_feed_'.$userId);

        Log::info("Caches cleared for user: {$username} ({$userId})");
    }

    /**
     * Preload user profile data for better performance
     */
    public function preloadUserProfileData(string $username): array
    {
        $user = $this->getUserWithRelations($username);

        if (! $user) {
            return [];
        }

        // 🛡️ Sync mandatory subscription if user is viewing their own profile and status is not active
        if (Auth::check() && Auth::id() === $user->id && $user->stripe_id) {
            // Rate limit sync to once every 6 hours per user to avoid blocking page loads
            $syncCacheKey = 'last_stripe_sync_'.$user->id;
            $needsSync = ! Cache::has($syncCacheKey);

            if ($needsSync && $user->subscription_status == 0) { // 0 = EXPIRED/NONE
                $this->syncUserSubscription($user);
                Cache::put($syncCacheKey, true, 21600); // 6 hours
                // Refresh user model after sync
                $user = $user->fresh();
                $user->load([
                    'social_links',
                    'user_categories',
                    'intro',
                ]);
            }
        }

        // Preload all data in parallel using promises or similar
        $data = [
            'user' => $user,
            'supporters' => $this->getSupportersCount($user->id),
            'notification_count' => $this->getNotificationCount(Auth::id()),
        ];

        // Add earnings data for profile owner
        if (Auth::check() && Auth::id() === $user->id) {
            $data['earnings'] = $this->getUserEarnings($user->id);
        }

        return $data;
    }

    /**
     * Unified sync for mandatory platform subscriptions (MonthlyCharge)
     * Used by both StripeWebhookController and StripeController for consistency.
     */
    public function syncMandatorySubscriptionStatus(Subscription $subscription, string $eventType, ?Invoice $invoice = null, ?User $user = null)
    {
        $subscriptionId = $subscription->id;
        $stripeStart = Carbon::createFromTimestamp($subscription->current_period_start);
        $stripeEnd = Carbon::createFromTimestamp($subscription->current_period_end);
        $normalizedStatus = $subscription->status === 'active' ? 'paid' : $subscription->status;
        $updateIfDirty = static function ($model, array $attributes): bool {
            $model->fill($attributes);
            if (! $model->isDirty()) {
                return false;
            }
            $model->save();

            return true;
        };
        $syncUserSubscribed = static function (?User $targetUser, int $nextValue): bool {
            if (! $targetUser || (int) $targetUser->is_subscribed === $nextValue) {
                return false;
            }
            $targetUser->is_subscribed = $nextValue;

            return $targetUser->save();
        };

        // If this is an invoice sync, use the period dates from the invoice line item if available
        if ($invoice && isset($invoice->lines->data[0]->period)) {
            $stripeStart = Carbon::createFromTimestamp($invoice->lines->data[0]->period->start);
            $stripeEnd = Carbon::createFromTimestamp($invoice->lines->data[0]->period->end);
        }

        // Fetch customer if not already expanded
        $customer = $subscription->customer;
        if (is_string($customer)) {
            $customer = StripeControl::getClient()->customers->retrieve($customer);
        }

        // Resolve User if not provided
        if (! $user) {
            $userId = $subscription->metadata->user_id ?? $customer->metadata->user_id ?? null;
            if ($userId) {
                $user = User::find($userId);
            }
        }

        $resolvedUserId = $user->id ?? $subscription->metadata->user_id ?? $customer->metadata->user_id ?? null;

        // Fetch the most relevant existing record for this subscription ID to use as a fallback
        $subs = MonthlyCharge::where('stripe_id', $subscriptionId)
            ->when($resolvedUserId, fn ($q) => $q->where('user_id', $resolvedUserId))
            ->latest('id')
            ->first();

        /* ================= Handle different event types ================= */

        // TRIAL STARTED / WILL END
        if (
            $eventType === 'customer.subscription.trial_will_end' ||
            ($eventType === 'customer.subscription.created' && $subscription->status === 'trialing')
        ) {
            $trialStartAt = $subscription->trial_start ? Carbon::createFromTimestamp($subscription->trial_start) : $stripeStart;
            $trialEndAt = $subscription->trial_end ? Carbon::createFromTimestamp($subscription->trial_end) : $stripeEnd;

            // Check if we already have a record for this specific trial period for this user
            $trialExists = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->where('user_id', $resolvedUserId ?? $subs->user_id ?? null)
                ->whereDate('current_start_trial_date', $trialStartAt->toDateString())
                ->whereDate('current_end_trial_date', $trialEndAt->toDateString())
                ->exists();

            if ($trialExists) {
                return $subs;
            }

            $newSub = MonthlyCharge::create([
                'user_id' => $resolvedUserId,
                'name' => $customer->name ?? 'Creator',
                'email' => $customer->email,
                'stripe_id' => $subscriptionId,
                'current_start_trial_date' => $trialStartAt->toDateString(),
                'current_end_trial_date' => $trialEndAt->toDateString(),
                'status' => 'trialing',
                'upcoming_payment' => $trialEndAt,
            ]);

            if ($newSub->user) {
                $syncUserSubscribed($newSub->user, 1);
            }

            Log::info('MonthlyCharge Sync: Trial processed', ['sub_id' => $subscriptionId]);

            return $newSub;
        }

        // PAYMENT SUCCEEDED (First Payment or Renewal)
        if ($eventType === 'invoice.payment_succeeded' && $subscription->status === 'active') {
            // ONLY process paid invoices to avoid duplicates from drafts/open invoices
            if ($invoice && $invoice->status !== 'paid') {
                return $subs;
            }

            $amount = $invoice ? ($invoice->amount_paid / 100) : ($subscription->plan->amount / 100);
            $currency = strtoupper($invoice ? $invoice->currency : $subscription->currency);
            $tax = 0;
            if ($invoice && ! empty($invoice->total_tax_amounts)) {
                foreach ($invoice->total_tax_amounts as $t) {
                    $tax += ($t->amount ?? 0) / 100;
                }
            }

            // Check if this specific payment period already exists for this user.
            // We use whereDate to ensure we match the day regardless of time components.
            $existing = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->where('user_id', $resolvedUserId ?? $subs->user_id ?? null)
                ->where(function ($q) use ($stripeStart, $stripeEnd) {
                    $q->where(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_subscription_date', $stripeStart->toDateString())
                            ->whereDate('current_end_subscription_date', $stripeEnd->toDateString());
                    })->orWhere(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_trial_date', $stripeStart->toDateString())
                            ->whereDate('current_end_trial_date', $stripeEnd->toDateString());
                    });
                })
                ->latest('id')
                ->first();

            if ($existing) {
                $updateData = [
                    'status' => $normalizedStatus,
                    'amount' => max((float) ($existing->amount ?? 0), (float) $amount),
                    'currency' => $currency,
                    'tax' => $tax,
                    'upcoming_payment' => ($subscription->cancel_at_period_end) ? null : $stripeEnd,
                    'cancelled_at' => ($subscription->cancel_at_period_end)
                        ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : ($existing->cancelled_at ?? now()))
                        : null,
                ];

                // Only update dates if they were null or if we are explicitly in a subscription period
                if (! $existing->current_start_subscription_date) {
                    $updateData['current_start_subscription_date'] = $stripeStart->toDateString();
                    $updateData['current_end_subscription_date'] = $stripeEnd->toDateString();
                }

                $updateIfDirty($existing, $updateData);

                if ($existing->user) {
                    $syncUserSubscribed($existing->user, 1);
                }

                return $existing;
            }

            // Check for trial conversion: If we have an active trial record, we mark it as ended
            // and create the first paid record.
            $trial = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->when($resolvedUserId, fn ($q) => $q->where('user_id', $resolvedUserId))
                ->where('status', 'trialing')
                ->latest('id')
                ->first();

            if ($trial) {
                $updateIfDirty($trial, ['status' => 'ended']);
            }

            $newSub = MonthlyCharge::create([
                'user_id' => $resolvedUserId ?? $subs->user_id ?? null,
                'name' => $subs->name ?? $customer->name ?? 'Creator',
                'email' => $subs->email ?? $customer->email,
                'stripe_id' => $subscriptionId,
                'current_start_subscription_date' => $stripeStart->toDateString(),
                'current_end_subscription_date' => $stripeEnd->toDateString(),
                'amount' => $amount,
                'currency' => $currency,
                'tax' => $tax,
                'status' => $normalizedStatus,
                'upcoming_payment' => ($subscription->cancel_at_period_end) ? null : $stripeEnd,
                'cancelled_at' => ($subscription->cancel_at_period_end) ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : now()) : null,
            ]);

            if ($newSub->user) {
                $syncUserSubscribed($newSub->user, 1);
            }

            Log::info('MonthlyCharge Sync: Payment processed', ['sub_id' => $subscriptionId, 'period' => $stripeStart->toDateString()]);

            return $newSub;
        }

        // PAYMENT FAILED
        if ($eventType === 'invoice.payment_failed') {
            if ($subs) {
                $updateIfDirty($subs, ['status' => 'failed', 'upcoming_payment' => null]);
                // Access is only removed if the period has actually expired (handled in User model)
            }
            Log::info('MonthlyCharge Sync: Payment Failed processed', ['sub_id' => $subscriptionId]);

            return $subs;
        }

        // DELETED
        if ($eventType === 'customer.subscription.deleted') {
            if ($subs) {
                $updateIfDirty($subs, ['status' => 'canceled', 'upcoming_payment' => null, 'cancelled_at' => now()]);
            }
            Log::info('MonthlyCharge Sync: Subscription Deleted processed', ['sub_id' => $subscriptionId]);

            return $subs;
        }

        // UPDATED (Generic) or missing local record sync
        if ($eventType === 'customer.subscription.updated' || $eventType === 'manual_sync') {
            $target = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->when($resolvedUserId, fn ($q) => $q->where('user_id', $resolvedUserId))
                ->where(function ($q) use ($stripeStart, $stripeEnd) {
                    $q->where(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_subscription_date', $stripeStart->toDateString())
                            ->whereDate('current_end_subscription_date', $stripeEnd->toDateString());
                    })->orWhere(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_trial_date', $stripeStart->toDateString())
                            ->whereDate('current_end_trial_date', $stripeEnd->toDateString());
                    });
                })
                ->latest('id')
                ->first();

            // If no record found for this specific period, but we have a general record for this subscription,
            // we should still be careful not to overwrite history.
            if (! $target) {
                // If the subscription is trialing, look for any trialing record
                if ($subscription->status === 'trialing') {
                    $target = MonthlyCharge::where('stripe_id', $subscriptionId)
                        ->when($resolvedUserId, fn ($q) => $q->where('user_id', $resolvedUserId))
                        ->where('status', 'trialing')
                        ->latest('id')
                        ->first();
                } else {
                    // If active, look for the most recent active/paid record
                    $target = MonthlyCharge::where('stripe_id', $subscriptionId)
                        ->when($resolvedUserId, fn ($q) => $q->where('user_id', $resolvedUserId))
                        ->whereIn('status', ['paid', 'active', 'renew'])
                        ->latest('id')
                        ->first();
                }
            }

            if ($target) {
                $newStatus = $normalizedStatus;

                // Determine if we should update dates or if this is a different period
                $isSamePeriod = false;
                if ($subscription->status === 'trialing') {
                    $isSamePeriod = $target->current_start_trial_date && $target->current_start_trial_date->toDateString() === $stripeStart->toDateString();
                } else {
                    $isSamePeriod = $target->current_start_subscription_date && $target->current_start_subscription_date->toDateString() === $stripeStart->toDateString();
                }

                $updateData = [
                    'status' => $newStatus,
                    'upcoming_payment' => ($subscription->cancel_at_period_end || in_array($subscription->status, ['canceled', 'unpaid'])) ? null : $stripeEnd,
                    'cancelled_at' => ($subscription->cancel_at_period_end || $subscription->status === 'canceled')
                        ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : ($target->cancelled_at ?? now()))
                        : null,
                ];

                Log::info('MonthlyCharge Sync: Updating record', [
                    'sub_id' => $subscriptionId,
                    'cancel_at_period_end' => $subscription->cancel_at_period_end,
                    'new_upcoming' => $updateData['upcoming_payment'],
                    'new_cancelled_at' => $updateData['cancelled_at'],
                ]);

                // Only update dates if it's the same period or if dates were missing
                if ($isSamePeriod || (! $target->current_start_subscription_date && ! $target->current_start_trial_date)) {
                    if ($subscription->status === 'trialing') {
                        $updateData['current_start_trial_date'] = $stripeStart->toDateString();
                        $updateData['current_end_trial_date'] = $stripeEnd->toDateString();
                    } else {
                        $updateData['current_start_subscription_date'] = $stripeStart->toDateString();
                        $updateData['current_end_subscription_date'] = $stripeEnd->toDateString();
                    }
                } else {
                    // Different period! We should NOT update this record's dates.
                    // Instead, we fall through to the creation logic below if we don't find a record for the NEW period.
                    $target = null;
                }

                if ($target) {
                    $updateIfDirty($target, $updateData);

                    if (in_array($subscription->status, ['active', 'trialing'])) {
                        if ($target->user) {
                            $syncUserSubscribed($target->user, 1);
                        }
                    } else {
                        // Only set is_subscribed to 0 if the paid period has actually passed or if cancelled before any payment
                        $periodEnded = ! $target->current_end_subscription_date || now()->greaterThanOrEqualTo($stripeEnd);
                        if ($periodEnded && $target->user) {
                            $syncUserSubscribed($target->user, 0);
                        }
                    }

                    return $target;
                }
            }

            // If we reach here, it means we didn't find a record to update (or it was a different period)
            // Check one last time by period dates to prevent duplicates
            $existingForPeriod = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->when($resolvedUserId, fn ($q) => $q->where('user_id', $resolvedUserId))
                ->where(function ($q) use ($stripeStart, $stripeEnd) {
                    $q->where(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_subscription_date', $stripeStart->toDateString())
                            ->whereDate('current_end_subscription_date', $stripeEnd->toDateString());
                    })->orWhere(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_trial_date', $stripeStart->toDateString())
                            ->whereDate('current_end_trial_date', $stripeEnd->toDateString());
                    });
                })
                ->latest('id')
                ->first();

            if ($existingForPeriod) {
                $updateIfDirty($existingForPeriod, [
                    'status' => $normalizedStatus,
                    'upcoming_payment' => ($subscription->cancel_at_period_end || in_array($subscription->status, ['canceled', 'unpaid'])) ? null : $stripeEnd,
                    'cancelled_at' => ($subscription->cancel_at_period_end || $subscription->status === 'canceled') ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : now()) : $existingForPeriod->cancelled_at,
                ]);

                return $existingForPeriod;
            }

            // MISSING LOCAL RECORD: Create it now
            $amount = $invoice ? ($invoice->amount_paid / 100) : ($subscription->plan->amount / 100);
            $currency = strtoupper($invoice ? $invoice->currency : $subscription->currency);

            $createData = [
                'user_id' => $resolvedUserId,
                'name' => $customer->name ?? 'Creator',
                'email' => $customer->email,
                'stripe_id' => $subscriptionId,
                'status' => $normalizedStatus,
                'currency' => $currency,
                'amount' => $amount,
                'upcoming_payment' => ($subscription->cancel_at_period_end || in_array($subscription->status, ['canceled', 'unpaid'])) ? null : $stripeEnd,
                'cancelled_at' => ($subscription->cancel_at_period_end || $subscription->status === 'canceled') ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : now()) : null,
                'current_start_subscription_date' => $stripeStart->toDateString(),
                'current_end_subscription_date' => $stripeEnd->toDateString(),
            ];

            if ($subscription->status === 'trialing' && ! $invoice) {
                $createData['current_start_trial_date'] = $stripeStart->toDateString();
                $createData['current_end_trial_date'] = $stripeEnd->toDateString();
                $createData['status'] = 'trialing';
                unset($createData['current_start_subscription_date'], $createData['current_end_subscription_date']);
            }

            $subs = MonthlyCharge::create($createData);

            if ($subs->user) {
                $syncUserSubscribed($subs->user, in_array($subscription->status, ['active', 'trialing']) ? 1 : 0);
            }

            Log::info('MonthlyCharge Sync: Created missing local record for sub', ['sub_id' => $subscriptionId, 'status' => $subscription->status]);

            return $subs;
        }

        return $subs;
    }

    /**
     * Deep sync for all subscription records (history) from Stripe invoices
     */
    public function syncSubscriptionHistory(Subscription $subscription, User $user)
    {
        try {
            $stripe = StripeControl::getClient();

            // 1. Fetch all invoices for this subscription (including $0 trial invoices)
            $invoices = $stripe->invoices->all([
                'subscription' => $subscription->id,
                'limit' => 50,
            ]);

            Log::info("UserProfileService: Syncing history for sub {$subscription->id} (Found ".count($invoices->data).' invoices)');

            $invoiceList = $invoices->data;
            $invoiceList = array_reverse($invoiceList);

            foreach ($invoiceList as $invoice) {
                // Sync each paid invoice as a separate MonthlyCharge record
                $this->syncMandatorySubscriptionStatus($subscription, 'invoice.payment_succeeded', $invoice, $user);
            }

            // 2. If the subscription has a trial, ensure we have a record for it
            if ($subscription->trial_start && $subscription->trial_end) {
                $this->syncMandatorySubscriptionStatus($subscription, 'customer.subscription.created', null, $user);
            }

            // 3. Final sync for the current subscription state (handles trial, cancellations, etc.)
            $this->syncMandatorySubscriptionStatus($subscription, 'manual_sync', null, $user);
        } catch (\Exception $e) {
            Log::error('UserProfileService: History sync failed: '.$e->getMessage());
        }
    }

    public function syncUserSubscription(User $user)
    {
        // 1. If we have a stripe_id, try to fetch it directly
        if ($user->stripe_id) {
            try {
                // We check both UK and US via getActiveSubscriptionByCustomer
                $stripeSubscription = StripeControl::getActiveSubscriptionByCustomer($user->stripe_id);
                if ($stripeSubscription) {
                    $this->syncSubscriptionHistory($stripeSubscription, $user);

                    return $stripeSubscription;
                }
            } catch (\Exception $e) {
                Log::warning("UserProfileService: Direct ID sync failed for user {$user->id}: ".$e->getMessage());
            }
        }

        // 2. If direct ID didn't yield a subscription, search by email across ALL accounts
        Log::info("UserProfileService: Searching for subscriptions by email for user {$user->id} ({$user->email})");
        $stripeCustomers = StripeControl::searchCustomerAcrossAccounts($user->email);

        foreach ($stripeCustomers as $customer) {
            try {
                $stripeSubscription = StripeControl::getActiveSubscriptionByCustomer($customer->id);
                if ($stripeSubscription) {
                    // Found an active subscription! Link this customer ID and sync.
                    if ($user->stripe_id !== $customer->id) {
                        $user->stripe_id = $customer->id;
                        $user->save();
                        Log::info("UserProfileService: Re-linked user {$user->id} to Stripe customer {$customer->id} ({$customer->account_region})");
                    }

                    $this->syncSubscriptionHistory($stripeSubscription, $user);

                    return $stripeSubscription;
                }
            } catch (\Exception $e) {
                Log::warning("UserProfileService: Error syncing customer {$customer->id}: ".$e->getMessage());
            }
        }

        // 3. If we still have nothing, handle the un-subscribed state
        // ⚠️ Under setup-mode checkout a creator legitimately has NO Stripe
        // subscription until their first sale — only a saved card. `subscription:sync`
        // runs every 15 minutes, so without this it would strip that creator's
        // subscribed flag on the next tick, every tick.
        $awaitingFirstSale = MonthlyCharge::where('user_id', $user->id)
            ->whereIn('status', ['trialing', 'trial_ending'])
            ->whereNull('first_sale_activated_at')
            ->whereNotNull('stripe_payment_method')
            ->exists();

        if ($user->is_subscribed && ! $awaitingFirstSale) {
            $user->is_subscribed = 0;
            $user->save();
        }

        // Also update any local MonthlyCharge record for this user that thinks it's active
        // since Stripe has confirmed there is no active subscription whatsoever.
        //
        // ⚠️ The same guard as above, and it is NOT optional. Under setup-mode
        // checkout a creator has a saved card and no Stripe subscription until
        // their first sale, so this sweep — every 15 minutes — found "no
        // subscription" and expired the row. The creator was then told to add a
        // card they had already added. Guarding only the is_subscribed flag above
        // and not this write left exactly that bug.
        if (! $awaitingFirstSale) {
            MonthlyCharge::where('user_id', $user->id)
                ->whereIn('status', ['paid', 'active', 'trialing', 'trial_ending', 'renew'])
                ->update([
                    'status' => 'expired',
                    'upcoming_payment' => null,
                    'updated_at' => now(),
                ]);
        }

        return null;
    }

    public function getOptimizedPiggyPots(int $userId, bool $isOwner, bool $onlyPinned = true): array
    {
        $query = PiggyPot::where('user_id', $userId)
            ->withSum(['contributions as total_raised' => function ($query) {
                $query->where('status', 'paid');
            }], 'amount');

        if ($isOwner) {
            // The creator sees their whole shelf, closed pots included — hiding a
            // creator's own row from them reads as data loss, and the dashboard is
            // where they go to fix a lapsed deadline.
            $query->whereIn('status', ['active', 'completed', 'expired', 'moderation_hold']);
        } else {
            // ⚠️ A status filter alone is NOT enough here. `expired` is written by
            // an hourly sweep, so a pot whose deadline passed at midnight is still
            // `active` until it runs — and `completed` was public despite being
            // refused at checkout. Either way the profile advertised a pot that
            // took the visitor to "this content is no longer available".
            // PiggyPotStatusService is the single definition both halves read.
            PiggyPotStatusService::scopePubliclyVisible($query);
        }

        // The profile's featured slot shows the pinned pot. A creator who has
        // never pinned one — which is now every creator, because a pot is held
        // for review at creation and cannot be pinned while it is invisible —
        // would otherwise have an empty slot even with live pots, and their
        // freshly approved pot would appear nowhere until they went and pinned
        // it by hand. Falling back to the newest live pot keeps the slot honest.
        //
        // ⚠️ Both branches run AFTER the visibility filter, so a pinned pot that
        // has closed no longer wins the slot and silences the fallback — which is
        // exactly how a creator's profile ended up featuring a pot that closed
        // months earlier.
        if (! $isOwner && $onlyPinned) {
            $pinned = (clone $query)->where('is_pinned', true)->exists();

            if ($pinned) {
                $query->where('is_pinned', true);
            } else {
                // Explicitly ordered: the base query has no order of its own, so
                // "the newest" would otherwise be whatever the database returned
                // first.
                $query->latest()->limit(1);
            }
        }

        $token = $this->getProfileCacheToken($userId);
        $cacheKey = 'user_piggy_pots_'.$userId.'_'.($isOwner ? 'owner' : 'public').'_'.($onlyPinned ? 'pinned' : 'all').'_v'.$token;

        return Cache::remember($cacheKey, 300, function () use ($query) {
            return $query->get()->toArray();
        });
    }

    public function getPiggyPotTopSupporters(int $userId): array
    {
        $isOwner = Auth::check() && Auth::id() === $userId;
        $token = $this->getProfileCacheToken($userId);
        $cacheKey = 'user_piggy_pot_top_supporters_'.$userId.'_v'.$token;

        $callback = function () use ($userId) {
            // Rank by activity (number of purchases), never by amount given — Stripe
            // compliance: the leaderboard must show most-active supporters, not a
            // donation/spend race.
            $userTotals = PiggyPotContribution::query()
                ->where('creator_id', $userId)
                ->where('status', 'paid')
                ->where('is_anonymous', 0)
                ->whereNotNull('user_id')
                ->selectRaw('user_id, COUNT(*) as purchases')
                ->groupBy('user_id')
                ->orderByDesc('purchases')
                ->limit(10)
                ->get();

            $users = User::whereIn('id', $userTotals->pluck('user_id')->all())
                ->get(['id', 'name', 'username', 'avatar', 'avatar_cdn_modifier', 'avatar_approved'])
                ->keyBy('id');

            // Engagement Level chips, resolved for the whole list in one pass. Same
            // VipScoreService the gifter hub and public leaderboard use, so a
            // supporter's badge reads the same wherever it appears.
            $badges = app(VipScoreService::class)
                ->badgesFor($userTotals->pluck('user_id')->all());

            $top = [];
            foreach ($userTotals as $row) {
                $u = $users->get($row->user_id);
                $top[] = [
                    'name' => $u ? $u->name : 'User',
                    'username' => $u ? $u->username : null,
                    'purchases' => (int) $row->purchases,
                    'avatar' => $u ? $u->avatar_url : null,
                    'vip' => $badges[$row->user_id] ?? null,
                ];
            }

            $guestTotals = PiggyPotContribution::query()
                ->where('creator_id', $userId)
                ->where('status', 'paid')
                ->where('is_anonymous', 0)
                ->whereNull('user_id')
                ->selectRaw('LOWER(TRIM(COALESCE(guest_email, guest_name))) as guest_key, MAX(guest_name) as guest_name, COUNT(*) as purchases')
                ->groupBy('guest_key')
                ->orderByDesc('purchases')
                ->limit(10)
                ->get();

            foreach ($guestTotals as $row) {
                $top[] = [
                    'name' => $row->guest_name ?: 'Guest',
                    'username' => null,
                    'purchases' => (int) $row->purchases,
                    'avatar' => null,
                ];
            }

            $anonymousCount = (int) PiggyPotContribution::query()
                ->where('creator_id', $userId)
                ->where('status', 'paid')
                ->where('is_anonymous', 1)
                ->count();

            if ($anonymousCount > 0) {
                $top[] = [
                    'name' => 'Anonymous',
                    'username' => null,
                    'purchases' => $anonymousCount,
                    'avatar' => null,
                ];
            }

            usort($top, function ($a, $b) {
                return $b['purchases'] <=> $a['purchases'];
            });

            return array_slice($top, 0, 10);
        };

        $ttl = $isOwner ? 30 : 300;

        return Cache::remember($cacheKey, $ttl, $callback);
    }

    public function getPiggyPotFeed(int $userId): array
    {
        $isOwner = Auth::check() && Auth::id() === $userId;
        $token = $this->getProfileCacheToken($userId);
        $cacheKey = 'user_piggy_pot_feed_'.$userId.'_v'.$token;

        $callback = function () use ($userId) {
            return PiggyPotContribution::select(['id', 'creator_id', 'user_id', 'guest_name', 'is_anonymous', 'amount', 'currency', 'message', 'created_at', 'piggy_pot_id'])
                ->with(['user:id,name,username,avatar,avatar_cdn_modifier,avatar_approved', 'piggyPot:id,title'])
                ->where('creator_id', $userId)
                ->where('status', 'paid')
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($item) {
                    $name = $item->is_anonymous ? 'Anonymous' : ($item->user ? $item->user->name : ($item->guest_name ?? 'Guest'));

                    return [
                        'id' => $item->id,
                        'name' => $name,
                        'username' => $item->is_anonymous ? null : ($item->user ? $item->user->username : null),
                        'amount' => $item->amount,
                        'currency' => $item->currency,
                        'message' => $item->message,
                        'created_at' => $item->created_at,
                        'pot_title' => $item->piggyPot ? $item->piggyPot->title : 'Goal',
                    ];
                })->toArray();
        };

        $ttl = $isOwner ? 30 : 300;

        return Cache::remember($cacheKey, $ttl, $callback);
    }
}

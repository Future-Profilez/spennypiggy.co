<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Verify2FARequest;
use App\Jobs\SendContractMail;
use App\Models\AuthRedirect;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\FanContract;
use App\Models\GifterCardVerification;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\Notification;
use App\Models\Post;
use App\Models\RyeProduct;
use App\Models\Shop;
use App\Models\SocialLinks;
use App\Models\StripePaymentDetail;
use App\Models\TipGoalsPayment;
use App\Models\TwitterToken;
use App\Models\User;
use App\Models\UserBackupCode;
use App\Models\UserCategory;
use App\Models\UserIntro;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Models\FounderBonus;
use App\Models\Deliverable;
use App\Providers\RouteServiceProvider;
use App\SeoMeta;
use App\StripeControl;
use App\TwitterAuthService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FALaravel\Google2FA;
use PragmaRX\Recovery\Recovery;
use Ramsey\Uuid\Uuid;
use Uploadcare\Configuration;
use Uploadcare\Uploader\Uploader;

class AuthenticatedSessionController extends Controller
{
    protected $google2FA;
    protected $profileService;

    public function __construct(Google2FA $google2FA, \App\Services\UserProfileService $profileService)
    {
        $this->google2FA = $google2FA;
        $this->profileService = $profileService;
    }

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();
        $user = Auth::user();
        if ($user->suspended_account == 1) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return response()->json([
                'status' => false,
                'message' => 'Your account is suspended. Please contact support.'
            ], 403);
        }
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => true,
            'message' => 'Logged in successfully',
            'user' => $user,
            'redirect_url' => route('user.show', ['username' => $user->username])
        ]);
    }

    // public function store(LoginRequest $request)
    // {
    //     //saving the google secret of an particular user

    //     $request->authenticate();
    //     $request->session()->regenerate();
    //     $request->session()->regenerateToken();
    //     $user = Auth::user();

    //     $secret = $this->google2FA->generateSecretKey();
    //     if (empty($user->tfa_key) && $user->role == 1) {
    //         $user->tfa_key = $secret;
    //         $user->save();
    //     }
    //     $ipAddress = $request->ip();
    //     $checkIpExist = $user->ip_address;
    //     if (empty($checkIpExist) && $user instanceof \App\Models\User) {
    //         $user->ip_address = $ipAddress;
    //         $user->save();
    //     }

    //     // $auth = AuthRedirect::create([
    //     //     "user_id"   =>  $user->id,
    //     //     'country'   =>  $user->country,
    //     //     'origin'    =>  'localhost',
    //     //     'target'    =>  'localhost',
    //     // ]);
    //     // Auth::logout();
    //     // return Inertia::location("http://localhost:8000/verify-token/{$auth->uuid}");
    //     // if()
    //     // if ($request->getHttpHost() == "uk.spennypiggy.co" and $user->country != "GB") {
    //     //     // return Inertia::location("https://spennypiggy.com/{$user->username}");
    //     //     $auth = AuthRedirect::create([
    //     //         "user_id"   =>  $user->id,
    //     //         'country'   =>  $user->country,
    //     //         'origin'    =>  $request->getHttpHost(),
    //     //         'target'    =>  'spennypiggy.co',
    //     //     ]);
    //     //     Auth::logout();
    //     //     return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
    //     // } else
    //     // if (!in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
    //     //     // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
    //     //     $auth = AuthRedirect::create([
    //     //         "user_id"   =>  $user->id,
    //     //         'country'   =>  $user->country,
    //     //         'origin'    =>  $request->getHttpHost(),
    //     //         'target'    =>  'uk.spennypiggy.co',
    //     //     ]);
    //     //     Auth::logout();
    //     //     return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
    //     // }

    //     // Handle JSON requests differently
    //     if ($request->expectsJson()) {
    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Logged in successfully.',
    //             'redirect_url' => route('user.show', ['username' => $user->username])
    //         ]);
    //     }

    //     return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
    // }


    public function verifyUser(Request $request)
    {

        $user = User::where('email', $request->email)->first();

        if (empty($user)) {
            return response()->json([
                'status' => false,
                'msg' => "No account exist with this email."
            ]);
        }

        $is_2fa = false;
        if ($user->is_2fa) {
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => false,
                    'msg' => "Either email or password is wrong."
                ]);
            }
            $is_2fa = true;
        }

        return response()->json([
            'status' => true,
            'is_2fa' => $is_2fa
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Log::info('AuthSession: Logout Triggered', [
            'user_id' => Auth::id(),
            'session_id' => $request->session()->getId(),
            'ip' => $request->ip()
        ]);

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect(route("login"))->with("success", "Logged out successfully.");
    }

    /**
     * Private user profile info
     */
    /**
     * Optimized user profile method with better performance
     */
    public function getUserProfile($username, $page = 'about')
    {
        $getData = function () use ($username, $page) {
            $profileData = $this->profileService->preloadUserProfileData($username);
            if (empty($profileData)) {
                return ['__page' => 'NotFound'];
            }

            $user = $profileData['user'];

            if ($user->suspended_account == 1) {
                return ['__page' => 'Suspanded'];
            }

            $pageData = $this->getPageSpecificData($user->id, $page);

            $this->setSeoMetaTags($user, $username);

            $sociallinks = null;
            $userIntro = null;
            $isNeedToUpgrade = false;
            $cardCapabilities = true;
            $stripeRequirements = [];

            if ($user->role == 1 && !empty($user->account_id)) {
                [$isNeedToUpgrade, $cardCapabilities, $stripeRequirements] = $this->getStripeCapabilities($user);
            }
            $sociallinks = SocialLinks::where('user_id', $user->id)->first();
            if ($page == 'about') {
                $userIntro = $user->intro;
            }

            $migrationStatus = $this->getMigrationStatus($user);
            $founderData = $this->getFounderData($user);

            $isBlocked = false;
            if (Auth::check() && Auth::id() !== $user->id) {
                $isBlocked = \App\Models\UserBlock::where('creator_id', Auth::id())
                    ->where('blocked_id', $user->id)
                    ->exists();
            }

                return [
                    '__page' => 'Dashboard',
                    'username' => $username,
                    'user' => $user,
                    'itemid' => request()->query('item') ?? false,
                    'card_capabilities' => $cardCapabilities,
                    'has_stripe_account' => !empty($user->account_id),
                    'isNeedToUpgrade' => $isNeedToUpgrade,
                    'stripe_requirements' => $stripeRequirements,
                'migration_status' => $migrationStatus,
                'sociallinks' => $sociallinks,
                'slinks' => $sociallinks,
                'intro' => $userIntro,
                'supporters' => $profileData['supporters'],
                'wish_categories' => $this->getCategoriesWithItems($user),
                'all_user_categories' => Auth::check() && Auth::id() === $user->id ? $user->user_categories()->get() : [],
                'selectedCategory' => request()->query('category') ?? false,
                'page' => $page,
                'is_blocked' => $isBlocked,
                'first30DayEarnings' => $founderData['first30DayEarnings'],
                ...$pageData
            ];
        };
        // dd($getData());

        if (Auth::check()) {
            $data = $getData();
        } else {
            $cacheKey = 'profile_' . $username . '_' . $page . '_' . md5(json_encode(request()->all()));
            $data = Cache::remember($cacheKey, 600, $getData);
        }

        if (($data['__page'] ?? null) === 'NotFound') {
            return Inertia::render('NotFound');
        }
        if (($data['__page'] ?? null) === 'Suspanded') {
            return Inertia::render('Suspanded');
        }
        $pageName = $data['__page'] ?? 'Dashboard';
        unset($data['__page']);
        return Inertia::render($pageName, $data);
    }




    /**
     * Get Stripe account capabilities with caching
     */
    private function getStripeCapabilities($user): array
    {
        if (empty($user->account_id)) {
            return [false, false, []];
        }

        // Removed caching
        try {
            $account = StripeControl::getAccount($user->account_id);

            // Use the proper migration check to determine if upgrade is needed
            $migrationCheck = StripeController::checkAccountMigrationNeeds($user);
            $isNeedToUpgrade = $migrationCheck['needs_migration'] ?? false;

            $cardCapabilities = StripeControl::isAccountReadyForCheckout($user->account_id);

            // Get comprehensive account requirements
            $requirements = StripeControl::getAccountRequirements($user->account_id);

            // Add migration requirement if account needs upgrade
            if ($isNeedToUpgrade) {
                $requirements['has_requirements'] = true;
                $requirements['requirements'][] = [
                    'type' => 'legacy_upgrade',
                    'severity' => 'high',
                    'title' => 'Account Upgrade Required',
                    'message' => 'Your Stripe account needs to be upgraded to the latest version to receive card payments.',
                    'action' => 'Upgrade your Stripe account now.',
                    'action_url' => '/stripe/upgrade-express-account'
                ];
            }

            return [$isNeedToUpgrade, $cardCapabilities, $requirements];
        } catch (\Exception $e) {
            // Update user if account is invalid
            $user->update(['stripe_details_submitted' => 0]);
            return [false, false, [
                'has_requirements' => true,
                'requirements' => [[
                    'type' => 'connection_error',
                    'severity' => 'critical',
                    'title' => 'Account Connection Issue',
                    'message' => 'Unable to check your Stripe account status. Please try again or contact support.',
                    'action' => 'Refresh the page or contact support.',
                    'action_url' => null
                ]],
                'account_status' => []
            ]];
        }
    }

    /**
     * Get only user categories that have at least one wish item.
     * For public viewers (not the owner), only count approved items.
     */
    private function getCategoriesWithItems($user)
    {
        $callback = function () use ($user) {
            $isPublicView = (auth()->check() && auth()->id() !== $user->id) || !auth()->check();
            
            $categoryIds = \App\Models\WishCategory::whereHas('wish', function ($q) use ($user, $isPublicView) {
                $q->where('user_id', $user->id);
                // For both public and owner, only show categories with approved items
                // This matches the user's request to only show categories with items (meaning visible items)
                $q->where('is_approved', 1);
            })->pluck('user_category_id')->unique()->filter();

            // Return the filtered categories as a collection
            return $user->user_categories()->whereIn('id', $categoryIds)->get();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_categories_with_items_' . $user->id, 600, $callback);
    }

    /**
     * Check if user's Stripe account needs migration for cross-border payments
     */
    private function getMigrationStatus($user): array
    {
        // Only check for logged-in users viewing their own profile
        if (!Auth::check() || Auth::id() !== $user->id) {
            return ['needs_migration' => false, 'show_warning' => false];
        }

        // Removed caching
        try {
            $migrationCheck = StripeController::checkAccountMigrationNeeds($user);

            return [
                'needs_migration' => $migrationCheck['needs_migration'] ?? false,
                'show_warning' => $migrationCheck['needs_migration'] ?? false,
                'current_agreement' => $migrationCheck['current_agreement'] ?? null,
                'required_agreement' => $migrationCheck['required_agreement'] ?? null,
                'country' => $migrationCheck['country'] ?? $user->country,
                'reason' => $migrationCheck['reason'] ?? 'Account check not available'
            ];
        } catch (\Exception $e) {
            return [
                'needs_migration' => false,
                'show_warning' => false,
                'error' => 'Unable to check migration status'
            ];
        }
    }

    /**
     * Get page-specific data efficiently
     */
    private function getPageSpecificData(int $userId, string $page): array
    {
        $data = [
            'items' => [],
            'posts' => [],
            'memberships' => [],
            'bills' => [],
            'shops' => [],
            'tasks' => []
        ];

        switch ($page) {
            case 'tasks':
                $data['tasks'] = $this->profileService->getOptimizedTasks($userId, Auth::id() === $userId);
                break;

            case 'wishes':
                $categoryId = request()->query('category');
                $data['items'] = $this->profileService->getUserWishItems($userId, $categoryId);
                break;

            case 'feed':
            case 'about':
                $data['posts'] = $this->profileService->getUserPosts($userId);
                break;

            case 'memberships':
                $data['memberships'] = $this->profileService->getUserMemberships($userId);
                break;

            case 'bills':
                $data['bills'] = $this->profileService->getUserBills($userId);
                break;

            case 'shop':
                $data['shops'] = $this->profileService->getUserShopItems($userId);
                break;
        }

        return $data;
    }

    /**
     * Set SEO meta tags
     */
    private function setSeoMetaTags($user, string $username): void
    {
        $image = $user->social_image ? "https://ucarecdn.com/{$user->social_image}/-/preview/" : null;

        SeoMeta::addTag('title', "{$user->name} - Spenny Piggy - Financial Gifts, Exclusive Content & Memberships");
        SeoMeta::addTag('meta', ['property' => 'twitter:title', 'content' => 'Financial Gifts,Donations & Memberships']);
        SeoMeta::addTag('meta', ['property' => 'twitter:card', 'content' => 'summary_large_image']);
        SeoMeta::addTag('meta', ['property' => 'twitter:description', 'content' => 'Send tributes, adopt bills & more. Safe for Spicy Creators who receive 100% payouts!']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image', 'content' => $image]);
        SeoMeta::addTag('meta', ['property' => 'twitter:site', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['property' => 'twitter:creator', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image:alt', 'content' => 'Financial Gifts,Donations & Memberships']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image:src', 'content' => $image]);
        SeoMeta::addTag('meta', ['property' => 'og:image', 'content' => $image]);
        SeoMeta::addTag('link', ['rel' => 'canonical', 'href' => "https://spennypiggy.co/{$username}"]);
    }


    public function usergoal($username)
    {
        $user = $this->profileService->getUserWithRelations($username);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ]);
        }

        $earnings = $this->profileService->getUserEarnings($user->id);

        return response()->json([
            "success" => true,
            "goal" => [
                'fullfilled' => $earnings['fulfilled'],
                'target' => $earnings['target'],
                'currency' => $user->default_currency,
            ]
        ]);
    }

    /**
     * Get User Wish Items
     *
     * @param string $username Username
     * @param int   $category_id Category Id
     * @return mixed
     */
    public function userItems($username, $category_id = null)
    {
        $user = User::firstWhere('username', $username);

        if ($user) {
            $query = $user->wishItems()
                ->when($category_id, function ($query) use ($category_id) {
                    // If $categoryID is specified, filter by the specific category
                    $query->whereHas('wishCategories', function ($query) use ($category_id) {
                        $query->where('user_category_id', $category_id);
                    });
                });

            if ((Auth::check() && $user->id != Auth::id()) || !(Auth::check())) {
                $query->where('is_approved', 1);
            }
            // ->orderBy('is_pin', 'DESC')
            $items = $query->orderBy('sort', 'ASC')
                ->latest()
                ->get();

            // $count = 1;
            // $items->map(function ($item) use ($count) {
            //     $item->key = $count;
            //     $count++;

            //     return $item;
            // });

            return response()->json([
                'success'   => true,
                'items'     =>  $items
            ]);
        }
        return response()->json([
            'success'   => false,
            'items'     => [],
            'message'   =>  'User not found'
        ]);
    }

    public function user_category($username)
    {
        try {
            $user = User::where('username', $username)->first();
            $categories = [];
            if (!empty($user)) {
                $categories = $user->user_categories()->get();
                // $categories = UserCategory::whereUserId($user->id)->latest()->get();
            }
            return response()->json([
                "success" => true,
                "categories" => $categories,
            ]);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function user_shop_category($username)
    {
        $user = User::where('username', $username)->first();
        $categories = [];
        if (!empty($user)) {
            $categories = $user->user_shop_categories()->get();
        }
        return response()->json([
            "success" => true,
            "categories" => $categories,
        ]);
    }

    public function userGiftItems($username)
    {
        $authUser = Auth::user(); // Get the logged-in user

        $user = User::firstWhere('username', $username);

        if (!$user) {
            return response()->json([
                'success' => false,
                'items'   => [],
                'message' => 'User not found'
            ]);
        }

        // Initialize query for fetching products
        $query = RyeProduct::where('creator_id', $user->id);

        // If the authenticated user is not the owner, include soft-deleted products
        if (isset($authUser) && isset($user)) {
            if ($authUser->id == $user->id) {
                $query->withTrashed();
            }
        }

        $allProducts = $query->get();

        return response()->json([
            'success' => true,
            'items'   => $allProducts
        ]);
    }

    public function sociallinks($username)
    {
        try {
            $user = User::where('username', $username)->first();
            $slinks = [];
            $sociallinks = [];
            if (!empty($user)) {
                $slinks = $user->social_links()->first();
                if (!empty($slinks)) {
                    $sociallinks = [
                        [
                            'social' => 'facebook',
                            'url'    => $slinks->facebook ?? null,
                        ],
                        [
                            'social' => 'twitter',
                            'url'    => $slinks->twitter ?? null,
                        ],
                        [
                            'social' => 'instagram',
                            'url'    => $slinks->instagram ?? null,
                        ],
                        [
                            'social' => 'reddit',
                            'url'    => $slinks->reddit ?? null,
                        ],
                        [
                            'social' => 'youtube',
                            'url'    => $slinks->youtube ?? null,
                        ],
                        [
                            'social' => 'tumblr',
                            'url'    => $slinks->tumblr ?? null,
                        ],
                        [
                            'social' => 'twitch',
                            'url'    => $slinks->twitch ?? null,
                        ],
                        [
                            'social' => 'other',
                            'url'    => $slinks->other ?? null,
                        ]
                    ];
                }
            } else {
                return response()->json([
                    "success" => false,
                    "msg" => 'User not found !!'
                ]);
            }




            return response()->json([
                "success" => true,
                // "sociallinks" => $sociallinks,
                // "slinks" => $slinks
            ]);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function checkUserName($username)
    {
        try {
            if (preg_match("/^[a-z0-9_]+$/", $username)) {
                // Username contains only lowercase letters, numbers, and underscores
                $user = User::where('username', $username)->first();
                if (!empty($user)) {
                    return response()->json(['status' => false, 'msg' => 'Username is not available']);
                } else {
                    return response()->json(['status' => true, 'msg' => 'Username is available']);
                }
            } else {
                // Username contains spaces, special characters, or capital letters
                return response()->json(['status' => false, 'msg' => 'Username should contains only lowercase letters, numbers, and underscores']);
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function unlinkTwitter()
    {
        $user = User::where('id', Auth::id())->first();

        if (!empty($user->twitter_token)) {
            //     $req = TwitterAuthService::revokeToken($user->twitter_token);
            //     return response()->json($req);
            // if($req->successful()){
            $user->twitter_token->delete();

            return back()->with('success', 'Twitter unlinked successfully.');
            // }

            // return back()->with('error','Something Went Wrong.');
        }

        return back()->with('error', 'No linked twitter account found.');
    }

    /**
     * Handle Redirect from cross domain
     *
     */
    public function authRedirects(Request $request, $token)
    {
        $ref = $request->header('Referer', 'http://localhost:8000/');
        if (!$ref) {
            // RateLimiter::hit($request->throttleKey())
            return to_route('home')->with('error', 'Invalid redirection or parameters!');
        }

        $ref = parse_url($ref);
        $origin = $ref['host'];
        $token = AuthRedirect::whereUuid($token)
            ->whereNull('used_at')
            ->where('target', $request->getHttpHost())
            ->where('origin', $origin)
            ->first();

        if (!$token) {
            abort(404, "Not Found!");
        }

        if (!$token->created_at->isAfter(Carbon::now()->subMinutes(2))) {
            return to_route('home')->with('error', 'Link Expired!');
        }
        // return response()->json([
        //     'sucess'    => true,
        //     'ref'    => $ref,
        //     'token'     => $token
        // ]);

        $user = User::firstWhere('id', $token->user_id);
        if (!$user) {
            return to_route('home')->with('error', 'Link is invalid!');
        }

        Auth::login($user, true);
        $request->session()->regenerate();
        $token->update([
            'used_at'   =>  Carbon::now()
        ]);
        $token->delete();
        return to_route('user.show', ['username' => $user->username])->with('success', 'Welcome back. Login successfull.');
    }

    public function updateVat($percent)
    {
        $user = User::where('id', Auth::id())->first();

        $user->vat_amount_percentage = $percent;
        $user->save();

        return response()->json([
            'success'   => true,
            'message'   =>  'Vat updated successfully'
        ]);
    }

    /**
     * Verify 2FA OTP
     *
     * @param \App\Http\Requests\Verify2FARequest $verify2faRequest
     * @return \Illuminate\Http\Response JSON
     */
    public function verify2FA(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        $otp = $request->input('otp');
        $backup_code = $request->input('backup_code');



        if (!empty($otp)) {
            $valid = $this->google2FA->verifyKey($user->tfa_key, $otp);
        }

        if (!empty($backup_code)) {
            $valid = false;
            $backup = UserBackupCode::where('user_id', $user->id)->get();
            foreach ($backup as $key => $value) {
                $code = decrypt($value->code);
                if ($code == $backup_code) {
                    $valid = true;
                    $value->delete();
                }
            }
        }

        if ($valid) {
            // $request->authenticate();
            $credentials = [
                'email' => $email,
                'password' => $password,
            ];
            if (Auth::attempt($credentials)) {

                $request->session()->regenerate();
                $user = Auth::user();

                if ($request->getHttpHost() == "uk.spennypiggy.co" and $user->country != "GB") {
                    // return Inertia::location("https://spennypiggy.com/{$user->username}");
                    $auth = AuthRedirect::create([
                        "user_id"   =>  $user->id,
                        'country'   =>  $user->country,
                        'origin'    =>  $request->getHttpHost(),
                        'target'    =>  'spennypiggy.co',
                    ]);

                    Auth::logout();
                    // return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
                    return response()->json([
                        'status' => true,
                        'redirect_url' => "https://spennypiggy.co/verify-token/{$auth->uuid}",
                        'message' => 'Redirecting...'
                    ]);
                } else if (!in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
                    // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
                    $auth = AuthRedirect::create([
                        "user_id"   =>  $user->id,
                        'country'   =>  $user->country,
                        'origin'    =>  $request->getHttpHost(),
                        'target'    =>  'uk.spennypiggy.co',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]);

                    Auth::logout();
                    // return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
                    return response()->json([
                        'status' => true,
                        'redirect_url' => "https://uk.spennypiggy.co/verify-token/{$auth->uuid}",
                        'message' => 'Redirecting...'
                    ]);
                }
                // return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
                return response()->json([
                    'status' => true,
                    'redirect_url' => route("user.show", ['username' => $user->username]),
                    'message' => 'Logged in successfully.'
                ]);
            } else {
                // return back()->with("error", "Unable to login.");
                return response()->json([
                    'status' => false,
                    'msg' => "Unable to login."
                ]);
            }
        } else {
            if (!empty($otp)) {
                $text = 'OTP';
            } else {
                $text = 'Backup Code';
            }
            // return back()->with("error", "$text is invalid.");
            return response()->json([
                'status' => false,
                'msg' => "$text is invalid."
            ]);
        }
    }

    /**
     * Generating the backup codes for 2fa
     *
     * @return \Illuminate\Http\Response json
     */
    public function generateBackupCode()
    {
        $user = User::findOrFail(Auth::id());

        $recovery = new Recovery();
        $codes = $recovery->setCount(5)->toCollection();
        UserBackupCode::where('user_id', $user->id)->delete();
        foreach ($codes as $key => $value) {
            $backup = new UserBackupCode();
            $backup->user_id = $user->id;
            $backup->code = encrypt($value);
            $backup->save();
        }
        return response()->json([
            'status' => true,
            'tfa'  => true,
            'msg' => 'Open your authenticator app to get security code.',
            'qr' => request()->query('type') == 1 ? $this->twofQR($user->id) : null,
            'backup_codes' => $codes ?? null
        ], 200);
    }

    /**
     * Sign Contract
     *
     * @param Request $request
     * @return JSON
     */
    public function signContract(Request $request)
    {
        // $request->validate([
        //     'sign' => [
        //         'required',
        //         'regex:/data:image\/\w+;base64,/i'
        //     ],
        //     'name' => [
        //         'sometimes',
        //         'required',
        //         'string',
        //         'min:5'
        //     ]
        // ], [
        //     'sign.required' => 'Please sign on the contract.',
        //     'sign.rejex' => 'Signature is not in a valid format.',
        //     'name.required' => 'Please enter your real name.',
        // ]);

        $name = $request->query('name');

        $sign = $request->query('sign');

        $user = User::where('id', Auth::guard('sanctum')->id())->first();

        $contract = new FanContract();
        $contract->user_id = $user->id;
        $contract->name = $name ?? $user->name;
        $contract->sign = $sign;
        $contract->save();

        if (class_exists('Mccarlosen\LaravelMpdf\Facades\LaravelMpdf')) {
            $pdf = \Mccarlosen\LaravelMpdf\Facades\LaravelMpdf::loadView('pdf.creator-contract', [
                'contract' => $contract
            ]);

            $pdfContent = $pdf->output();

            // Upload the PDF to Uploadcare
            $configuration = Configuration::create((string) $_ENV['UPLOADCARE_PUBLIC_KEY'], (string) $_ENV['UPLOADCARE_SECRET_KEY']);
            $uploader = new Uploader($configuration);

            $fileInfo = $uploader->fromContent($pdfContent, 'application/pdf', Uuid::uuid4() . ".pdf");

            $contract->document = $fileInfo->getUuid();
        } else {
            // TODO: Install mccarlosen/laravel-mpdf to enable PDF generation
            Log::error('LaravelMpdf package missing. Contract PDF not generated.');
        }

        $contract->status = 1;
        $contract->save();
        $contract->refresh();

        SendContractMail::dispatch($contract, 'creator', $contract->url);
        // unlink($tempPdfPath);

        return to_route('user.show', ['username' => $contract->user->username])->with('success', 'Thank you for signing the contract.');
        // return response()->json([
        //     'status' => true,
        //     'msg'    => 'Thank you for signing the contract.',
        //     'contract' => $contract->url
        // ]);
    }

    /**
     * Get founder bonus data for a user
     */
    private function getFounderData($user): array
    {
        $first30DayEarnings = 0;

        // Calculate first 30-day earnings for the user
        if ($user) {
            $createdAt = $user->created_at;
            $thirtyDaysAfterCreation = $createdAt->copy()->addDays(30);

            // Get total earnings from deliverables within first 30 days
            $first30DayEarnings = Deliverable::where('creator_id', $user->id)
                ->where('created_at', '>=', $createdAt)
                ->where('created_at', '<=', $thirtyDaysAfterCreation)
                ->where('status', 'delivered')
                ->sum('transaction_amount');
        }

        return [
            'first30DayEarnings' => $first30DayEarnings
        ];
    }
}

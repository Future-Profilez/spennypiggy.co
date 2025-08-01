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
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf;
use PragmaRX\Google2FALaravel\Google2FA;
use PragmaRX\Recovery\Recovery;
use Ramsey\Uuid\Uuid;
use Uploadcare\Configuration;
use Uploadcare\Uploader\Uploader;

class AuthenticatedSessionController extends Controller
{

    protected $google2FA;

    public function __construct(Google2FA $google2FA)
    {
        $this->google2FA = $google2FA;
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
        //saving the google secret of an particular user

        $request->authenticate();
        $request->session()->regenerate();
        $user = Auth::user();

        $secret = $this->google2FA->generateSecretKey();
        if (empty($user->tfa_key) && $user->role == 1) {
            $user->tfa_key = $secret;
            $user->save();
        }
        $ipAddress = $request->ip();
        $checkIpExist = $user->ip_address;
        if (empty($checkIpExist) && $user instanceof \App\Models\User) {
            $user->ip_address = $ipAddress;
            $user->save();
        }

        // $auth = AuthRedirect::create([
        //     "user_id"   =>  $user->id,
        //     'country'   =>  $user->country,
        //     'origin'    =>  'localhost',
        //     'target'    =>  'localhost',
        // ]);
        // Auth::logout();
        // return Inertia::location("http://localhost:8000/verify-token/{$auth->uuid}");
        // if()
        // if ($request->getHttpHost() == "uk.spennypiggy.co" and $user->country != "GB") {
        //     // return Inertia::location("https://spennypiggy.com/{$user->username}");
        //     $auth = AuthRedirect::create([
        //         "user_id"   =>  $user->id,
        //         'country'   =>  $user->country,
        //         'origin'    =>  $request->getHttpHost(),
        //         'target'    =>  'spennypiggy.co',
        //     ]);
        //     Auth::logout();
        //     return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
        // } else
        // if (!in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
        //     // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
        //     $auth = AuthRedirect::create([
        //         "user_id"   =>  $user->id,
        //         'country'   =>  $user->country,
        //         'origin'    =>  $request->getHttpHost(),
        //         'target'    =>  'uk.spennypiggy.co',
        //     ]);
        //     Auth::logout();
        //     return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
        // }
        return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
    }


    public function verifyUser(Request $request)
    {

        $user = User::where('email', $request->email)->where('is_uk', 0)->first();

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
    public function destroy(): RedirectResponse
    {
        Auth::guard('web')->logout();
        // $request->session()->invalidate();
        // $request->session()->regenerateToken();
        return redirect(route("login"))->with("success", "Logged out successfully.");
    }

    /**
     * Private user profile info
     */
    public function getUserProfile($username, $page = 'about')
    {
        $user = User::with([
            'social_links', 'followers', 'following', 'wishItems', 'user_categories', 'memberships', 'bills', 'shop', 'intro'
        ])->where('username', $username)->where('is_uk', 0)->first();



        if (!empty($user)) {
            if ($user->suspended_account == 1) {
                return Inertia::render('Suspanded');
            }
        }
        
        if (!$user || !Auth::check()){
            return Inertia::render('NotFound');
        }

        $authUser = Auth::id();
        $notification_count = Cache::remember("notifications_{$authUser}", 60, fn () => Notification::where('notifiable_id', $authUser)->where('is_read', 0)->count());

        $support_user_ids = TipGoalsPayment::where('creator_id', $user->id)->where('status', 'paid')->pluck('user_id')->filter()->toArray();
        $guest_emails = TipGoalsPayment::where('creator_id', $user->id)->where('status', 'paid')->whereNull('user_id')->pluck('guest_email');

        $guest_ids = User::whereIn('email', $guest_emails)->where('is_uk', 0)->pluck('id')->toArray();
        $supporters = count(array_unique(array_merge($support_user_ids, $guest_ids, $guest_emails->diff($guest_ids)->toArray())));
        $image = $user->social_image ? "https://ucarecdn.com/{$user->social_image}/-/preview/" : null;
        $IsNeedToUpgrade = false;
        $card_capabilities = true;
        if (!empty($user->account_id)) {
            try {
                $account = StripeControl::getAccount($user->account_id);
                $IsNeedToUpgrade = ($account->tos_acceptance->service_agreement ?? '') === 'recipient';
                $card_capabilities = StripeControl::isAccountReadyForCheckout($user->account_id);
            } catch (\Exception $e) {
                $user->stripe_details_submitted = 0;
                $user->save();
                $IsNeedToUpgrade = false;
                $card_capabilities = true;
            }
        }

        $wishitems = [];
        if ($page === 'wishes') {
            $category = request()->query('category');
            $wishitems = WishItem::where('user_id', $user->id)
                ->when($category && $category !== 'all', function ($query) use ($category) {
                    $query->whereHas('categories', fn ($q) => $q->where('user_category_id', $category));
                })
                ->with('user')
                ->orderBy('sort')
                ->get();
        }

        $posts = [];
        if (in_array($page, ['feed', 'about'])) {
            $posts = $user->posts()->when(!Auth::check() || Auth::id() !== $user->id, fn ($q) => $q->where('approved', 1))->latest()->get();
        }

        $memberships = $page === 'memberships'
            ? $user->memberships()->when(!Auth::check() || Auth::id() !== $user->id, fn ($q) => $q->where('approved', 1))->latest()->get()
            : [];

        $bills = $page === 'bills'
            ? $user->bills()->when(!Auth::check() || Auth::id() !== $user->id, fn ($q) => $q->where('approved', 1))->latest()->get()
            : [];

        $shops = $page === 'shop'
            ? Shop::where('user_id', $user->id)
                ->when(!Auth::check() || Auth::id() !== $user->id, fn ($q) => $q->where('approved', 1))
                ->with(['user', 'shop_varients'])
                ->latest()
                ->get()
            : [];

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

        return Inertia::render('Dashboard', [
            'username' => $username,
            'user' => $user,
            'card_capabilities' => $card_capabilities,
            'isNeedToUpgrade' => $IsNeedToUpgrade,
            'itemid' => request()->query('item') ?? false,
            'sociallinks' => $user->social_links,
            'slinks' => $user->social_links,
            'page' => $page,
            'intro' => $user->intro,
            'supporters' => $supporters,
            'wish_categories' => $user->user_categories,
            'items' => $wishitems,
            'selectedCategory' => request()->query('category') ?? false,
            'posts' => $posts,
            'memberships' => $memberships,
            'bills' => $bills,
            'shops' => $shops,
            'notification_count' => $notification_count,
            'profile_steps' => null // optionally re-implement profile step logic if needed
        ]);
    }


    public function usergoal($username)
    {

        $user = User::with(['followers', 'following'])->where('username', $username)->where('is_uk', 0)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ]);
        }
        $goalPayment = TipGoalsPayment::where('creator_id', $user->id)->where('status', 'paid')->sum('amount');
        $bill_payment = BillPayment::whereHas('bill', fn ($q) => $q->where('user_id', $user->id))->where('status', 'paid')->sum('amount');
        $mem_payment = MembershipPayment::whereHas('membership', fn ($q) => $q->where('user_id', $user->id))->where('status', 'paid')->sum('amount');
        $wish_payment = StripePaymentDetail::where('owner_id', $user->id)->where('payment_status', 'paid')->sum('amount_subtotal');
        $sub_payment = WishItemSubscription::whereHas('wish_item', fn ($q) => $q->where('user_id', $user->id))->where('status', 'paid')->sum('amount');

        $total_earnings = $goalPayment + $bill_payment + $mem_payment + $wish_payment + $sub_payment;
        $target = match (true) {
            $total_earnings < 100 => 100,
            $total_earnings < 1000 => 1000,
            $total_earnings < 10000 => 10000,
            $total_earnings < 100000 => 100000,
            $total_earnings < 1000000 => 1000000,
            default => 10000000,
        };

        $goal = [
            'fullfilled' => $total_earnings,
            'target' => $target,
            'currency' => $user->default_currency,
        ];

        return response()->json([
            "success" => true,
            "goal" => $goal ?? null
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
        $user = User::where(
            'is_uk',
            0
            // $q->whereNot('country', 'GB')->orWhereNull('country');
        )->firstWhere('username', $username);

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
            $user = User::where('username', $username)->where(
                'is_uk',
                0
                // $q->whereNot('country', 'GB')->orWhereNull('country');
            )->first();
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
        try {
            // $user = User::where('username', $username)->where('country', 'GB')->first();
            $user = User::where('username', $username)->where('is_uk', 0)->first();
            $categories = [];
            if (!empty($user)) {
                $categories = $user->user_shop_categories()->get();
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

    public function userGiftItems($username)
    {
        $authUser = Auth::user(); // Get the logged-in user

        $user = User::where(
            'is_uk',
            0
            // $q->whereNot('country', 'GB')->orWhereNull('country');
        )->firstWhere('username', $username);

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
            $user = User::where('username', $username)->where(
                'is_uk',
                0
                // $q->whereNot('country', 'GB')->orWhereNull('country');
            )->first();
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
                $user = User::where('username', $username)->where(
                    'is_uk',
                    0
                    // $q->whereNot('country', 'GB')->orWhereNull('country');
                )->first();
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
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

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
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

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
        $email = $request->query('email');
        $password = $request->query('password');

        $user = User::where('email', $email)->where('is_uk', 0)->first();

        $otp = $request->query('otp');
        $backup_code = $request->query('backup_code');



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
                    return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
                } else if (!in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
                    // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
                    $auth = AuthRedirect::create([
                        "user_id"   =>  $user->id,
                        'country'   =>  $user->country,
                        'origin'    =>  $request->getHttpHost(),
                        'target'    =>  'uk.spennypiggy.co',
                    ]);

                    Auth::logout();
                    return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
                }
                return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
            } else {
                return back()->with("error", "Unable to login.");
            }
        } else {
            if (!empty($otp)) {
                $text = 'OTP';
            } else {
                $text = 'Backup Code';
            }
            return back()->with("error", "$text is invalid.");
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

        $user = User::where('id', Auth::guard('sanctum')->id())->where('is_uk', 0)->first();

        $contract = new FanContract();
        $contract->user_id = $user->id;
        $contract->name = $name ?? $user->name;
        $contract->sign = $sign;
        $contract->save();

        $pdf = LaravelMpdf::loadView('pdf.creator-contract', [
            'contract' => $contract
        ]);

        $pdfContent = $pdf->output();

        // $tempPdfPath = storage_path("app/" . Uuid::uuid4() . ".pdf");
        // $pdf->save($tempPdfPath);

        // Upload the PDF to Uploadcare
        $configuration = Configuration::create((string) $_ENV['UPLOADCARE_PUBLIC_KEY'], (string) $_ENV['UPLOADCARE_SECRET_KEY']);
        $uploader = new Uploader($configuration);

        // $fileInfo = $uploader->fromPath($tempPdfPath, null, null);
        $fileInfo = $uploader->fromContent($pdfContent, 'application/pdf', Uuid::uuid4() . ".pdf");

        $contract->document = $fileInfo->getUuid();
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




}

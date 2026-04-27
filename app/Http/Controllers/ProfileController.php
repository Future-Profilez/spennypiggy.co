<?php

namespace App\Http\Controllers;

use App\Events\IntroStatus;
use App\Helpers;
use App\Jobs\SendIntroMailAdmin;
use App\Models\UserIntro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use PhpParser\Node\Expr\Print_;
use Uploadcare\Api;
use Uploadcare\AuthUrl\AuthUrlConfig;
use Uploadcare\AuthUrl\Token\AkamaiToken;
use PragmaRX\Google2FALaravel\Google2FA;
use Uploadcare\Configuration;
use PragmaRX\Recovery\Recovery;
use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Carbon\Carbon;
use App\Models\UserVerificationStatus;
use App\Jobs\SendBioSocialUpdateEmail;
use App\Models\Logs;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\WishItemSubscription;
use App\Models\WishItem;
use App\Models\MonthlyCharge;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Notification;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\PostComment;
use App\Models\PostCommentReplies;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopShippingInfo;
use App\Models\WishCategory;
use App\StripeControl;
use Intervention\Image\Facades\Image;
use App\Models\ShopVarients;
use App\Models\ShopPayment;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\UserShopCategories;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\Deliverable;
use App\Models\UserBackupCode;
use App\Services\UserProfileService;
use App\Models\TaskPurchase;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Cache;
use App\Models\SupportStoryReaction;
use App\Models\SupportStoryReply;

class ProfileController extends Controller
{

    protected $uploadcareApi;

    protected $google2FA;
    protected $userProfileService;

    public function __construct(Google2FA $google2FA, UserProfileService $userProfileService)
    {
        $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(env('UPLOADCARE_SECRET_KEY'), 300));
        $config = Configuration::create(env('UPLOADCARE_PUBLIC_KEY'), env('UPLOADCARE_SECRET_KEY'))->setAuthUrlConfig($authUrlConfig);
        $this->uploadcareApi = new Api($config);
        $this->google2FA = $google2FA;
        $this->userProfileService = $userProfileService;
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }
        $request->user()->save();
        // return Redirect::route('profile.edit');
        return back()->with('success', 'Profile information updated.');
    }

    public function uploadToUploadcare($file)
    {
        $uploadcareHost = "https://upload.uploadcare.com/base/";
        $response = Http::asMultipart()->post($uploadcareHost, [
            [
                'name' => 'UPLOADCARE_PUB_KEY',
                'contents' => env('UPLOADCARE_PUBLIC_KEY'),
            ],
            [
                'name' => 'UPLOADCARE_STORE',
                'contents' => '1',
            ],
            [
                'name' => 'file',
                'contents' => fopen($file->getRealPath(), 'r'),
                'filename' => $file->getClientOriginalName(),
            ],
        ]);
        return json_decode($response);
    }

    /**
     * Update the user's profile information.
     */
    public function updateProfile(Request $request)
    {
        try {
        // $fullUrl = $request->fullUrl(); // Includes query parameters
        // $method = $request->method();   // GET, POST, etc.

        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $currency = strtolower($request->cookie("currency", "GBP"));

        // if($request->min_surprise_amount < 5){
        //     return redirect()->back()->with("error", "Please set the minimum amount greater than 5.");
        // }

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {
            $request->validate([
                'name' => ['string', 'max:255'],
                'username' => ['string', 'lowercase', 'max:20', Rule::unique('users')->ignore($user->id)],
                'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                'bio' => ['nullable', 'string', 'max:255'], // updated
                'creator_category' => ['nullable', 'array'],
                'gender' => ['nullable', 'string', 'max:50'],
                'country' => ['nullable', 'string', 'max:100'],
            ]);

            $avatar = $request->avatar;
            $cover = $request->cover;

            $user->name = $request->name;
            $user->username = $request->username;
            $user->gender = $request->gender;
            $user->country = $request->country;
            $user->creator_category = !empty($request->creator_category) ? json_encode($request->creator_category) : null;

            if ($request->email !== $user->email) {
                 // Direct update to ensure it persists and bypasses any potential model interference
                 User::where('id', $user->id)->update([
                     'email' => $request->email,
                     'email_verified_at' => null
                 ]);
                 $user->refresh(); // Sync the model instance with DB changes
                 Log::info('Email updated and verification reset for user: ' . $user->id);
            }
            
            $userProfileStatus = UserVerificationStatus::where('user_id', $user->id)->where('role', $user->role)->first();
            if (!$userProfileStatus) {
                $userProfileStatus = UserVerificationStatus::create([
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'user_profile_status' => 1,
                ]);
            }
            if ($request->bio !== $user->bio || $request->social_handle !== $user->social_handle) {

                UserVerificationStatus::UpdateOrCreate([
                    'user_id' => $user->id,
                    'role' => $user->role,
                ], [
                    'role' => $user->role,
                    'bio_status' => !empty($request->bio) ? 0 : null,
                ]);

                $updatedFields = [
                    'bio' => $request->bio !== $user->bio,
                    'social' => $request->social_handle !== $user->social_handle,
                ];

                if ($user->profile_status_lock == 2 && ((!empty($updatedFields['bio']) && !empty($request->bio)) || !empty($updatedFields['social']))) {
                    dispatch(new SendBioSocialUpdateEmail($user, $updatedFields));
                }

                if ($user->bio_approved == 2 || $user->bio_approved == 1) {
                    $user->bio_approved = 0;
                }

                $user->bio = $request->bio;
                if ($user->profile_status_lock == 2) {
                    $user->profile_status_lock = 1;
                }
                if ($userProfileStatus) {
                    $userProfileStatus->user_profile_status = 0;
                    $userProfileStatus->save();
                }
            }

            $user->min_surprise_amount = $request->min_surprise_amount ?? 0;

            if (is_array($avatar) && !empty($avatar)) {
                $user->avatar = $avatar['uuid'] ?? null;
                $user->avatar_approved = 0;
                // $user->profile_status_lock = 1;
                $user->avatar_cdn_modifier = $avatar['cdnUrlModifiers'] ?? null;
                if ($userProfileStatus) {
                    $userProfileStatus->user_profile_status = 0;
                    $userProfileStatus->save();
                }
            }
            if (is_array($cover) && !empty($cover)) {
                $user->cover = $cover['uuid'] ?? null;
                $user->cover_approved = 0;
                $user->cover_cdn_modifier = $cover['cdnUrlModifiers'] ?? null;
            }

            if ($request->hasFile('social_image')) {
                $file = $request->file('social_image');

                $uploadcareHost = "https://upload.uploadcare.com/base/";

                $response = Http::asMultipart()->post($uploadcareHost, [
                    [
                        'name' => 'UPLOADCARE_PUB_KEY',
                        'contents' => env('UPLOADCARE_PUBLIC_KEY'),
                    ],
                    [
                        'name' => 'UPLOADCARE_STORE',
                        'contents' => '1',
                    ],
                    [
                        'name' => 'file',
                        'contents' => fopen($file->getRealPath(), 'r'),
                        'filename' => $file->getClientOriginalName(),
                    ],
                ]);

                if ($response->successful() && isset($response['file'])) {
                    $user->social_image = $response['file']; // store the Uploadcare UUID
                } else {
                    Log::error("Uploadcare error", ['response' => $response->body()]);
                    return back()->with('error', 'Failed to upload image to Uploadcare.');
                }
            }


            $user->save();
            $user->refresh();

            if (!empty($request->bio)) {
                $logs = Logs::where('edited_about_me_id', $user->id)->where('status', 'pending')->first();
                if (!empty($logs)) {
                    // logs data save
                    $logs->status = 'updated';
                    $logs->save();

                    // user data save
                    $user->edit_bio_reason = '';
                    $user->save();
                    $user->refresh();
                }
            }
            $this->userProfileService->clearUserCaches($user->username, $user->id);
            return redirect(route("user.show", ["username" => $request->username ?? $user->username]))->with('success', "Profile has been updated.");
            // if($request->profilepage == 1){
                //     return redirect(route("user.show", ["username" => $request->username ?? $user->username]))->with('success', "Profile has been updated.");
            // } else { 
            //     return back()->with('success', 'Profile updated successfully.');
            // }

        }
        } catch (\Throwable $e) {
            Log::error('Profile update error', ['user_id' => Auth::id(), 'error' => $e->getMessage()]);
            return back()->with('error', 'Something went wrong while updating your profile.');
        }
    }

    /**
     * Update the user's profile lock status.
     */
    public function updateProfileLockStatus()
    {
        try {
            $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
            if ($user->role == 1) {
                $user->profile_status_lock = 1;
                $user->profile_status_lock = 1;
                $user->save();
            }

            return back()->with('success', 'Your Verification Request Submit Successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating profile lock status: ' . $e->getMessage());
            return back()->with('error', 'Failed to update profile lock status. Please try again later.');
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $bills = BillPayment::where('user_id', $user->id)->where('status', 'paid')->get();
        $connectedAccount = $bills->bill->user->account_id;
        if (!empty($bills)) {
            foreach ($bills as $bill) {
                StripeControl::cancelSubscription($bill->stripe_id, $connectedAccount);
            }
        }

        $members = MembershipPayment::where('user_id', $user->id)->where('status', 'paid')->get();

        if (!empty($members)) {
            foreach ($members as $member) {
                StripeControl::cancelSubscription($member->stripe_id);
            }
        }

        $wishSubs = WishItemSubscription::where('user_id', $user->id)->where('status', 'paid')->get();

        if (!empty($wishSubs)) {
            foreach ($wishSubs as $sub) {
                StripeControl::cancelSubscription($sub->stripe_id);
            }
        }

        $monthlyCharges = MonthlyCharge::where('user_id', $user->id)->where('status', 'paid')->get();

        if (!empty($monthlyCharges)) {
            foreach ($monthlyCharges as $charge) {
                StripeControl::cancelSubscription($charge->stripe_id);
            }
        }

        BillPayment::whereHas('bill', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)->delete();

        Bills::where('user_id', $user->id)->delete();

        Logs::whereHas('removeWish', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhereHas('removePost', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhereHas('removeShop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhereHas('editedShop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhereHas('editedPost', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhereHas('editedAboutMe', function ($q) use ($user) {
            $q->where('id', $user->id);
        })
            // ->orWhereHas('editedUserCategory', function ($q) use ($user) {
            //     $q->where('user_id', $user->id);
            // })
            ->orWhereHas('removeBill', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orWhereHas('editedBill', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orWhereHas('removeMembership', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orWhereHas('editedMembership', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orWhereHas('editedWish', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orWhereHas('suspendedUser', function ($q) use ($user) {
                $q->where('id', $user->id);
            })->orWhereHas('deletedUser', function ($q) use ($user) {
                $q->where('id', $user->id);
            })->delete();

        MembershipPayment::where('user_id', $user->id)->orWhereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        Membership::where('user_id', $user->id)->delete();

        MonthlyCharge::where('user_id', $user->id)->delete();

        Notification::where('user_id', $user->id)->orWhere('notifiable_id', $user->id)->delete();

        PostLike::whereHas('post', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)->delete();

        PostCommentReplies::whereHas('post_comment', function ($q) use ($user) {
            $q->where('user_id', $user->id)->whereHas('post', function ($que) use ($user) {
                $que->where('user_id', $user->id);
            });
        })->orWhere('user_id', $user->id)->delete();

        PostComment::whereHas('post', function ($que) use ($user) {
            $que->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)->delete();

        Post::where('user_id', $user->id)->delete();

        ShopVarients::whereHas('shop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        ShopShippingInfo::whereHas('shop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        ShopPayment::where('user_id', $user->id)->orWhereHas('shop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        ShopCategory::whereHas('shop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        Shop::where('user_id', $user->id)->delete();

        StripePaymentItems::whereHas('payment', function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('owner_id', $user->id);
        })->delete();

        StripePaymentDetail::where('user_id', $user->id)->orWhere('owner_id', $user->id)->delete();

        TipGoal::where('user_id', $user->id)->delete();

        TipGoalsPayment::where('user_id', $user->id)->orWhere('creator_id', $user->id)->delete();

        UserCart::where('user_id', $user->id)->orWhere('owner_id', $user->id)->delete();

        UserCategory::where('user_id', $user->id)->delete();

        // UserDocuments::where('user_id',$user->id)->delete();

        UserIntro::where('user_id', $user->id)->delete();

        UserShopCategories::where('user_id', $user->id)->delete();

        WishCategory::whereHas('wish', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        WishItemSubscription::where('user_id', $user->id)->orWhereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->delete();

        WishItem::where('user_id', $user->id)->delete();


        if (!empty($user->account_id)) {
            StripeControl::deleteAccount($user->account_id);
            $user->account_id = NULL;
            $user->stripe_details_submitted = 0;
        }
        $user->save();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * On or off the notification mails.
     */
    public function notificationSwitch()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'msg' => 'User not found.'
            ], 404);
        }

        if ($user->notification_send == 0) {
            $user->notification_send = 1;
            $status = 'Enabled';
        } else {
            $user->notification_send = 0;
            $status = 'Disabled';
        }

        $user->save();

        $this->userProfileService->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'message' => "Notifications for email are $status."
        ]);
    }

    public function checkAdultContent($uuid)
    {
        $rest_words = ['Adult', '18+', 'Pornographic', 'xxx', 'nsfw', 'NSFW', 'XXX', 'Blood', 'Brutality', 'Explicit', 'Mature', 'Weapons', 'Aggression', 'Combat', 'Sexual', 'Porn', 'Fucking', 'Graphic'];


        //For avatar adult check.
        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $uuid,
        ]);


        $response = Http::withHeaders([
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->get("https://api.uploadcare.com/files/" . $uuid . "/?include=appdata");

        $data = $response->json();
        $tags = [];
        if (isset($data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'])) {
            $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];
        }

        if (empty($tags)) {
            return response()->json([
                'status' => true,
                'msg' => 'Success.'
            ]);
        }

        foreach ($tags as $key => $tag) {
            $name = explode(" ", $tag['Name']);

            $common = array_intersect($rest_words, $name);

            if (count($common) > 0) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Your content contains nudity. Please try an alternative.'
                ]);
            }
        }

        return response()->json([
            'status' => true,
            'msg' => 'Success.'
        ]);
    }

    /**
     * Save the intro video
     *
     * @return mixed
     */
    public function saveIntroVideo(Request $request)
    {
        $request->validate([
            'media' => [
                'required',
            ]
        ]);

        $media = $request->media;

        // Robustly derive UUID from payload (supports both uuid and url)
        $uuid = $media['uuid'] ?? null;
        if (empty($uuid) && !empty($media['url'])) {
            $url = $media['url'];
            // Extract the first path segment after host as UUID
            $uuid = preg_replace('#https?://[^/]+/([^/]+)/?.*#', '$1', $url);
        }
        if (empty($uuid)) {
            return response()->json([
                'status' => false,
                'msg' => 'Unable to identify uploaded video. Please re-upload.'
            ], 422);
        }

        $intro = UserIntro::where('user_id', Auth::id())->first();

        if (empty($intro)) {
            $intro = UserIntro::create([
                'uuid' => $uuid,
                'user_id' => Auth::id(),
                'height' => 720, // Default height for videos
                'width' => 1280, // Default width for videos
            ]);
        } else {
            $intro->uuid = $uuid;
            $intro->height = 720; // Default height for videos
            $intro->width = 1280; // Default width for videos
            $intro->save();
        }

        $intro->refresh();

        // Trigger poster generation/accessor side effects
        $intro->poster_url;

        SendIntroMailAdmin::dispatch($intro);

        $user = Auth::user();
        $this->userProfileService->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'Your intro video has been saved.'
        ]);
    }

    /**
     * List the intro video
     *
     * @return JsonResponse
     */
    public function getIntroVideo()
    {
        $intro = UserIntro::where('user_id', Auth::id())->first();

        return response()->json([
            'status' => true,
            'intro' => $intro
        ]);
    }

    /**
     * Delete the intro video
     *
     * @return JsonResponse
     */
    public function removeIntro()
    {
        $intro = UserIntro::where('user_id', Auth::id())->first();

        if (!$intro) {
            return response()->json([
                'status' => false,
                'msg' => 'No intro video found to remove.'
            ], 404);
        }

        $intro->delete();

        $user = Auth::user();
        $this->userProfileService->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'The intro video has been removed.'
        ]);
    }

    public function gifterWishitems($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $wishes = StripePaymentItems::whereHas('payment', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with(['wish'])->orderBy('created_at', 'DESC')->paginate(30);

        $trackData = [];
        foreach ($wishes as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->payment->owner->name,
                    'avatar' => $value->payment->owner->avatar_url,
                    'cover' => $value->payment->owner->cover_url,
                    'username' => $value->payment->owner->username,
                    'stripe_details_submitted' => $value->payment->owner->stripe_details_submitted
                ],
                'amount' => $value->amount,
                'tax' => $value->tax,
                'currency' => $value->payment->currency,
                'is_surprise' => !empty($value->wish) ? false : true,
                'created_at' => Carbon::parse($value->created_at)->format('Y-m-d H:i:s'),
                'anonymous' => $value->payment->anonymous
            ];


            if (!empty($value->wish)) {
                $trackData[$key]['wish'] = [
                    'wishname' => $value->wish->wishname,
                    'subscription' => $value->wish->subscription,
                    'subscription_period' => $value->wish->subscription_period,
                    'perma_link' => $value->wish->perma_link
                ];
            }
        }


        // $trackData = $wishes->map(function ($q) {

        //     if (Auth::id() == $q->payment->owner_id) {
        //         $q->user = $q->payment->user ?? false;
        //     } elseif (Auth::id() == $q->payment->user_id) {
        //         $q->user = $q->payment->owner;
        //     }
        //     $q->cart_message = $q->payment->message ?? null;
        //     $q->surprise_message = $q->cart->message ?? null;
        //     return $q;
        // });

        return response()->json([
            'status' => true,
            'wishes' => $trackData,
            "last_page" => $wishes->lastPage() ?? null,
            "current_page" => $wishes->currentPage() ?? null,
            "total" => $wishes->total() ?? null,
            "per_page" => $wishes->perPage() ?? null,
        ]);
    }

    public function gifterSubs($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $user_subs = WishItemSubscription::where('user_id', $user->id)->with(['wish_item', 'wish_item.user'])->paginate(30);
        $trackData = [];

        foreach ($user_subs as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->wish_item->user->name,
                    'avatar' => $value->wish_item->user->avatar_url,
                    'cover' => $value->wish_item->user->cover_url,
                    'username' => $value->wish_item->user->username,
                    'stripe_details_submitted' => $value->wish_item->user->stripe_details_submitted
                ],
                'amount' => $value->amount,
                'tax' => $value->tax,
                'currency' => $value->currency,
                'is_surprise' => !empty($value->wish_item) ? false : true,
                'created_at' => Carbon::parse($value->created_at)->format('Y-m-d H:i:s'),
                'anonymous' => $value->anonymous
            ];


            if (!empty($value->wish_item)) {
                $trackData[$key]['wish'] = [
                    'wishname' => $value->wish_item->wishname,
                    'subscription' => $value->wish_item->subscription,
                    'subscription_period' => $value->wish_item->subscription_period,
                    'perma_link' => $value->wish_item->perma_link
                ];

                $trackData[$key]['media_url'] = $value->message_url;
            }
        }

        return response()->json([
            'status' => true,
            'subs' => $trackData,
            "last_page" => $user_subs->lastPage() ?? null,
            "current_page" => $user_subs->currentPage() ?? null,
            "total" => $user_subs->total() ?? null,
            "per_page" => $user_subs->perPage() ?? null,
        ]);
    }

    public function gifterTips($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $user_tips = TipGoalsPayment::where('user_id', $user->id)->with('tipGoal')->paginate(30);

        $trackData = [];
        foreach ($user_tips as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->creator->name ?? '',
                    'avatar' => $value->creator->avatar_url,
                    'cover' => $value->creator->cover_url,
                    'username' => $value->creator->username,
                    'stripe_details_submitted' => $value->creator->stripe_details_submitted
                ],
                'amount' => $value->amount,
                'tax' => $value->tax,
                'currency' => $value->currency,
                'created_at' => Carbon::parse($value->created_at)->format('Y-m-d H:i:s'),
                'anonymous' => $value->anonymous
            ];


            if (!empty($value->tipGoal)) {
                $trackData[$key]['tipGoal'] = [
                    'name' => $value->tipGoal->name,
                    'description' => $value->tipGoal->description,
                    'fullfilled' => $value->tipGoal->fullfilled,
                ];
            }
        }

        return response()->json([
            'status' => true,
            'tips' => $trackData,
            "last_page" => $user_tips->lastPage() ?? null,
            "current_page" => $user_tips->currentPage() ?? null,
            "total" => $user_tips->total() ?? null,
            "per_page" => $user_tips->perPage() ?? null,
        ]);
    }

    public function gifterMemberships($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $user_member = MembershipPayment::where('user_id', $user->id)->with(['membership', 'membership.user'])->paginate(30);

        $trackData = [];
        foreach ($user_member as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->membership->user->name,
                    'avatar' => $value->membership->user->avatar_url,
                    'cover' => $value->membership->user->cover_url,
                    'username' => $value->membership->user->username,
                    'stripe_details_submitted' => $value->membership->user->stripe_details_submitted
                ],
                'amount' => $value->amount,
                'tax' => $value->tax,
                'currency' => $value->currency,
                'created_at' => Carbon::parse($value->created_at)->format('Y-m-d H:i:s'),
                'anonymous' => $value->anonymous
            ];


            if (!empty($value->membership)) {
                $trackData[$key]['membership'] = [
                    'level' => $value->membership->level,
                    'perma_link' => $value->membership->perma_link,
                    'rewards' => $value->membership->rewards,
                ];
            }
        }

        return response()->json([
            'status' => true,
            'membership' => $trackData,
            "last_page" => $user_member->lastPage() ?? null,
            "current_page" => $user_member->currentPage() ?? null,
            "total" => $user_member->total() ?? null,
            "per_page" => $user_member->perPage() ?? null,
        ]);
    }

    public function gifterBills($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $billPayments = BillPayment::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })
            ->with(['bill', 'bill.user'])
            ->orderBy('created_at', 'DESC')
            ->paginate(30);

        $trackData = [];
        foreach ($billPayments as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->bill->user->name ?? '',
                    'avatar' => $value->bill->user->avatar_url ?? null,
                    'cover' => $value->bill->user->cover_url ?? null,
                    'username' => $value->bill->user->username ?? '',
                    'stripe_details_submitted' => $value->bill->user->stripe_details_submitted ?? null,
                ],
                'amount' => $value->amount,
                'tax' => $value->tax,
                'vat_tax_amount' => $value->vat_tax_amount,
                'currency' => $value->currency,
                'recurring_for' => $value->recurring_for,
                'recurring_type' => $value->recurring_type,
                'message' => $value->message,
                'anonymous' => $value->anonymous,
                'created_at' => \Carbon\Carbon::parse($value->created_at)->format('Y-m-d H:i:s'),
            ];

            if (!empty($value->bill)) {
                $trackData[$key]['bill'] = [
                    'name' => $value->bill->name,
                    'perma_link' => $value->bill->perma_link,
                ];
            }
        }

        return response()->json([
            'status' => true,
            'bills' => $trackData,
            'last_page' => $billPayments->lastPage() ?? null,
            'current_page' => $billPayments->currentPage() ?? null,
            'total' => $billPayments->total() ?? null,
            'per_page' => $billPayments->perPage() ?? null,
        ]);
    }

    public function gifterContentFiles($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();
        // 1) Wish purchases (StripePaymentItems) -> prefer content_file_url, then reward_url, else message_url
        $wishPurchases = \App\Models\StripePaymentItems::whereHas('payment', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
            ->with(['wish', 'payment.owner'])
            ->orderBy('created_at', 'DESC')
            ->get();

        $items = [];
        foreach ($wishPurchases as $wp) {
            $wish = $wp->wish;
            $url = $wish?->content_file_url ?? $wish?->reward_url ?? $wp->message_url;
            if (!$url) {
                continue;
            }
            $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            // Prefer explicit types from DB when available
            $type = $wish?->content_file_type ?: $wp->media_type;
            if (!$type) {
                // If reward URL is used, treat as image
                if ($wish?->reward_url && $url === $wish->reward_url) {
                    $type = 'image';
                } else {
                    $type = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image' : (in_array($ext, ['mp4', 'webm', 'mov']) ? 'video' : 'doc');
                }
            }
            $items[] = [
                'url' => $url,
                'type' => $type,
                'title' => $wish?->wishname ?? 'Wish Content',
                'product_type' => 'wish',
                'created_at' => $wp->created_at->toISOString(),
                'owner' => [
                    'username' => $wp->payment?->owner?->username,
                    'name' => $wp->payment?->owner?->name,
                ],
            ];
        }

        // 2) Bill deliverables (Deliverable)
        $deliverables = Deliverable::where('gifter_id', $user->id)
            ->where(function ($query) {
                $query->whereNotNull('deliverable_url')
                    ->orWhereNotNull('certificate_url');
            })
            ->whereIn('product_type', ['bill', 'wish', 'task'])
            ->with(['wishItem', 'bill', 'creator', 'task'])
            ->orderBy('created_at', 'DESC')
            ->get();

        foreach ($deliverables as $d) {
            $url = $d->deliverable_url ?: ($d->certificate_url ?: ($d->bill?->content_file_url ?? $d->wishItem?->content_file_url));
            if (!$url) {
                continue;
            }
            $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            $type = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image' : (in_array($ext, ['mp4', 'webm', 'mov']) ? 'video' : 'doc');
            $title = $d->wishItem?->wishname ?? $d->bill?->name ?? $d->task?->title ?? 'Content';
            $items[] = [
                'url' => $url,
                'type' => $type,
                'title' => $title,
                'product_type' => $d->product_type,
                'created_at' => $d->created_at->toISOString(),
                'owner' => [
                    'username' => $d->creator?->username,
                    'name' => $d->creator?->name,
                ],
            ];
        }

        // 3) One-time subscriptions with reward (WishItemSubscription)
        $subs = \App\Models\WishItemSubscription::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })
            ->with(['wish_item.user'])
            ->where('recurring_for', 'onetime')
            ->where('status', 'paid')
            ->orderBy('created_at', 'DESC')
            ->get();

        foreach ($subs as $sub) {
            $wish = $sub->wish_item;
            $url = $wish?->content_file_url ?? $wish?->reward_url;
            if (!$url) {
                continue;
            }
            $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            $type = $wish?->content_file_type ?: ($wish?->reward_url ? 'image' : null);
            if (!$type) {
                $type = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image' : (in_array($ext, ['mp4', 'webm', 'mov']) ? 'video' : 'doc');
            }
            $items[] = [
                'url' => $url,
                'type' => $type,
                'title' => $wish?->wishname ?? 'Wish Content',
                'product_type' => 'wish',
                'created_at' => $sub->created_at->toISOString(),
                'owner' => [
                    'username' => $wish?->user?->username,
                    'name' => $wish?->user?->name,
                ],
            ];
        }

        // Sort newest first and remove duplicates by URL
        usort($items, function ($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });
        $unique = [];
        $final = [];
        foreach ($items as $it) {
            if (isset($unique[$it['url']])) continue;
            $unique[$it['url']] = true;
            $final[] = $it;
        }

        return response()->json([
            'status' => true,
            'items' => $final,
        ]);
    }

    public function gifterThanksMessages($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $wishes = StripePaymentItems::whereHas('payment', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with(['wish'])->orderBy('created_at', 'DESC')->paginate(30);

        $trackData = [];
        foreach ($wishes as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->payment->owner->name,
                    'avatar' => $value->payment->owner->avatar_url,
                    'cover' => $value->payment->owner->cover_url,
                    'username' => $value->payment->owner->username,
                    'stripe_details_submitted' => $value->payment->owner->stripe_details_submitted
                ],
                'message' => $value->thankyou_message,
                'media_url' => $value->message_url ?? false,
                'media_type' => $value->media_type,
                'currency' => $value->payment->currency,
                'anonymous' => $value->payment->anonymous
            ];


            if (!empty($value->wish)) {
                $trackData[$key]['wish'] = [
                    'wishname' => $value->wish->wishname,
                    'subscription' => $value->wish->subscription,
                    'subscription_period' => $value->wish->subscription_period,
                    'perma_link' => $value->wish->perma_link
                ];
            }
        }

        return response()->json([
            'status' => true,
            'wishes' => $trackData,
            "last_page" => $wishes->lastPage() ?? null,
            "current_page" => $wishes->currentPage() ?? null,
            "total" => $wishes->total() ?? null,
            "per_page" => $wishes->perPage() ?? null,
        ]);
    }

    public function gifterAccessPosts($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $data = [];
        // Get user IDs from active subscriptions for post access
        $subscription = WishItem::where('subscription', 1)->whereHas('wishItemsSubscription', function ($qu) use ($user) {
            $qu->where('status', 'paid')
                ->where('stripe_status', 'active') // Only truly active Stripe subscriptions
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                })
                ->where(function ($que) {
                    $que->where(function ($recurring) {
                        // Active recurring subscriptions
                        $recurring->where('recurring_for', 'continue')
                            ->where('upcoming_payment', '>=', Carbon::now());
                    })->orWhere(function ($onetime) {
                        // One-time subscriptions get 30-day access
                        $onetime->where('recurring_for', 'onetime')
                            ->where('created_at', '>=', Carbon::now()->subDays(30));
                    });
                });
        })->pluck('user_id');

        $bills = Bills::whereHas('payments', function ($qu) use ($user) {
            $qu->where(function ($que) {
                $que->where('created_at', '<=', Carbon::now())->where('upcoming_payment', '>=', Carbon::now());
            })->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            });
        })->pluck('user_id');

        $mem = Membership::whereHas('payments', function ($q) use ($user) {
            $q->where('recurring_type', '!=', 'lifetime')->where(function ($que) {
                $que->where('created_at', '<=', Carbon::now())->where('upcoming_payment', '>=', Carbon::now());
            })->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            });
        })->pluck('user_id');

        $lifetime = Membership::whereHas('payments', function ($q) use ($user) {
            $q->where(function ($que) {
                $que->where('created_at', '<=', Carbon::now())->where('upcoming_payment', '>=', Carbon::now());
            })->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            });
        })->pluck('user_id');


        $tip = TipGoalsPayment::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })->pluck('creator_id');

        $posts = Post::whereNotNull('image')->with('user')->where(function ($query) use ($tip, $lifetime, $mem, $subscription, $bills) {
            $query->where(function ($qu) use ($tip) {
                $qu->whereIn('user_id', $tip)->where('for_module', 'support');
            })->orWhere(function ($qu) use ($lifetime, $mem) {
                $qu->where(function ($q) use ($lifetime, $mem) {
                    $q->whereIn('user_id', $lifetime)->orWhereIn('user_id', $mem);
                })->where('for_module', 'membership');
            })->orWhere(function ($qu) use ($subscription, $bills) {
                $qu->where(function ($q) use ($subscription, $bills) {
                    $q->whereIn('user_id', $subscription)->orWhereIn('user_id', $bills);
                })->where('for_module', 'subscription');
            });
        })->where('approved', 1)->orderBy('created_at', 'DESC')->paginate(40);

        $posts->map(function ($q) {
            $q->is_lock = 0;
            return $q;
        });

        return response()->json([
            'status' => true,
            'posts' => $posts,
            "last_page" => $posts->lastPage() ?? null,
            "current_page" => $posts->currentPage() ?? null,
            "total" => $posts->total() ?? null,
            "per_page" => $posts->perPage() ?? null,
        ]);
    }

    public function gifterMedia($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $categorizedPayments = [];

        $payment = StripePaymentItems::whereHas('wish', function ($q) {
            $q->whereNotNull('reward');
        })->whereHas('payment', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->get();


        foreach ($payment as $key => $value) {
            $ownerId = $value->payment->owner_id;


            if (array_key_exists($ownerId, $categorizedPayments)) {

                $categorizedPayments[$ownerId]['reward'][] = $value->wish->reward_url;
                $categorizedPayments[$ownerId]['count'] += 1;
            } else {

                $categorizedPayments[$ownerId]['username'] = $value->payment->owner->username;
                $categorizedPayments[$ownerId]['name'] = $value->payment->owner->name;
                $categorizedPayments[$ownerId]['count'] = 1;
                $categorizedPayments[$ownerId]['reward'] = [$value->wish->reward_url];
            }
        }

        $categorizedPayments = array_values($categorizedPayments);

        return response()->json([
            'status' => true,
            'medias' => $categorizedPayments,
        ]);
    }

    public function gifterSubscription($username)
    {
        $user = User::where('username', $username)->where('is_uk', 0)->first();

        $user_subs = WishItemSubscription::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })->with(['wish_item', 'wish_item.user'])->where('status', 'paid')->paginate(30);

        $trackData = [];
        foreach ($user_subs as $key => $value) {
            $trackData[$key] = [
                'owner' => [
                    'name' => $value->wish_item->user->name ?? '',
                    'avatar' => $value->wish_item->user->avatar_url,
                    'cover' => $value->wish_item->user->cover_url,
                    'username' => $value->wish_item->user->username,
                    'stripe_details_submitted' => $value->wish_item->user->stripe_details_submitted
                ],
                'amount' => $value->amount,
                'tax' => $value->tax,
                'currency' => $value->currency,
                'created_at' => Carbon::parse($value->created_at)->format('Y-m-d H:i:s'),
                'anonymous' => $value->anonymous
            ];


            if (!empty($value->wish_item)) {
                $trackData[$key]['wish_item'] = [
                    'name' => $value->wish_item->wishname,
                    'perma_link' => $value->wish_item->perma_link,
                ];
                $trackData[$key]['media_url'] = $value->recurring_for == 'onetime' ? $value->wish_item->reward_url : false;
            }
        }

        return response()->json([
            'status' => true,
            'subscriptions' => $trackData,
            "last_page" => $user_subs->lastPage() ?? null,
            "current_page" => $user_subs->currentPage() ?? null,
            "total" => $user_subs->total() ?? null,
            "per_page" => $user_subs->perPage() ?? null,
        ]);
    }

    public function supportStory($creatorUsername, $gifterUsername)
    {
        $creator = User::where('username', $creatorUsername)->where('is_uk', 0)->firstOrFail();
        $gifter = User::where('username', $gifterUsername)->where('is_uk', 0)->firstOrFail();

        if (!Auth::check() || (Auth::id() !== $gifter->id && Auth::id() !== $creator->id)) {
            throw new AuthorizationException('Unauthorized');
        }

        $events = [];

        $wishItems = StripePaymentItems::whereHas('payment', function ($q) use ($creator, $gifter) {
            $q->where('owner_id', $creator->id)
              ->where(function ($sub) use ($gifter) {
                  $sub->where('user_id', $gifter->id)->orWhere('guest_email', $gifter->email);
              })
              ->where('payment_status', 'paid');
        })->with(['payment', 'wish'])->get();

        foreach ($wishItems as $it) {
            $events[] = [
                'type' => 'gift_wish',
                'source' => 'stripe_payment_items',
                'source_id' => $it->id,
                'amount' => $it->amount,
                'creator_amount' => $it->amount,
                'tax' => $it->tax,
                'currency' => $it->payment->currency,
                'created_at' => Carbon::parse($it->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $it->payment->owner->name,
                    'username' => $it->payment->owner->username,
                    'avatar' => $it->payment->owner->avatar_url,
                ],
                'wish' => !empty($it->wish) ? [
                    'id' => $it->wish->id,
                    'uuid' => $it->wish->uuid ?? null,
                    'name' => $it->wish->wishname,
                    'perma_link' => $it->wish->perma_link,
                    'reward_file' => $it->wish->content_file_url ?? $it->wish->reward_url ?? null,
                ] : null,
                'message' => $it->payment->message ?? null,
                'status' => $it->payment->payment_status ?? null,
            ];

            if (!empty($it->thankyou_message) || !empty($it->message_url)) {
                $events[] = [
                    'type' => 'thankyou',
                    'source' => 'stripe_payment_items',
                    'source_id' => $it->id,
                    'message' => $it->thankyou_message,
                    'media_url' => $it->message_url ?? null,
                    'media_type' => $it->media_type ?? null,
                    'created_at' => Carbon::parse($it->created_at)->format('Y-m-d H:i:s'),
                    'owner' => [
                        'name' => $it->payment->owner->name,
                        'username' => $it->payment->owner->username,
                        'avatar' => $it->payment->owner->avatar_url,
                    ],
                ];
            }
        }

        $membershipPayments = MembershipPayment::whereHas('membership', function ($q) use ($creator) {
            $q->where('user_id', $creator->id);
        })->where(function ($q) use ($gifter) {
            $q->where('user_id', $gifter->id)->orWhere('guest_email', $gifter->email);
        })->where('status', 'paid')->with(['membership'])->get();

        foreach ($membershipPayments as $mp) {
            $events[] = [
                'type' => 'gift_membership',
                'source' => 'membership_payments',
                'source_id' => $mp->id,
                'amount' => $mp->amount,
                'creator_amount' => $mp->amount,
                'tax' => $mp->tax,
                'currency' => $mp->currency,
                'created_at' => Carbon::parse($mp->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'avatar' => $creator->avatar_url,
                ],
                'membership' => !empty($mp->membership) ? [
                    'uuid' => $mp->membership->uuid ?? null,
                    'level' => $mp->membership->level,
                    'perma_link' => $mp->membership->perma_link,
                ] : null,
                'status' => $mp->status,
            ];
        }

        $billPayments = BillPayment::whereHas('bill', function ($q) use ($creator) {
            $q->where('user_id', $creator->id);
        })->where(function ($q) use ($gifter) {
            $q->where('user_id', $gifter->id)->orWhere('guest_email', $gifter->email);
        })->where('status', 'paid')->with(['bill'])->get();

        foreach ($billPayments as $bp) {
            $events[] = [
                'type' => 'gift_bill',
                'source' => 'bill_payments',
                'source_id' => $bp->id,
                'amount' => $bp->amount,
                'creator_amount' => $bp->amount,
                'tax' => $bp->tax,
                'currency' => $bp->currency,
                'created_at' => Carbon::parse($bp->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'avatar' => $creator->avatar_url,
                ],
                'bill' => !empty($bp->bill) ? [
                    'uuid' => $bp->bill->uuid ?? null,
                    'name' => $bp->bill->name,
                    'perma_link' => $bp->bill->perma_link,
                ] : null,
                'status' => $bp->status,
            ];
        }

        $tipPayments = TipGoalsPayment::where('creator_id', $creator->id)
            ->where(function ($q) use ($gifter) {
                $q->where('user_id', $gifter->id)->orWhere('guest_email', $gifter->email);
            })->where('status', 'paid')->with(['tipGoal'])->get();

        foreach ($tipPayments as $tp) {
            $vatPercent = $creator->vat_amount_percentage ?? 0;
            $vatAmount = ($tp->amount * $vatPercent) / 100;
            $events[] = [
                'type' => 'gift_tip',
                'source' => 'tip_goals_payments',
                'source_id' => $tp->id,
                'amount' => $tp->amount,
                'creator_amount' => $tp->amount,
                'tax' => $tp->tax,
                'vat_amount' => $vatAmount,
                'currency' => $tp->currency,
                'created_at' => Carbon::parse($tp->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'avatar' => $creator->avatar_url,
                ],
                'tip' => !empty($tp->tipGoal) ? [
                    'name' => $tp->tipGoal->name,
                ] : null,
                'status' => $tp->status,
            ];
        }

        $shopPayments = ShopPayment::whereHas('shop', function ($q) use ($creator) {
            $q->where('user_id', $creator->id);
        })->where(function ($q) use ($gifter) {
            $q->where('user_id', $gifter->id)->orWhere('email', $gifter->email);
        })->where('payment_status', 'paid')->with(['shop'])->get();

        foreach ($shopPayments as $sp) {
            $events[] = [
                'type' => 'gift_shop',
                'source' => 'shop_payments',
                'source_id' => $sp->id,
                'amount' => $sp->amount,
                'creator_amount' => $sp->amount,
                'tax' => ($sp->tax_amount ?? 0) + ($sp->vat_tax_amount ?? 0),
                'currency' => $sp->currency,
                'created_at' => Carbon::parse($sp->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'avatar' => $creator->avatar_url,
                ],
                'shop' => !empty($sp->shop) ? [
                    'uuid' => $sp->shop->uuid ?? null,
                    'name' => $sp->shop->name,
                    'perma_link' => $sp->shop->perma_link,
                    'quantity' => $sp->quantity ?? 1,
                ] : null,
                'message' => $sp->message ?? null,
                'status' => $sp->payment_status,
            ];
        }

        $taskPurchases = TaskPurchase::where('creator_id', $creator->id)
            ->where('supporter_id', $gifter->id)
            ->whereNotIn('status', ['initiated', 'expired', 'refunded'])
            ->with(['task'])
            ->get();

        foreach ($taskPurchases as $tpur) {
            $events[] = [
                'type' => 'gift_task',
                'source' => 'task_purchases',
                'source_id' => $tpur->id,
                'amount' => $tpur->amount,
                'creator_amount' => $tpur->transfer_amount ?? $tpur->amount,
                'tax' => $tpur->vat_amount ?? 0,
                'currency' => 'gbp', // tasks stored in platform currency; adjust if field exists
                'created_at' => Carbon::parse($tpur->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'avatar' => $creator->avatar_url,
                ],
                'task' => !empty($tpur->task) ? [
                    'title' => $tpur->task->title,
                    'uuid' => $tpur->task->uuid,
                    'status' => $tpur->status,
                    'reward_file' => ($tpur->task->type === 'instant' && in_array($tpur->status, ['paid', 'delivered', 'completed', 'completed_accepted', 'paid_out'])) 
                        ? route('task.download', $tpur->task->uuid) 
                        : ($tpur->proof_content['media_url'] ?? null),
                    'reward_note' => ($tpur->task->type === 'instant' && in_array($tpur->status, ['paid', 'delivered', 'completed', 'completed_accepted', 'paid_out']))
                        ? $tpur->task->deliverable_note
                        : ($tpur->proof_content['message'] ?? null),
                ] : [
                    'title' => 'Task',
                    'uuid' => $tpur->uuid,
                    'status' => $tpur->status,
                    'reward_file' => $tpur->proof_content['media_url'] ?? null,
                    'reward_note' => $tpur->proof_content['message'] ?? null,
                ],
                'message' => $tpur->gifter_message ?? null,
                'status' => $tpur->status,
                'dispute_status' => $tpur->dispute_status ?? null,
            ];
        }

        // Attach reactions count and recent replies for each event
        foreach ($events as $idx => $ev) {
            $src = $ev['source'] ?? null;
            $sid = $ev['source_id'] ?? null;
            $etype = $ev['type'] ?? null;
            if (!$src || !$sid || !$etype) {
                $events[$idx]['reactions'] = [];
                if ($etype === 'thankyou') {
                    $events[$idx]['replies'] = [];
                    $events[$idx]['reply_count'] = 0;
                }
                continue;
            }
            $counts = SupportStoryReaction::where([
                'creator_id' => $creator->id,
                'gifter_id' => $gifter->id,
                'event_type' => $etype,
                'source' => $src,
                'source_id' => $sid,
            ])->selectRaw('emoji, COUNT(*) as c')->groupBy('emoji')->pluck('c', 'emoji')->toArray();
            $events[$idx]['reactions'] = $counts;
            $userReacted = [];
            if (Auth::check()) {
                $userReacted = SupportStoryReaction::where([
                    'creator_id' => $creator->id,
                    'gifter_id' => $gifter->id,
                    'event_type' => $etype,
                    'source' => $src,
                    'source_id' => $sid,
                    'user_id' => Auth::id(),
                ])->pluck('emoji')->toArray();
            }
            $events[$idx]['user_reacted'] = $userReacted;
            if ($etype === 'thankyou') {
                $repliesQuery = SupportStoryReply::where([
                    'creator_id' => $creator->id,
                    'gifter_id' => $gifter->id,
                    'event_type' => $etype,
                    'source' => $src,
                    'source_id' => $sid,
                ])->orderBy('created_at', 'desc');
                $events[$idx]['reply_count'] = (clone $repliesQuery)->count();
                $latest = $repliesQuery->limit(5)->get()->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'user_id' => $r->user_id,
                        'username' => $r->user->username ?? null,
                        'avatar' => $r->user->avatar_url ?? null,
                        'message' => $r->message,
                        'created_at' => $r->created_at->format('Y-m-d H:i:s'),
                    ];
                })->toArray();
                $events[$idx]['replies'] = $latest;
            }
        }

        usort($events, function ($a, $b) {
            return strtotime($b['created_at']) <=> strtotime($a['created_at']);
        });

        $limit = intval(request()->query('limit', 30));
        $before = request()->query('before');
        if (!empty($before)) {
            $events = array_values(array_filter($events, function ($e) use ($before) {
                return strtotime($e['created_at']) < strtotime($before);
            }));
        }
        $sliced = array_slice($events, 0, $limit);
        $hasMore = count($events) > $limit;
        $nextBefore = $hasMore && !empty($sliced) ? end($sliced)['created_at'] : null;

        return response()->json([
            'status' => true,
            'creator' => [
                'username' => $creator->username,
                'name' => $creator->name,
                'avatar' => $creator->avatar_url,
            ],
            'gifter' => [
                'username' => $gifter->username,
                'name' => $gifter->name,
                'avatar' => $gifter->avatar_url,
            ],
            'events' => $sliced,
            'has_more' => $hasMore,
            'next_before' => $nextBefore,
        ]);
    }

    public function supportStoryReact(Request $request, $creatorUsername, $gifterUsername)
    {
        $request->validate([
            'event_type' => 'required|string',
            'source' => 'required|string',
            'source_id' => 'required',
            'emoji' => 'required|string|max:12'
        ]);
        $creator = User::where('username', $creatorUsername)->firstOrFail();
        $gifter = User::where('username', $gifterUsername)->firstOrFail();
        if (!Auth::check() || (Auth::id() !== $gifter->id && Auth::id() !== $creator->id)) {
            throw new AuthorizationException('Unauthorized');
        }
        $exists = SupportStoryReaction::where([
            'creator_id' => $creator->id,
            'gifter_id' => $gifter->id,
            'user_id' => Auth::id(),
            'event_type' => $request->event_type,
            'source' => $request->source,
            'source_id' => $request->source_id,
            'emoji' => $request->emoji
        ])->first();
        if ($exists) {
            $exists->delete();
        } else {
            SupportStoryReaction::create([
                'creator_id' => $creator->id,
                'gifter_id' => $gifter->id,
                'user_id' => Auth::id(),
                'event_type' => $request->event_type,
                'source' => $request->source,
                'source_id' => $request->source_id,
                'emoji' => $request->emoji
            ]);
        }
        $counts = SupportStoryReaction::where([
            'creator_id' => $creator->id,
            'gifter_id' => $gifter->id,
            'event_type' => $request->event_type,
            'source' => $request->source,
            'source_id' => $request->source_id,
        ])->selectRaw('emoji, COUNT(*) as c')->groupBy('emoji')->pluck('c', 'emoji')->toArray();
        return response()->json(['status' => true, 'counts' => $counts, 'user' => Auth::id()]);
    }

    public function supportStoryReply(Request $request, $creatorUsername, $gifterUsername)
    {
        $request->validate([
            'event_type' => 'required|string',
            'source' => 'required|string',
            'source_id' => 'required',
            'message' => 'required|string|max:250'
        ]);

        // Word count limit: 90 words
        $wordCount = str_word_count($request->message);
        if ($wordCount > 90) {
            return response()->json(['status' => false, 'msg' => 'Message exceeds 90 words limit.'], 422);
        }

        $creator = User::where('username', $creatorUsername)->firstOrFail();
        $gifter = User::where('username', $gifterUsername)->firstOrFail();
        
        if (!Auth::check() || (Auth::id() !== $gifter->id && Auth::id() !== $creator->id)) {
            throw new AuthorizationException('Unauthorized');
        }

        // Limit for gifter: 3 messages per creator per 24-hour window
        if (Auth::id() === $gifter->id) {
            $dailyCount = SupportStoryReply::where('user_id', Auth::id())
                ->where('creator_id', $creator->id)
                ->where('gifter_id', $gifter->id)
                ->where('created_at', '>=', now()->subHours(24))
                ->count();
            
            if ($dailyCount >= 3) {
                return response()->json(['status' => false, 'msg' => 'You have reached the limit of 3 replies to this creator in 24 hours.'], 422);
            }
        }

        $reply = SupportStoryReply::create([
            'creator_id' => $creator->id,
            'gifter_id' => $gifter->id,
            'user_id' => Auth::id(),
            'event_type' => $request->event_type,
            'source' => $request->source,
            'source_id' => $request->source_id,
            'message' => $request->message
        ]);
        return response()->json(['status' => true, 'reply' => [
            'id' => $reply->id,
            'user_id' => $reply->user_id,
            'username' => Auth::user()->username,
            'avatar' => Auth::user()->avatar_url,
            'message' => $reply->message,
            'created_at' => $reply->created_at->format('Y-m-d H:i:s')
        ]]);
    }

    public function supportHistory()
    {
        if (!Auth::check()) {
            return Inertia::render('Auth/Login');
        }

        $user = Auth::user();
        $displayCurrency = strtoupper(request()->cookie('currency', $user->default_currency ?? 'GBP'));

        $limitsMinor = null;
        try {
            $deviceId = request()->cookie('device_id') ?: request()->header('X-Device-ID');
            $identity = app(\App\Services\Risk\RiskIdentityService::class)->resolveIdentity([
                'email' => $user->email,
                'ip' => request()->ip(),
                'device_id' => $deviceId,
                'is_guest' => false,
            ]);
            $limitsMinor = app(\App\Services\Risk\EffectiveLimitsService::class)->getEffectiveLimits($identity);
        } catch (\Throwable $e) {
            $limitsMinor = null;
        }

        $receivedAll = \App\Models\FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->get(['net_amount', 'currency']);

        $sentAll = \App\Models\FinancialTransaction::where('supporter_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->get(['gross_amount', 'currency']);

        $allCurrencies = $receivedAll
            ->pluck('currency')
            ->merge($sentAll->pluck('currency'))
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = \App\Models\Currency::whereIn('ISO', $allCurrencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        if (
            !isset($currencyMeta[$displayCurrency]) ||
            (float) ($currencyMeta[$displayCurrency]->conversion_rate ?? 0) <= 0
        ) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');

            if ($from === $to) {
                return $amount;
            }

            if (!isset($currencyMeta[$from]) || !isset($currencyMeta[$to])) {
                return null;
            }

            $fromRate = (float) ($currencyMeta[$from]->conversion_rate ?? 0);
            $toRate = (float) ($currencyMeta[$to]->conversion_rate ?? 0);
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }

            $gbp = $amount / $fromRate;
            $converted = $gbp * $toRate;
            $decimalPlaces = (int) ($currencyMeta[$to]->ISOdigits ?? 2);
            return round($converted, $decimalPlaces, PHP_ROUND_HALF_UP);
        };

        $receivedTotal = $receivedAll->sum(function ($tx) use ($convert, $displayCurrency) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $amount = (float) ($tx->net_amount ?? 0);
            return $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);
        });

        $sentTotal = $sentAll->sum(function ($tx) use ($convert, $displayCurrency) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $amount = (float) ($tx->gross_amount ?? 0);
            return $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);
        });

        $spendSummary = null;
        try {
            $now = Carbon::now();
            $sentCompletedBase = \App\Models\FinancialTransaction::where('supporter_id', $user->id)
                ->where('type', 'income')
                ->where('status', 'completed');

            $sumInDisplayCurrency = function ($rows) use ($convert, $displayCurrency) {
                return $rows->sum(function ($tx) use ($convert, $displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $amount = (float) ($tx->gross_amount ?? 0);
                    return $from === $displayCurrency
                        ? $amount
                        : ($convert($from, $amount, $displayCurrency) ?? $amount);
                });
            };

            $spend1hMajor = $sumInDisplayCurrency(
                (clone $sentCompletedBase)->where('transaction_date', '>=', $now->copy()->subHour())->get(['gross_amount', 'currency'])
            );
            $spend24hMajor = $sumInDisplayCurrency(
                (clone $sentCompletedBase)->where('transaction_date', '>=', $now->copy()->subDay())->get(['gross_amount', 'currency'])
            );
            $spend7dMajor = $sumInDisplayCurrency(
                (clone $sentCompletedBase)->where('transaction_date', '>=', $now->copy()->subDays(7))->get(['gross_amount', 'currency'])
            );

            $limit1hMajor = null;
            $limit24hMajor = null;
            $limit7dMajor = null;
            if (is_array($limitsMinor)) {
                $limit1hMajor = ((float) ($limitsMinor['max_spend_1h'] ?? 0)) / 100;
                $limit24hMajor = ((float) ($limitsMinor['max_spend_24h'] ?? 0)) / 100;
                $limit7dMajor = ((float) ($limitsMinor['max_spend_7d'] ?? 0)) / 100;

                if ($displayCurrency !== 'GBP') {
                    $limit1hMajor = $convert('GBP', $limit1hMajor, $displayCurrency) ?? $limit1hMajor;
                    $limit24hMajor = $convert('GBP', $limit24hMajor, $displayCurrency) ?? $limit24hMajor;
                    $limit7dMajor = $convert('GBP', $limit7dMajor, $displayCurrency) ?? $limit7dMajor;
                }
            }

            $spendSummary = [
                'spend_1h' => $spend1hMajor,
                'spend_24h' => $spend24hMajor,
                'spend_7d' => $spend7dMajor,
                'limit_1h' => $limit1hMajor,
                'limit_24h' => $limit24hMajor,
                'limit_7d' => $limit7dMajor,
                'currency' => strtoupper($displayCurrency),
            ];
        } catch (\Throwable $e) {
            $spendSummary = null;
        }

        $received = $this->buildFinancialTransactionsFeed($user, 'received', 20, null, $displayCurrency);
        $sent = $this->buildFinancialTransactionsFeed($user, 'sent', 20, null, $displayCurrency);

        $allEvents = array_merge($received['events'] ?? [], $sent['events'] ?? []);
        usort($allEvents, fn ($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));

        $hasMore = ($received['has_more'] ?? false) || ($sent['has_more'] ?? false);
        $nextBefore = $received['next_before'] ?? $sent['next_before'] ?? null;

        return Inertia::render('transactions/Transactions', [
            'display_currency' => $displayCurrency,
            'spend_summary' => $spendSummary,
            'initial' => [
                'events' => $allEvents,
                'has_more' => $hasMore,
                'next_before' => $nextBefore,
                'stats' => [
                    'received' => [strtolower($displayCurrency) => $receivedTotal],
                    'sent' => [strtolower($displayCurrency) => $sentTotal],
                ]
            ],
        ]);
    }

    private function buildFinancialTransactionsFeed($user, $tab, $limit, $before, $displayCurrency)
    {
        $tab = $tab === 'sent' ? 'sent' : 'received';
        $limit = (int) $limit;
        $before = $before ?: null;

        $query = \App\Models\FinancialTransaction::query()
            ->where('type', 'income');

        if ($tab === 'sent') {
            $query->where('supporter_id', $user->id);
        } else {
            $query->where('user_id', $user->id);
        }

        if (!empty($before)) {
            $query->where('transaction_date', '<', $before);
        }

        $rows = $query
            ->with([
                'user:id,name,username,avatar',
                'supporter:id,name,username,avatar',
            ])
            ->orderByDesc('transaction_date')
            ->limit($limit + 1)
            ->get();

        $hasMore = $rows->count() > $limit;
        $rows = $rows->take($limit)->values();

        $currencies = $rows
            ->pluck('currency')
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = \App\Models\Currency::whereIn('ISO', $currencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');

            if ($from === $to) {
                return $amount;
            }

            if (!isset($currencyMeta[$from]) || !isset($currencyMeta[$to])) {
                return null;
            }

            $fromRate = (float) ($currencyMeta[$from]->conversion_rate ?? 0);
            $toRate = (float) ($currencyMeta[$to]->conversion_rate ?? 0);
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }

            $gbp = $amount / $fromRate;
            $converted = $gbp * $toRate;
            $decimalPlaces = (int) ($currencyMeta[$to]->ISOdigits ?? 2);
            return round($converted, $decimalPlaces, PHP_ROUND_HALF_UP);
        };

        $events = $rows->map(function ($tx) use ($tab, $displayCurrency, $convert) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $baseAmount = $tab === 'sent' ? (float) ($tx->gross_amount ?? 0) : (float) ($tx->net_amount ?? 0);
            $displayAmount = $from === $displayCurrency ? $baseAmount : ($convert($from, $baseAmount, $displayCurrency) ?? $baseAmount);

            $base = class_basename($tx->source_type);
            $type = match ($base) {
                'StripePaymentItems' => 'gift_wish',
                'MembershipPayment' => 'gift_membership',
                'BillPayment' => 'gift_bill',
                'TipGoalsPayment' => 'gift_tip',
                'ShopPayment' => 'gift_shop',
                'TaskPurchase' => 'gift_task',
                default => 'transaction',
            };

            return [
                'type' => $type,
                'source' => 'financial_transactions',
                'source_id' => $tx->id,
                'category' => $tab,
                'amount' => $baseAmount,
                'display_amount' => $displayAmount,
                'currency' => strtolower($from),
                'display_currency' => strtolower($displayCurrency),
                'status' => $tx->status,
                'is_success' => $tx->status === 'completed',
                'created_at' => optional($tx->transaction_date)->format('Y-m-d H:i:s') ?? $tx->created_at->format('Y-m-d H:i:s'),
                'creator_id' => $tx->user_id,
                'gifter_id' => $tx->supporter_id,
                'description' => $tx->description,
                'gifter' => $tx->supporter ? [
                    'name' => $tx->supporter->name,
                    'username' => $tx->supporter->username,
                    'avatar' => $tx->supporter->avatar_url,
                ] : null,
                'creator' => $tx->user ? [
                    'name' => $tx->user->name,
                    'username' => $tx->user->username,
                    'avatar' => $tx->user->avatar_url,
                ] : null,
            ];
        })->values()->toArray();

        $nextBefore = $hasMore && !empty($events) ? end($events)['created_at'] : null;

        return [
            'status' => true,
            'events' => $events,
            'has_more' => $hasMore,
            'next_before' => $nextBefore,
        ];
    }

    public function transactionsFeed(Request $request)
    {
        $user = User::findOrFail(Auth::id());
        $tab = $request->query('tab', 'received');
        $limit = intval($request->query('limit', 20));
        $before = $request->query('before');
        $displayCurrency = strtoupper($request->cookie('currency', $user->default_currency ?? 'GBP'));
        $rate = \App\Models\Currency::where('ISO', $displayCurrency)->value('conversion_rate');
        if (!$rate || (float) $rate <= 0) {
            $displayCurrency = 'GBP';
        }

        return response()->json(
            $this->buildFinancialTransactionsFeed($user, $tab, $limit, $before, $displayCurrency)
        );
        $events = [];

        if ($tab === 'sent') {
            // WISH
            $wishItems = StripePaymentItems::whereHas('payment', function ($q) use ($user) {
                $q->where(function ($sub) use ($user) {
                    $sub->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                });
            })->with(['payment.owner', 'wish'])->get();
            foreach ($wishItems as $it) {
                $events[] = [
                    'type' => 'gift_wish',
                    'source' => 'stripe_payment_items',
                    'source_id' => $it->id,
                    'category' => 'sent',
                    'amount' => $it->amount,
                    'tax' => 0,
                    'vat_amount' => $it->vat_amount ?? ($it->tax ?? 0),
                    'currency' => optional($it->payment)->currency,
                    'created_at' => Carbon::parse($it->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => optional($it->payment->owner)->id,
                    'gifter_id' => $user->id,
                    'gifter' => [
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar_url,
                    ],
                    'creator' => [
                        'name' => optional($it->payment->owner)->name,
                        'username' => optional($it->payment->owner)->username,
                        'avatar' => optional($it->payment->owner)->avatar_url,
                    ],
                    'wish' => $it->wish ? [
                        'id' => $it->wish->id,
                        'uuid' => $it->wish->uuid ?? null,
                        'name' => $it->wish->wishname,
                        'perma_link' => $it->wish->perma_link,
                        'reward_file' => $it->wish->content_file_url ?? $it->wish->reward_url ?? null,
                    ] : null,
                    'access' => $it->wish && ($it->wish->content_file_url ?? $it->wish->reward_url ?? null) ? 'Reward file' : null,
                    'open_link' => ($it->wish && optional($it->payment->owner)->username)
                        ? ("/" . optional($it->payment->owner)->username . "/wish/" . $it->wish->id)
                        : null,
                ];
            }
            // MEMBERSHIP
            $membershipPayments = MembershipPayment::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            })->with(['membership', 'membership.user', 'user'])->get();
            foreach ($membershipPayments as $mp) {
                $events[] = [
                    'type' => 'gift_membership',
                    'source' => 'membership_payments',
                    'source_id' => $mp->id,
                    'category' => 'sent',
                    'amount' => $mp->amount,
                    'tax' => $mp->tax,
                    'vat_amount' => $mp->vat_tax_amount ?? 0,
                    'currency' => $mp->currency,
                    'created_at' => Carbon::parse($mp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => optional(optional($mp->membership)->user)->id,
                    'gifter_id' => $user->id,
                    'gifter' => [
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar_url,
                    ],
                    'creator' => [
                        'name' => optional(optional($mp->membership)->user)->name,
                        'username' => optional(optional($mp->membership)->user)->username,
                        'avatar' => optional(optional($mp->membership)->user)->avatar_url,
                    ],
                    'membership' => $mp->membership ? [
                        'uuid' => $mp->membership->uuid ?? null,
                        'level' => $mp->membership->level,
                        'perma_link' => $mp->membership->perma_link,
                    ] : null,
                    'access' => 'Members-only posts',
                    'open_link' => optional(optional($mp->membership)->user)->username ? ("/" . optional(optional($mp->membership)->user)->username) : null,
                ];
            }
            // BILLS
            $billPayments = BillPayment::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            })->with(['bill', 'bill.user', 'user'])->get();
            foreach ($billPayments as $bp) {
                $events[] = [
                    'type' => 'gift_bill',
                    'source' => 'bill_payments',
                    'source_id' => $bp->id,
                    'category' => 'sent',
                    'amount' => $bp->amount,
                    'tax' => $bp->tax,
                    'vat_amount' => $bp->vat_tax_amount ?? 0,
                    'currency' => $bp->currency,
                    'created_at' => Carbon::parse($bp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => optional($bp->bill->user)->id,
                    'gifter_id' => $user->id,
                    'gifter' => [
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar_url,
                    ],
                    'creator' => [
                        'name' => optional($bp->bill->user)->name,
                        'username' => optional($bp->bill->user)->username,
                        'avatar' => optional($bp->bill->user)->avatar_url,
                    ],
                    'bill' => $bp->bill ? [
                        'uuid' => $bp->bill->uuid ?? null,
                        'name' => $bp->bill->name,
                        'perma_link' => $bp->bill->perma_link,
                    ] : null,
                    'access' => 'Subscription-only posts',
                    'open_link' => optional($bp->bill->user)->username ? ("/" . optional($bp->bill->user)->username) : null,
                ];
            }
            // SUPPORT/TIP
            $tipPayments = TipGoalsPayment::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            })->with(['creator', 'user'])->get();
            foreach ($tipPayments as $tp) {
                $vatAmount = $tp->vat_amount ?? 0;
                $events[] = [
                    'type' => 'gift_tip',
                    'source' => 'tip_goals_payments',
                    'source_id' => $tp->id,
                    'category' => 'sent',
                    'amount' => $tp->amount,
                    'tax' => $tp->tax,
                    'vat_amount' => $vatAmount,
                    'paid_total' => $tp->total_paid ?? null,
                    'currency' => $tp->currency,
                    'created_at' => Carbon::parse($tp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => optional($tp->creator)->id,
                    'gifter_id' => $user->id,
                    'gifter' => [
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar_url,
                    ],
                    'creator' => [
                        'name' => optional($tp->creator)->name,
                        'username' => optional($tp->creator)->username,
                        'avatar' => optional($tp->creator)->avatar_url,
                    ],
                    'certificate_url' => $tp->certificate_url ?? null,
                    'access' => 'Supporters-only posts',
                    'open_link' => optional($tp->creator)->username
                        ? ("/" . optional($tp->creator)->username)
                        : null,
                ];
            }
            // SHOP
            $shopPayments = ShopPayment::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('email', $user->email);
            })->with(['shop', 'shop.user', 'user'])->get();
            foreach ($shopPayments as $sp) {
                $events[] = [
                    'type' => 'gift_shop',
                    'source' => 'shop_payments',
                    'source_id' => $sp->id,
                    'category' => 'sent',
                    'amount' => $sp->amount,
                    'tax' => $sp->tax_amount ?? 0,
                    'vat_amount' => $sp->vat_tax_amount ?? 0,
                    'currency' => $sp->currency,
                    'created_at' => Carbon::parse($sp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => optional(optional($sp->shop)->user)->id,
                    'gifter_id' => $user->id,
                    'gifter' => [
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar_url,
                    ],
                    'creator' => [
                        'name' => optional(optional($sp->shop)->user)->name,
                        'username' => optional(optional($sp->shop)->user)->username,
                        'avatar' => optional(optional($sp->shop)->user)->avatar_url,
                    ],
                    'shop' => $sp->shop ? [
                        'uuid' => $sp->shop->uuid ?? null,
                        'name' => $sp->shop->name,
                        'perma_link' => $sp->shop->perma_link,
                    ] : null,
                    'access' => 'Physical item',
                    'open_link' => $sp->shop ? $sp->shop->perma_link : null,
                ];
            }
            // TASK
            $taskPurchases = TaskPurchase::where('supporter_id', $user->id)->with(['task'])->get();
            foreach ($taskPurchases as $tpur) {
                $creatorUser = User::find($tpur->creator_id);
                $events[] = [
                    'type' => 'gift_task',
                    'source' => 'task_purchases',
                    'source_id' => $tpur->id,
                    'category' => 'sent',
                    'amount' => $tpur->amount,
                    'tax' => 0,
                    'vat_amount' => $tpur->vat_amount ?? 0,
                    'currency' => 'gbp',
                    'created_at' => Carbon::parse($tpur->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $tpur->creator_id,
                    'gifter_id' => $user->id,
                    'gifter' => [
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar' => $user->avatar_url,
                    ],
                    'creator' => [
                        'name' => optional($creatorUser)->name,
                        'username' => optional($creatorUser)->username,
                        'avatar' => optional($creatorUser)->avatar_url,
                    ],
                    'task' => $tpur->task ? [
                        'title' => $tpur->task->title,
                        'uuid' => $tpur->task->uuid,
                        'reward_file' => ($tpur->task->type === 'instant' && in_array($tpur->status, ['paid', 'delivered', 'completed', 'completed_accepted', 'paid_out'])) 
                            ? route('task.download', $tpur->task->uuid) 
                            : ($tpur->proof_content['media_url'] ?? null),
                        'reward_note' => ($tpur->task->type === 'instant' && in_array($tpur->status, ['paid', 'delivered', 'completed', 'completed_accepted', 'paid_out']))
                            ? $tpur->task->deliverable_note
                            : ($tpur->proof_content['message'] ?? null),
                    ] : null,
                    'access' => 'Task benefits',
                    'open_link' => $tpur->task ? ("/task/" . $tpur->task->uuid) : null,
                ];
            }
        } else {
            // RECEIVED
            $creator = $user;
            // WISH
            $wishItems = StripePaymentItems::whereHas('payment', function ($q) use ($creator) {
                $q->where('owner_id', $creator->id);
            })->with(['payment.user', 'wish'])->get();
            foreach ($wishItems as $it) {
                $events[] = [
                    'type' => 'gift_wish',
                    'source' => 'stripe_payment_items',
                    'source_id' => $it->id,
                    'category' => 'received',
                    'amount' => $it->amount,
                    'tax' => 0,
                    'vat_amount' => $it->vat_amount ?? ($it->tax ?? 0),
                    'currency' => optional($it->payment)->currency,
                    'created_at' => Carbon::parse($it->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $creator->id,
                    'creator' => [
                        'name' => $creator->name,
                        'username' => $creator->username,
                        'avatar' => $creator->avatar_url,
                    ],
                    'gifter_id' => optional($it->payment->user)->id,
                    'gifter' => [
                        'name' => optional($it->payment->user)->name ?? $it->payment->guest_name ?? null,
                        'username' => optional($it->payment->user)->username ?? null,
                        'avatar' => optional($it->payment->user)->avatar_url ?? null,
                    ],
                    'wish' => $it->wish ? [
                        'id' => $it->wish->id,
                        'uuid' => $it->wish->uuid ?? null,
                        'name' => $it->wish->wishname,
                        'perma_link' => $it->wish->perma_link,
                        'reward_file' => $it->wish->content_file_url ?? $it->wish->reward_url ?? null,
                    ] : null,
                    'access' => $it->wish && ($it->wish->content_file_url ?? $it->wish->reward_url ?? null) ? 'Reward file' : null,
                    'open_link' => $it->wish ? ("/" . $creator->username . "/wish/" . $it->wish->id) : null,
                ];
            }
            // MEMBERSHIP
            $membershipPayments = MembershipPayment::whereHas('membership', function ($q) use ($creator) {
                $q->where('user_id', $creator->id);
            })->with(['membership', 'user'])->get();
            foreach ($membershipPayments as $mp) {
                $events[] = [
                    'type' => 'gift_membership',
                    'source' => 'membership_payments',
                    'source_id' => $mp->id,
                    'category' => 'received',
                    'amount' => $mp->amount,
                    'tax' => $mp->tax,
                    'vat_amount' => $mp->vat_tax_amount ?? 0,
                    'currency' => $mp->currency,
                    'created_at' => Carbon::parse($mp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $creator->id,
                    'creator' => [
                        'name' => $creator->name,
                        'username' => $creator->username,
                        'avatar' => $creator->avatar_url,
                    ],
                    'gifter_id' => optional($mp->user)->id,
                    'access' => 'Members-only posts',
                    'gifter' => [
                        'name' => optional($mp->user)->name ?? $mp->guest_name ?? null,
                        'username' => optional($mp->user)->username ?? null,
                        'avatar' => optional($mp->user)->avatar_url ?? null,
                    ],
                    'membership' => $mp->membership ? [
                        'uuid' => $mp->membership->uuid ?? null,
                        'level' => $mp->membership->level,
                        'perma_link' => $mp->membership->perma_link,
                    ] : null,
                    'open_link' => optional($mp->user)->username ? ("/" . optional($mp->user)->username) : null,
                ];
            }
            // BILLS
            $billPayments = BillPayment::whereHas('bill', function ($q) use ($creator) {
                $q->where('user_id', $creator->id);
            })->with(['bill', 'user'])->get();
            foreach ($billPayments as $bp) {
                $events[] = [
                    'type' => 'gift_bill',
                    'source' => 'bill_payments',
                    'source_id' => $bp->id,
                    'category' => 'received',
                    'amount' => $bp->amount,
                    'tax' => $bp->tax,
                    'vat_amount' => $bp->vat_tax_amount ?? 0,
                    'currency' => $bp->currency,
                    'created_at' => Carbon::parse($bp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $creator->id,
                    'creator' => [
                        'name' => $creator->name,
                        'username' => $creator->username,
                        'avatar' => $creator->avatar_url,
                    ],
                    'gifter_id' => optional($bp->user)->id,
                    'bill' => $bp->bill ? [
                        'uuid' => $bp->bill->uuid ?? null,
                        'name' => $bp->bill->name,
                        'perma_link' => $bp->bill->perma_link,
                    ] : null,
                    'access' => 'Subscription-only posts',
                    'gifter' => [
                        'name' => optional($bp->user)->name ?? $bp->guest_name ?? null,
                        'username' => optional($bp->user)->username ?? null,
                        'avatar' => optional($bp->user)->avatar_url ?? null,
                    ],
                    'open_link' => optional($bp->user)->username ? ("/" . optional($bp->user)->username) : null,
                ];
            }
            // SUPPORT/TIP
            $tipPayments = TipGoalsPayment::where('creator_id', $creator->id)->with(['user'])->get();
            foreach ($tipPayments as $tp) {
                $vatAmount = $tp->vat_amount ?? 0;
                $events[] = [
                    'type' => 'gift_tip',
                    'source' => 'tip_goals_payments',
                    'source_id' => $tp->id,
                    'category' => 'received',
                    'amount' => $tp->amount,
                    'tax' => $tp->tax,
                    'vat_amount' => $vatAmount,
                    'currency' => $tp->currency,
                    'created_at' => Carbon::parse($tp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $creator->id,
                    'creator' => [
                        'name' => $creator->name,
                        'username' => $creator->username,
                        'avatar' => $creator->avatar_url,
                    ],
                    'gifter_id' => optional($tp->user)->id,
                    'certificate_url' => $tp->certificate_url ?? null,
                    'access' => 'Supporters-only posts',
                    'gifter' => [
                        'name' => optional($tp->user)->name ?? $tp->guest_name ?? null,
                        'username' => optional($tp->user)->username ?? null,
                        'avatar' => optional($tp->user)->avatar_url ?? null,
                    ],
                    'open_link' => optional($tp->user)->username ? ("/" . optional($tp->user)->username) : null,
                ];
            }
            // SHOP
            $shopPayments = ShopPayment::whereHas('shop', function ($q) use ($creator) {
                $q->where('user_id', $creator->id);
            })->with(['shop', 'user'])->get();
            foreach ($shopPayments as $sp) {
                $events[] = [
                    'type' => 'gift_shop',
                    'source' => 'shop_payments',
                    'source_id' => $sp->id,
                    'category' => 'received',
                    'amount' => $sp->amount,
                    'tax' => $sp->tax_amount ?? 0,
                    'vat_amount' => $sp->vat_tax_amount ?? 0,
                    'currency' => $sp->currency,
                    'created_at' => Carbon::parse($sp->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $creator->id,
                    'creator' => [
                        'name' => $creator->name,
                        'username' => $creator->username,
                        'avatar' => $creator->avatar_url,
                    ],
                    'gifter_id' => optional($sp->user)->id,
                    'shop' => $sp->shop ? [
                        'uuid' => $sp->shop->uuid ?? null,
                        'name' => $sp->shop->name,
                        'perma_link' => $sp->shop->perma_link,
                    ] : null,
                    'access' => 'Physical item',
                    'gifter' => [
                        'name' => optional($sp->user)->name ?? $sp->name ?? null,
                        'username' => optional($sp->user)->username ?? null,
                        'avatar' => optional($sp->user)->avatar_url ?? null,
                    ],
                    'open_link' => $sp->shop ? $sp->shop->perma_link : null,
                ];
            }
            // TASK
            $taskPurchases = TaskPurchase::where('creator_id', $creator->id)->with(['task', 'supporter'])->get();
            foreach ($taskPurchases as $tpur) {
                $events[] = [
                    'type' => 'gift_task',
                    'source' => 'task_purchases',
                    'source_id' => $tpur->id,
                    'category' => 'received',
                    'amount' => $tpur->amount,
                    'tax' => 0,
                    'vat_amount' => $tpur->vat_amount ?? 0,
                    'currency' => 'gbp',
                    'created_at' => Carbon::parse($tpur->created_at)->format('Y-m-d H:i:s'),
                    'creator_id' => $creator->id,
                    'creator' => [
                        'name' => $creator->name,
                        'username' => $creator->username,
                        'avatar' => $creator->avatar_url,
                    ],
                    'gifter_id' => optional($tpur->supporter)->id,
                    'task' => $tpur->task ? [
                        'title' => $tpur->task->title,
                        'uuid' => $tpur->task->uuid,
                        'reward_file' => ($tpur->task->type === 'instant' && in_array($tpur->status, ['paid', 'delivered', 'completed', 'completed_accepted', 'paid_out'])) 
                            ? route('task.download', $tpur->task->uuid) 
                            : ($tpur->proof_content['media_url'] ?? null),
                        'reward_note' => ($tpur->task->type === 'instant' && in_array($tpur->status, ['paid', 'delivered', 'completed', 'completed_accepted', 'paid_out']))
                            ? $tpur->task->deliverable_note
                            : ($tpur->proof_content['message'] ?? null),
                    ] : null,
                    'access' => 'Task benefits',
                    'gifter' => [
                        'name' => optional($tpur->supporter)->name ?? null,
                        'username' => optional($tpur->supporter)->username ?? null,
                        'avatar' => optional($tpur->supporter)->avatar_url ?? null,
                    ],
                    'open_link' => $tpur->task ? ("/task/" . $tpur->task->uuid) : null,
                ];
            }
        }

        foreach ($events as $idx => $ev) {
            $src = $ev['source'] ?? null;
            $sid = $ev['source_id'] ?? null;
            $etype = $ev['type'] ?? null;
            $creatorId = $ev['creator_id'] ?? null;
            $gifterId = $ev['gifter_id'] ?? null;
            if (!$src || !$sid || !$etype || !$creatorId || !$gifterId) {
                $events[$idx]['reactions'] = [];
                $events[$idx]['replies'] = [];
                continue;
            }
            try {
                $counts = SupportStoryReaction::where([
                    'creator_id' => $creatorId,
                    'gifter_id' => $gifterId,
                    'event_type' => $etype,
                    'source' => $src,
                    'source_id' => $sid,
                ])->selectRaw('emoji, COUNT(*) as c')->groupBy('emoji')->pluck('c', 'emoji')->toArray();
                $events[$idx]['reactions'] = $counts;
                $replies = SupportStoryReply::where([
                    'creator_id' => $creatorId,
                    'gifter_id' => $gifterId,
                    'event_type' => $etype,
                    'source' => $src,
                    'source_id' => $sid,
                ])->orderBy('created_at', 'desc')->limit(5)->get()->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'user_id' => $r->user_id,
                        'username' => optional($r->user)->username,
                        'avatar' => optional($r->user)->avatar_url,
                        'message' => $r->message,
                        'created_at' => $r->created_at->format('Y-m-d H:i:s'),
                    ];
                })->toArray();
                $events[$idx]['replies'] = $replies;
            } catch (\Throwable $e) {
                $events[$idx]['reactions'] = [];
                $events[$idx]['replies'] = [];
            }
        }

        usort($events, fn ($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));
        if (!empty($before)) {
            $events = array_values(array_filter($events, function ($e) use ($before) {
                return strtotime($e['created_at']) < strtotime($before);
            }));
        }
        $sliced = array_slice($events, 0, $limit);
        $hasMore = count($events) > $limit;
        $nextBefore = $hasMore && !empty($sliced) ? end($sliced)['created_at'] : null;
        return response()->json([
            'status' => true,
            'events' => $sliced,
            'has_more' => $hasMore,
            'next_before' => $nextBefore,
        ]);
    }
    public function profileStepsStatus()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $memPost = Post::where('user_id', $user->id)->where('for_module', 'membership')->first();
        $subPost = Post::where('user_id', $user->id)->where('for_module', 'subscription')->first();
        $supPost = Post::where('user_id', $user->id)->where('for_module', 'support')->first();
        $membership = Membership::where('user_id', $user->id)->where('deleted_at', null)->where('status', 1)->whereIn('approved', [0, 1])->first();
        $bill = Bills::where('user_id', $user->id)->where('deleted_at', null)->where('status', 1)->whereIn('approved', [0, 1])->first();
        $total = 0;
        $basic_profile = empty($user->avatar) || empty($user->bio) || empty($user->cover) ? 0 : 1;
        if ($basic_profile) {
            $total += 1;
        }
        $social_links = empty($user->social_links) ? 0 : 1;
        if ($social_links) {
            $total += 1;
        }
        $userIntro = UserIntro::where('user_id', $user->id)->first();
        $intro = !empty($userIntro) ? 1 : 0;
        if ($intro) {
            $total += 1;
        }
        // $post_required = !empty($memPost) && !empty($subPost) && !empty($supPost) ? 1 : 0;
        // if ($post_required) {
        //     $total += 1;
        // }
        $member_required = !empty($membership) ? 1 : 0;
        if ($member_required) {
            $total += 1;
        }
        $bill_required = !empty($bill) ? 1 : 0;
        if ($bill_required) {
            $total += 1;
        }
        $vat_setting = !empty($user->vat_amount_percentage) ? 1 : 0;
        if ($vat_setting) {
            $total += 1;
        }
        // $payment_connect = $user->stripe_details_submitted ? 1 : 0;
        // if ($payment_connect) {
        //     $total += 1;
        // }
        $shop = !empty($user->shop) ? 1 : 0;
        if ($shop) {
            $total += 1;
        }
        $contents = !empty($user->wishItems) && !empty($user->memberships) && !empty($user->bills) ? 1 : 0;
        if ($contents) {
            $total += 1;
        }
        $auto_tweets = $user->auto_tweet;
        if ($auto_tweets) {
            $total += 1;
        }

        return response()->json([
            'status' => true,
            'basic_profile' => $basic_profile,
            'intro' => $intro,
            // 'post_required' => $post_required,
            'membership_required' => $member_required,
            'bill_required' => $bill_required,
            'vat_setting' => $vat_setting,
            // 'payment_connect' => $payment_connect,
            'contents' => $contents,
            'auto_tweets' => $auto_tweets,
            'shop' => $shop,
            'social_links' => $social_links,
            'total' => $total,
        ]);
    }

    /**
     * Get the list of notifications
     *
     * @return JsonResponse
     */
    public function getNotifications()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $notifications = Notification::where('notifiable_id', $user->id)->with('user')->orderBy('created_at', 'DESC')->paginate(30);
        return response()->json([
            'status' => true,
            'notifications' => $notifications->items(),
            "last_page" => $notifications->lastPage() ?? null,
            "current_page" => $notifications->currentPage() ?? null,
            "total" => $notifications->total() ?? null,
            "per_page" => $notifications->perPage() ?? null,
        ]);
    }

    public function markRead()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        Notification::where('notifiable_id', $user->id)->where('is_read', 0)->update(['is_read' => 1]);

        return response()->json([
            'status' => true,
            'message' => "Notifications marked as read."
        ]);
    }

    public function deleteAllNotifications()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        Notification::where('notifiable_id', $user->id)->delete();

        return response()->json([
            'status' => true,
            'message' => "All notifications deleted."
        ]);
    }

    public function piggyBankSetting()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        if ($user->show_piggy_bank == 0) {
            $user->show_piggy_bank = 1;
        } else {
            $user->show_piggy_bank = 0;
        }
        $user->save();
        $this->userProfileService->clearUserCaches($user->username, $user->id);
        return response()->json([
            'status' => true,
            'message' => 'Piggy Bank Settings Updated.'
        ]);
    }

    public function getImageGenerateAI(Request $request)
    {
        $request->validate([
            'prompt' => [
                'required',
                'string'
            ],
            'size' => ['required', 'string'],
        ]);

        $secret = env('DALLE_SECRET_KEY');

        $data = [
            'model' => 'dall-e-3',
            'prompt' => $request->prompt,
            'n' => 1,
            'size' => $request->size,
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $secret,
        ])->post('https://api.openai.com/v1/images/generations', $data);

        $resp = json_decode($response);

        if (!empty($resp->data[0])) {
            $url = $resp->data[0];
            return response()->json([
                'status' => true,
                'image_url' => $url
            ]);
        }

        return response()->json([
            'status' => false,
            'data' => $resp
        ]);
    }


    public function uploadDalleImage(Request $request)
    {
        $request->validate([
            'url' => [
                'required'
            ]
        ]);

        $imageContent = file_get_contents($request->url);

        // Create image from content
        $image = Image::make($imageContent);

        // Encode the image to a string
        $encodedImage = (string) $image->encode();

        // Upload to Uploadcare
        $uploader = $this->uploadcareApi->uploader();
        $response = $uploader->fromContent($encodedImage, 'image/jpeg');

        return response()->json([
            'status' => true,
            'uuid' => $response->getUuid()
        ]);
    }

    public function show2faQR()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $qrCode = null;

        if (empty($user->tfa_key)) {
            $user->tfa_key = $this->google2FA->generateSecretKey();
            $user->save();
        }

        $qrCode = $this->google2FA->getQRCodeInline("SpennyPiggy", $user->email, $user->tfa_key);

        return response()->json([
            'status' => true,
            'qr_code' => $qrCode,
        ]);
    }

    public function verification2FA(Request $request)
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $valid = false;
        if (!empty($request->otp)) {
            $valid = $this->google2FA->verifyKey($user->tfa_key, $request->otp);
        }

        $codes = [];
        if ($valid) {
            $recovery = new Recovery();
            $codes = $recovery->setCount(5)->toCollection();
            UserBackupCode::where('user_id', $user->id)->delete();
            foreach ($codes as $key => $value) {
                $backup = new UserBackupCode();
                $backup->user_id = $user->id;
                $backup->code = encrypt($value);
                $backup->save();
            }

            $user->is_2fa = 1;
            $user->save();
        }

        $message = $valid ? "Two factor authentication verification success." : "Two factor authentication verification failed.";
        return response()->json([
            'status' => $valid,
            'msg' => $message,
            'codes' => $codes,
        ]);
    }

    /**
     * Enable disable 2FA
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response json
     */
    public function update2faStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|boolean'
        ]);
        $user = User::find(Auth::id());
        $status = $request->status ?? 0;

        $user->is_2fa = $status;
        $user->save();
        if ($status == 0) {
            UserBackupCode::where('user_id', $user->id)->delete();
        }

        $msg = 'Two factor authentication has been ' . ($status ? 'enabled.' : 'disabled.');

        return response()->json([
            'status' => true,
            'tfa_status' => $user->is_2fa,
            'msg'  => $msg,
        ]);
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
}

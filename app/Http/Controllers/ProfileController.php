<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Http\Requests\ProfileUpdateRequest;
use App\Jobs\CheckProfilePhotosAdult;
use App\Jobs\SendBioSocialUpdateEmail;
use App\Jobs\SendBioSocialUpdateMail;
use App\Jobs\SendIntroMailAdmin;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\GifterCardVerification;
use App\Models\Logs;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\MonthlyCharge;
use App\Models\Notification;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostCommentReplies;
use App\Models\PostLike;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopPayment;
use App\Models\ShopShippingInfo;
use App\Models\ShopVarients;
use App\Models\SocialLinks;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserBackupCode;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\UserDocuments;
use App\Models\UserIntro;
use App\Models\UserShopCategories;
use App\Models\UserVerificationStatus;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpParser\Node\Expr\Print_;
use Uploadcare\Api;
use Uploadcare\AuthUrl\AuthUrlConfig;
use Uploadcare\AuthUrl\Token\AkamaiToken;
use PragmaRX\Google2FALaravel\Google2FA;
use Uploadcare\Configuration;
use Image;
use PragmaRX\Recovery\Recovery;

class ProfileController extends Controller
{

    protected $uploadcareApi;

    protected $google2FA;

    public function __construct(Google2FA $google2FA)
    {
        $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(env('UPLOADCARE_SECRET_KEY'), 300));
        $config = Configuration::create(env('UPLOADCARE_PUBLIC_KEY'), env('UPLOADCARE_SECRET_KEY'))->setAuthUrlConfig($authUrlConfig);
        $this->uploadcareApi = new Api($config);
        $this->google2FA = $google2FA;
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

    /**
     * Update the user's profile information.
     */
    public function updateProfile(Request $request)
    {
        // $fullUrl = $request->fullUrl(); // Includes query parameters
        // $method = $request->method();   // GET, POST, etc.

        // Log::info("🔗 URL Hit: $method $fullUrl");

        $user = User::where('id', Auth::id())->where(
            'is_uk',
            0
            // $q->whereNot('country', 'GB')->orWhereNull('country');
        )->first();
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
                'bio' => ['nullable', 'string', 'max:255'], // updated
                'tags' => ['nullable', 'string', 'max:255'], // same fix
            ]);

            $avatar = $request->avatar;
            $cover = $request->cover;

            $user->name = $request->name;
            $user->username = $request->username;
            $userProfileStatus = UserVerificationStatus::where('user_id', $user->id)->where('role', $user->role)->first();
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

                if ($updatedFields['bio'] || $updatedFields['social']) {
                    dispatch(new SendBioSocialUpdateEmail($user, $updatedFields));
                }
                $user->bio = $request->bio;
                $userProfileStatus->user_profile_status = $userProfileStatus->role == 0 ? 4 : 0;
                $userProfileStatus->save();
            }
            $user->min_surprise_amount = $request->min_surprise_amount ?? 0;

            if (!empty($avatar)) {
                $user->avatar = $avatar['uuid'] ?? null;
                $user->avatar_approved = 0;
                $user->avatar_cdn_modifier = $avatar['cdnUrlModifiers'] ?? null;

                // user profile status column update when avatar update
                $userProfileStatus->user_profile_status = $userProfileStatus->role == 0 ? 4 : 0;
                $userProfileStatus->save();
            }
            if (!empty($cover)) {
                $user->cover = $cover['uuid'] ?? null;
                $user->cover_approved = 0;
                $user->cover_cdn_modifier = $cover['cdnUrlModifiers'] ?? null;
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
            return redirect(route("user.show", ["username" => $request->username ?? $user->username]))->with('success', "Profile has been updated.");
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

        if (!empty($bills)) {
            foreach ($bills as $bill) {
                StripeControl::cancelSubscription($bill->stripe_id);
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
        if ($user->notification_send == 0) {
            $user->notification_send == 1;
            $status = 'Enabled';
        } else {
            $user->notification_send == 0;
            $status = 'Disabled';
        }

        $user->save();

        return response()->json([
            'status' => true,
            'msg' => "Notifications for email are $status."
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
                    'msg' => 'Your content contains the nudity. Please try alernative.'
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

        $intro = UserIntro::where('user_id', Auth::id())->first();

        if (empty($intro)) {
            $intro = UserIntro::create([
                'uuid' => $media['uuid'],
                'user_id' => Auth::id(),
                'height' => $media['videoInfo']['video']['height'],
                'width' => $media['videoInfo']['video']['width'],
            ]);
        } else {
            $intro->uuid = $media['uuid'];
            $intro->height = $media['videoInfo']['video']['height'];
            $intro->width = $media['videoInfo']['video']['width'];
            $intro->save();
        }

        $intro->refresh();

        $intro->poster_url;

        SendIntroMailAdmin::dispatch($intro);

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
        $intro = UserIntro::firstWhere(Auth::id());

        return response()->json([
            'status' => true,
            'intro' => $intro
        ]);
    }


    /**
     * List the intro video by uuid
     *
     * @param $uuid uuid of the intro video
     * @return JsonResponse
     */
    public function getIntroById($id)
    {
        if (Auth::id() == $id) {
            $intro = UserIntro::where('user_id', $id)->first();
            return response()->json([
                'status' => true,
                'intro' => $intro,
                'login' => true,
            ]);
        } else {
            $intro = UserIntro::where('user_id', $id)->whereApproved(1)->first();
            return response()->json([
                'status' => true,
                'intro' => $intro
            ]);
        }
    }

    /**
     * Delete the intro video
     *
     * @return JsonResponse
     */
    public function removeIntro()
    {
        $intro = UserIntro::whereUserId(Auth::id())->first();
        $intro->delete();

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
        $subscription = WishItem::where('subscription', 1)->whereHas('wishItemsSubscription', function ($qu) use ($user) {
            $qu->where('recurring_for', 'continue')->where(function ($que) {
                $que->where('created_at', '<=', Carbon::now())->where('upcoming_payment', '>=', Carbon::now());
            })->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
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

    public function piggyBankSetting()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        if ($user->show_piggy_bank == 0) {
            $user->show_piggy_bank = 1;
        } else {
            $user->show_piggy_bank = 0;
        }
        $user->save();
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

        if (!empty($user->tfa_key)) {
            $qrCode = $this->google2FA->getQRCodeInline("SpennyPiggy", $user->email, $user->tfa_key);
        }

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

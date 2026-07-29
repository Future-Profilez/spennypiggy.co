<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Http\Requests\ProfileUpdateRequest;
use App\Jobs\CheckMediaModeration;
use App\Jobs\SendBioSocialUpdateEmail;
use App\Jobs\SendIntroMailAdmin;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Logs;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\MonthlyCharge;
use App\Models\Notification;
use App\Models\PiggyPotContribution;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostCommentReplies;
use App\Models\PostLike;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopPayment;
use App\Models\ShopShippingInfo;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\SupportStoryReaction;
use App\Models\SupportStoryReply;
use App\Models\SupportTicket;
use App\Models\TaskPurchase;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserBackupCode;
use App\Models\UserBlock;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\UserIntro;
use App\Models\UserShopCategories;
use App\Models\UserVerificationStatus;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Services\RekognitionModeration;
use App\Services\Risk\EffectiveLimitsService;
use App\Services\Risk\RiskIdentityService;
use App\Services\UserProfileService;
use App\StripeControl;
use App\Support\PresetCovers;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Facades\Image;
use PragmaRX\Google2FALaravel\Google2FA;
use PragmaRX\Recovery\Recovery;
use Uploadcare\Api;
use Uploadcare\AuthUrl\AuthUrlConfig;
use Uploadcare\AuthUrl\Token\AkamaiToken;
use Uploadcare\Configuration;

class ProfileController extends Controller
{
    /**
     * How long the upload-time check waits for Rekognition before letting the
     * image through unjudged. The uploader shows a "scanning" state for this,
     * and the queued scan is the authority behind it either way.
     */
    private const UPLOAD_SCAN_WAIT_SECONDS = 8;

    protected $uploadcareApi;

    protected $google2FA;

    protected $userProfileService;

    public function __construct(Google2FA $google2FA, UserProfileService $userProfileService)
    {
        $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(config('services.uploadcare.secret'), 300));
        $config = Configuration::create(config('services.uploadcare.public'), config('services.uploadcare.secret'))->setAuthUrlConfig($authUrlConfig);
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
        $uploadcareHost = 'https://upload.uploadcare.com/base/';
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

            $user = User::where('id', Auth::id())->first();
            $currency = strtolower($request->cookie('currency', 'GBP'));

            // if($request->min_surprise_amount < 5){
            //     return redirect()->back()->with("error", "Please set the minimum amount greater than 5.");
            // }

            $blockedWord = Helpers::checkBlockData($request);
            if ($blockedWord !== false) {
                return redirect()->back()->with('error', "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
            } else {
                $messages = [
                    'username.regex' => 'The username must only contain letters, numbers, periods (.), and underscores (_).',
                ];

                $request->validate([
                    'name' => ['string', 'max:255'],
                    'username' => ['string', 'lowercase', 'regex:/^[a-zA-Z0-9_\.]+$/', 'max:20', Rule::unique('users')->ignore($user->id)],
                    'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                    'bio' => ['nullable', 'string', 'max:255'], // updated
                    'creator_category' => ['nullable', 'array'],
                    'gender' => ['nullable', 'string', 'max:50'],
                    'country' => ['nullable', 'string', 'max:100'],
                    'date_of_birth' => ['nullable', 'date', 'before:today'],
                    // Both of these are written straight to the users table and
                    // then interpolated into an image URL by the accessors
                    // (`https://ucarecdn.com/{uuid}/{modifier}`), so the shape
                    // has to be checked here — the client is the only thing that
                    // has ever decided what goes in them.
                    'avatar' => ['nullable', 'array'],
                    'avatar.uuid' => ['nullable', 'uuid'],
                    'avatar.cdnUrlModifiers' => ['nullable', 'string', 'max:255', 'regex:/^[-\/:.,%~\w]+$/'],
                    'cover' => ['nullable', 'array'],
                    'cover.uuid' => ['nullable', 'uuid'],
                    'cover.cdnUrlModifiers' => ['nullable', 'string', 'max:255', 'regex:/^[-\/:.,%~\w]+$/'],
                ], $messages);

                $avatar = $request->avatar;
                $cover = $request->cover;

                $user->name = $request->name;
                $user->username = $request->username;
                $user->gender = $request->gender;
                $user->country = $request->country;
                if ($request->has('date_of_birth')) {
                    $user->date_of_birth = $request->date_of_birth;
                }
                $user->creator_category = ! empty($request->creator_category) ? json_encode($request->creator_category) : null;

                if ($request->email !== $user->email) {
                    // Direct update to ensure it persists and bypasses any potential model interference
                    User::where('id', $user->id)->update([
                        'email' => $request->email,
                        'email_verified_at' => null,
                    ]);
                    $user->refresh(); // Sync the model instance with DB changes
                    Log::info('Email updated and verification reset for user: '.$user->id);
                }

                $userProfileStatus = UserVerificationStatus::where('user_id', $user->id)->where('role', $user->role)->first();
                if (! $userProfileStatus) {
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
                        'bio_status' => ! empty($request->bio) ? 0 : null,
                    ]);

                    $updatedFields = [
                        'bio' => $request->bio !== $user->bio,
                        'social' => $request->social_handle !== $user->social_handle,
                    ];

                    if ($user->profile_status_lock == 2 && ((! empty($updatedFields['bio']) && ! empty($request->bio)) || ! empty($updatedFields['social']))) {
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

                if (is_array($avatar) && ! empty($avatar)) {
                    $user->avatar = $avatar['uuid'] ?? null;
                    $user->avatar_approved = 0;
                    // $user->profile_status_lock = 1;
                    $user->avatar_cdn_modifier = $avatar['cdnUrlModifiers'] ?? null;
                    if ($userProfileStatus) {
                        $userProfileStatus->user_profile_status = 0;
                        $userProfileStatus->save();
                    }
                }
                if (is_array($cover) && ! empty($cover)) {
                    $user->cover = $cover['uuid'] ?? null;
                    $user->cover_approved = PresetCovers::isPreApproved($user->cover) ? 1 : 0;
                    $user->cover_cdn_modifier = $cover['cdnUrlModifiers'] ?? null;
                }

                if ($request->hasFile('social_image')) {
                    $file = $request->file('social_image');

                    $uploadcareHost = 'https://upload.uploadcare.com/base/';

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
                        Log::error('Uploadcare error', ['response' => $response->body()]);

                        return back()->with('error', 'Failed to upload image to Uploadcare.');
                    }
                }

                $user->save();
                $user->refresh();

                if (! empty($request->bio)) {
                    $logs = Logs::where('edited_about_me_id', $user->id)->where('status', 'pending')->first();
                    if (! empty($logs)) {
                        // logs data save
                        $logs->status = 'updated';
                        $logs->save();

                        // user data save
                        $user->edit_bio_reason = '';
                        $user->save();
                        $user->refresh();
                    }
                }
                // SFW gate on profile media. Both are uploaded unapproved and wait
                // for an admin either way; the scan is what tells the reviewer
                // which photo to look at hardest, and writes the reason the
                // creator sees. Only dispatched when the upload actually changed,
                // so an unrelated profile edit does not re-scan (and re-flag) a
                // photo an admin already cleared.
                if (is_array($avatar) && ! empty($avatar) && ! empty($user->avatar)) {
                    CheckMediaModeration::dispatch(
                        User::class,
                        $user->id,
                        $user->avatar,
                        ['avatar_approved' => 0],
                        'avatar'
                    );
                }

                // A curated cover is never re-scanned: it has already been
                // reviewed, and a false positive would pull the same banner off
                // every profile using it, on an unrelated profile edit.
                if (is_array($cover) && ! empty($cover) && ! empty($user->cover) && ! PresetCovers::isPreApproved($user->cover)) {
                    CheckMediaModeration::dispatch(
                        User::class,
                        $user->id,
                        $user->cover,
                        ['cover_approved' => 0],
                        'cover'
                    );
                }

                $this->userProfileService->clearUserCaches($user->username, $user->id);

                return redirect(route('user.show', ['username' => $request->username ?? $user->username]))->with('success', 'Profile has been updated.');
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
            $user = User::where('id', Auth::id())->first();
            if ($user->role == 1) {
                $user->profile_status_lock = 1;
                $user->save();
            }

            return back()->with('success', 'Your Verification Request Submit Successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating profile lock status: '.$e->getMessage());

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
        if (! empty($bills)) {
            foreach ($bills as $bill) {
                StripeControl::cancelSubscription($bill->stripe_id, $connectedAccount);
            }
        }

        $members = MembershipPayment::where('user_id', $user->id)->where('status', 'paid')->get();

        if (! empty($members)) {
            foreach ($members as $member) {
                StripeControl::cancelSubscription($member->stripe_id);
            }
        }

        $wishSubs = WishItemSubscription::where('user_id', $user->id)->where('status', 'paid')->get();

        if (! empty($wishSubs)) {
            foreach ($wishSubs as $sub) {
                StripeControl::cancelSubscription($sub->stripe_id);
            }
        }

        $monthlyCharges = MonthlyCharge::where('user_id', $user->id)->where('status', 'paid')->get();

        if (! empty($monthlyCharges)) {
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

        if (! empty($user->account_id)) {
            StripeControl::deleteAccount($user->account_id);
            $user->account_id = null;
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
        $user = User::where('id', Auth::id())->first();

        if (! $user) {
            return response()->json([
                'status' => false,
                'msg' => 'User not found.',
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
            'message' => "Notifications for email are $status.",
        ]);
    }

    /**
     * Upload-time SFW check — immediate feedback while the creator is still on
     * the form, so a rejected image can be swapped before they finish filling
     * it in. The authority is the queued CheckMediaModeration scan, which runs
     * server-side and cannot be skipped by calling the save endpoint directly.
     *
     * Both use the same label list and the same confidence floor, so the fast
     * check and the authoritative one cannot disagree about the same image.
     */
    public function checkAdultContent($uuid)
    {
        // Fast feedback while the creator is still on the upload form. The
        // authority is the queued CheckMediaModeration scan, which runs
        // server-side on save and cannot be skipped by posting straight to the
        // save endpoint — this only saves the creator from filling in a whole
        // form around an image that was never going to be accepted.
        //
        // ⚠️ It used to `execute` the add-on and read the labels on the very
        // next call. The add-on is asynchronous, so that read returned an EMPTY
        // array — indistinguishable from "clean" — and the check therefore
        // passed explicit images almost every time. RekognitionModeration waits
        // for the scan to actually finish.
        $labels = RekognitionModeration::labels($uuid, self::UPLOAD_SCAN_WAIT_SECONDS);

        // No verdict in time: let it through rather than refusing an upload we
        // have not actually judged. The queued scan still holds it on save.
        if ($labels === null) {
            return response()->json(['status' => true, 'msg' => 'Success.']);
        }

        if (RekognitionModeration::restrictedLabel($labels) !== null) {
            return response()->json([
                'status' => false,
                'msg' => 'This image did not pass our content check. Please try a different one.',
            ]);
        }

        return response()->json(['status' => true, 'msg' => 'Success.']);
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
            ],
        ]);

        $media = $request->media;

        // Robustly derive UUID from payload (supports both uuid and url)
        $uuid = $media['uuid'] ?? null;
        if (empty($uuid) && ! empty($media['url'])) {
            $url = $media['url'];
            // Extract the first path segment after host as UUID
            $uuid = preg_replace('#https?://[^/]+/([^/]+)/?.*#', '$1', $url);
        }
        if (empty($uuid)) {
            return response()->json([
                'status' => false,
                'msg' => 'Unable to identify uploaded video. Please re-upload.',
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
            'msg' => 'Your intro video has been saved.',
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
            'intro' => $intro,
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

        if (! $intro) {
            return response()->json([
                'status' => false,
                'msg' => 'No intro video found to remove.',
            ], 404);
        }

        $intro->delete();

        $user = Auth::user();
        $this->userProfileService->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'The intro video has been removed.',
        ]);
    }

    public function gifterAccessPosts($username)
    {
        $user = User::where('username', $username)->first();

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
            'last_page' => $posts->lastPage() ?? null,
            'current_page' => $posts->currentPage() ?? null,
            'total' => $posts->total() ?? null,
            'per_page' => $posts->perPage() ?? null,
        ]);
    }

    public function supportStory($creatorUsername, $gifterUsername)
    {
        $creator = User::where('username', $creatorUsername)->firstOrFail();
        $gifter = User::where('username', $gifterUsername)->firstOrFail();

        if (! Auth::check() || (Auth::id() !== $gifter->id && Auth::id() !== $creator->id)) {
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
                'vat_amount' => $it->vat_amount,
                'creator_amount' => $it->amount,
                'tax' => $it->tax,
                'currency' => $it->payment->currency,
                'created_at' => Carbon::parse($it->created_at)->format('Y-m-d H:i:s'),
                'owner' => [
                    'name' => $it->payment->owner->name,
                    'username' => $it->payment->owner->username,
                    'avatar' => $it->payment->owner->avatar_url,
                ],
                'wish' => ! empty($it->wish) ? [
                    'id' => $it->wish->id,
                    'uuid' => $it->wish->uuid ?? null,
                    'name' => $it->wish->wishname,
                    'perma_link' => $it->wish->perma_link,
                    'reward_file' => $it->wish->content_file_url ?? $it->wish->reward_url ?? null,
                ] : null,
                'message' => $it->payment->message ?? null,
                'status' => $it->payment->payment_status ?? null,
            ];

            if (! empty($it->thankyou_message) || ! empty($it->message_url)) {
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
                'membership' => ! empty($mp->membership) ? [
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
                'bill' => ! empty($bp->bill) ? [
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
                'tip' => ! empty($tp->tipGoal) ? [
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
                'shop' => ! empty($sp->shop) ? [
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
                'task' => ! empty($tpur->task) ? [
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
            if (! $src || ! $sid || ! $etype) {
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
        if (! empty($before)) {
            $events = array_values(array_filter($events, function ($e) use ($before) {
                return strtotime($e['created_at']) < strtotime($before);
            }));
        }
        $isViewerGifter = Auth::id() === $gifter->id;
        $events = array_map(function ($ev) use ($isViewerGifter) {
            $modelClass = match ($ev['source']) {
                'stripe_payment_items' => StripePaymentDetail::class,
                'membership_payments' => MembershipPayment::class,
                'bill_payments' => BillPayment::class,
                'tip_goals_payments' => TipGoalsPayment::class,
                'piggy_pot_contributions' => PiggyPotContribution::class,
                'shop_payments' => ShopPayment::class,
                'task_purchases' => TaskPurchase::class,
                default => null,
            };

            if ($modelClass && isset($ev['source_id'])) {
                $ft = FinancialTransaction::where('source_type', $modelClass)
                    ->where('source_id', $ev['source_id'])
                    ->first();

                if ($ft) {
                    $ev['amount'] = $isViewerGifter ? (float) $ft->gross_amount : (float) $ft->net_amount;
                    $ev['creator_amount'] = (float) $ft->net_amount;

                    $status = $ft->status;
                    if ($isViewerGifter) {
                        // Gifter only sees 'completed' or 'refunded'
                        if ($status === 'refunded') {
                            $ev['status'] = 'refunded';
                        } elseif (in_array($status, ['completed', 'review_hold', 'disputed', 'pending'])) {
                            $ev['status'] = 'completed';
                        }
                    } else {
                        $ev['status'] = $status;
                    }
                }
            }

            return $ev;
        }, $events);

        $sliced = array_slice($events, 0, $limit);
        $hasMore = count($events) > $limit;
        $nextBefore = $hasMore && ! empty($sliced) ? end($sliced)['created_at'] : null;

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
            'emoji' => 'required|string|max:12',
        ]);
        $creator = User::where('username', $creatorUsername)->firstOrFail();
        $gifter = User::where('username', $gifterUsername)->firstOrFail();
        if (! Auth::check() || (Auth::id() !== $gifter->id && Auth::id() !== $creator->id)) {
            throw new AuthorizationException('Unauthorized');
        }
        $exists = SupportStoryReaction::where([
            'creator_id' => $creator->id,
            'gifter_id' => $gifter->id,
            'user_id' => Auth::id(),
            'event_type' => $request->event_type,
            'source' => $request->source,
            'source_id' => $request->source_id,
            'emoji' => $request->emoji,
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
                'emoji' => $request->emoji,
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
            'message' => 'required|string|max:250',
        ]);

        // Word count limit: 90 words
        $wordCount = str_word_count($request->message);
        if ($wordCount > 90) {
            return response()->json(['status' => false, 'msg' => 'Message exceeds 90 words limit.'], 422);
        }

        $creator = User::where('username', $creatorUsername)->firstOrFail();
        $gifter = User::where('username', $gifterUsername)->firstOrFail();

        if (! Auth::check() || (Auth::id() !== $gifter->id && Auth::id() !== $creator->id)) {
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
            'message' => $request->message,
        ]);

        return response()->json(['status' => true, 'reply' => [
            'id' => $reply->id,
            'user_id' => $reply->user_id,
            'username' => Auth::user()->username,
            'avatar' => Auth::user()->avatar_url,
            'message' => $reply->message,
            'created_at' => $reply->created_at->format('Y-m-d H:i:s'),
        ]]);
    }

    public function supportHistory()
    {
        if (! Auth::check()) {
            return Inertia::render('Auth/Login');
        }

        $user = Auth::user();
        $displayCurrency = strtoupper(request()->cookie('currency', $user->default_currency ?? 'GBP'));

        $limitsMinor = null;
        try {
            $deviceId = request()->cookie('device_id') ?: request()->header('X-Device-ID');
            $identity = app(RiskIdentityService::class)->resolveIdentity([
                'email' => $user->email,
                'ip' => request()->ip(),
                'device_id' => $deviceId,
                'is_guest' => false,
            ]);
            $limitsMinor = app(EffectiveLimitsService::class)->getEffectiveLimits($identity);
        } catch (\Throwable $e) {
            $limitsMinor = null;
        }

        $receivedAll = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->with('source')
            ->get();

        $sentAll = FinancialTransaction::where('supporter_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->with('source')
            ->get();

        $allCurrencies = $receivedAll
            ->pluck('currency')
            ->merge($sentAll->pluck('currency'))
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = Currency::whereIn('ISO', $allCurrencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        if (
            ! isset($currencyMeta[$displayCurrency]) ||
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

            if (! isset($currencyMeta[$from]) || ! isset($currencyMeta[$to])) {
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

        $filterEarnings = function ($tx) {
            // If it's a Task purchase, only include if it's actually finished/completed
            if ($tx->source_type === TaskPurchase::class) {
                if (! $tx->source) {
                    return false;
                }

                // Canonical earned-status list — must match FinancialService::getSummary,
                // PayoutService and ReleaseReserves. 'delivered' used to be included
                // here and nowhere else, so this total counted tasks still sitting in
                // escrow: the creator was shown more received income than the dashboard
                // reported or the payout run would ever pay.
                return in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out']);
            }

            return true;
        };

        $receivedTotal = $receivedAll->filter($filterEarnings)->sum(function ($tx) use ($convert, $displayCurrency) {
            $tx->is_included_in_totals = true; // Mark as included
            $from = strtoupper($tx->currency ?? 'GBP');
            $amount = (float) ($tx->net_amount ?? 0);

            return $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);
        });

        // Mark excluded ones
        $receivedAll->each(function ($tx) use ($filterEarnings) {
            if (! isset($tx->is_included_in_totals)) {
                $tx->is_included_in_totals = $filterEarnings($tx);
            }
        });

        $sentTotal = $sentAll->sum(function ($tx) use ($convert, $displayCurrency) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $amount = (float) ($tx->gross_amount ?? 0);

            return $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);
        });

        $spendSummary = null;
        try {
            $now = Carbon::now();
            $sentCompletedBase = FinancialTransaction::where('supporter_id', $user->id)
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
        usort($allEvents, function ($a, $b) {
            $dateA = strtotime($a['created_at']);
            $dateB = strtotime($b['created_at']);
            if ($dateA !== $dateB) {
                return $dateB <=> $dateA;
            }

            return ($b['id'] ?? 0) <=> ($a['id'] ?? 0);
        });

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
                ],
            ],
        ]);
    }

    private function buildFinancialTransactionsFeed($user, $tab, $limit, $before, $displayCurrency)
    {
        $tab = $tab === 'sent' ? 'sent' : 'received';
        $limit = (int) $limit;
        $before = $before ?: null;

        $query = FinancialTransaction::query()
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded']);

        if ($tab === 'sent') {
            $query->where('supporter_id', $user->id);
        } else {
            $query->where('user_id', $user->id);
        }

        if (! empty($before)) {
            $query->where('transaction_date', '<', $before);
        }

        $rows = $query
            ->with([
                'user:id,name,username,avatar',
                'supporter:id,name,username,avatar',
                'source',
            ])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit($limit + 1)
            ->get();

        $rows->loadMorph('source', [
            ShopPayment::class => ['shop'],
            TaskPurchase::class => ['task'],
            StripePaymentItems::class => ['wish', 'payment'],
            MembershipPayment::class => ['membership'],
            BillPayment::class => ['bill'],
            PiggyPotContribution::class => ['piggyPot'],
            TipGoalsPayment::class => ['tipGoal'],
        ]);

        // Load deliverables for all transactions
        $sessionIds = collect();
        $rows->each(function ($tx) use ($sessionIds) {
            if (! $tx->source) {
                return;
            }
            $base = class_basename($tx->source_type);
            $sessionId = match ($base) {
                'ShopPayment', 'MembershipPayment', 'BillPayment', 'TipGoalsPayment', 'PiggyPotContribution' => $tx->source->session_id ?? null,
                'TaskPurchase' => $tx->source->stripe_session_id ?? null,
                'StripePaymentItems' => $tx->source->payment->session_id ?? null,
                default => null,
            };
            if ($sessionId) {
                $sessionIds->push($sessionId);
            }
        });

        if ($sessionIds->isNotEmpty()) {
            $deliverables = Deliverable::whereIn('session_id', $sessionIds->filter()->unique())->get()->keyBy('session_id');

            $rows->each(function ($tx) use ($deliverables) {
                if (! $tx->source) {
                    return;
                }
                $base = class_basename($tx->source_type);
                $sessionId = match ($base) {
                    'ShopPayment', 'MembershipPayment', 'BillPayment', 'TipGoalsPayment', 'PiggyPotContribution' => $tx->source->session_id ?? null,
                    'TaskPurchase' => $tx->source->stripe_session_id ?? null,
                    'StripePaymentItems' => $tx->source->payment->session_id ?? null,
                    default => null,
                };
                if ($sessionId && $deliverables->has($sessionId)) {
                    $tx->source->setRelation('deliverable', $deliverables->get($sessionId));
                }
            });
        }

        $hasMore = $rows->count() > $limit;
        $rows = $rows->take($limit)->values();

        $supportTickets = SupportTicket::whereIn('source_id', $rows->map(function ($tx) {
            return $tx->source_type === FinancialTransaction::class || empty($tx->source_type) ? $tx->id : $tx->source_id;
        })->filter())
            ->where(function ($q) use ($user, $tab) {
                if ($tab === 'sent') {
                    $q->where('supporter_id', $user->id);
                } else {
                    $q->where('creator_id', $user->id);
                }
            })
            ->get()
            ->groupBy(function ($t) {
                return $t->source.'_'.$t->source_id;
            });

        $currencies = $rows
            ->pluck('currency')
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = Currency::whereIn('ISO', $currencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');

            if ($from === $to) {
                return $amount;
            }

            if (! isset($currencyMeta[$from]) || ! isset($currencyMeta[$to])) {
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

        // Gated-post access is the "reward" for recurring/support types: count each
        // creator's approved posts per access module so the UI can show what was unlocked.
        $creatorIds = $rows->pluck('user_id')->filter()->unique()->values();
        $gatedPostCounts = collect();
        if ($creatorIds->isNotEmpty()) {
            $gatedPostCounts = Post::whereIn('user_id', $creatorIds)
                ->whereIn('for_module', ['membership', 'subscription', 'support'])
                ->where('approved', 1)
                ->selectRaw('user_id, for_module, COUNT(*) as c')
                ->groupBy('user_id', 'for_module')
                ->get()
                ->groupBy('user_id');
        }

        // Reactions and replies were three queries per row (reactions, this-user's reaction,
        // replies), i.e. 60-80 round trips on a full page. Derive each row's composite key
        // once, then bulk-load all three in three queries and match in PHP below.
        $deriveEventKey = function ($tx) {
            $base = class_basename($tx->source_type);
            $type = match ($base) {
                'StripePaymentItems' => 'gift_wish',
                'MembershipPayment' => 'gift_membership',
                'BillPayment' => 'gift_bill',
                'TipGoalsPayment' => 'gift_tip',
                'PiggyPotContribution' => 'piggy_pot',
                'ShopPayment' => 'gift_shop',
                'TaskPurchase' => 'gift_task',
                default => 'transaction',
            };
            $source = match ($base) {
                'StripePaymentItems' => 'stripe_payment_items',
                'MembershipPayment' => 'membership_payments',
                'BillPayment' => 'bill_payments',
                'TipGoalsPayment' => 'tip_goals_payments',
                'PiggyPotContribution' => 'piggy_pot_contributions',
                'ShopPayment' => 'shop_payments',
                'TaskPurchase' => 'task_purchases',
                default => 'financial_transactions',
            };
            $sourceId = $source === 'financial_transactions' ? $tx->id : $tx->source_id;

            return [$type, $source, $sourceId];
        };

        // Full composite so a source_id shared across two source tables can't cross-match.
        $composite = fn ($creatorId, $gifterId, $type, $source, $sourceId) => implode('|', [$creatorId, $gifterId, $type, $source, $sourceId]);

        $sourceIdSet = collect();
        foreach ($rows as $tx) {
            [, , $sourceId] = $deriveEventKey($tx);
            if ($sourceId !== null) {
                $sourceIdSet->push($sourceId);
            }
        }
        $sourceIdSet = $sourceIdSet->unique()->values();

        $reactionsByKey = [];
        $userReactedByKey = [];
        $repliesByKey = [];
        $authId = Auth::id();

        if ($sourceIdSet->isNotEmpty()) {
            foreach (SupportStoryReaction::whereIn('source_id', $sourceIdSet)->get(['creator_id', 'gifter_id', 'event_type', 'source', 'source_id', 'emoji', 'user_id']) as $r) {
                $k = $composite($r->creator_id, $r->gifter_id, $r->event_type, $r->source, $r->source_id);
                $reactionsByKey[$k][$r->emoji] = ($reactionsByKey[$k][$r->emoji] ?? 0) + 1;
                if ($authId && (int) $r->user_id === (int) $authId) {
                    $userReactedByKey[$k][] = $r->emoji;
                }
            }

            $repliesRaw = SupportStoryReply::whereIn('source_id', $sourceIdSet)
                ->with('user:id,username,avatar,avatar_approved,avatar_cdn_modifier')
                ->orderBy('created_at', 'desc')
                ->get();
            foreach ($repliesRaw as $r) {
                $k = $composite($r->creator_id, $r->gifter_id, $r->event_type, $r->source, $r->source_id);
                // Preserve the previous per-event limit of 5, newest first.
                if (count($repliesByKey[$k] ?? []) >= 5) {
                    continue;
                }
                $repliesByKey[$k][] = [
                    'id' => $r->id,
                    'user_id' => $r->user_id,
                    'username' => optional($r->user)->username,
                    'avatar' => optional($r->user)->avatar_url,
                    'message' => $r->message,
                    'created_at' => $r->created_at->format('Y-m-d H:i:s'),
                ];
            }
        }

        $events = $rows->map(function ($tx) use ($tab, $displayCurrency, $convert, $supportTickets, $gatedPostCounts, $composite, $reactionsByKey, $userReactedByKey, $repliesByKey) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $baseAmount = $tab === 'sent' ? (float) ($tx->gross_amount ?? 0) : (float) ($tx->net_amount ?? 0);
            $displayAmount = $from === $displayCurrency ? $baseAmount : ($convert($from, $baseAmount, $displayCurrency) ?? $baseAmount);

            $base = class_basename($tx->source_type);
            $type = match ($base) {
                'StripePaymentItems' => 'gift_wish',
                'MembershipPayment' => 'gift_membership',
                'BillPayment' => 'gift_bill',
                'TipGoalsPayment' => 'gift_tip',
                'PiggyPotContribution' => 'piggy_pot',
                'ShopPayment' => 'gift_shop',
                'TaskPurchase' => 'gift_task',
                default => 'transaction',
            };

            $source = match ($base) {
                'StripePaymentItems' => 'stripe_payment_items',
                'MembershipPayment' => 'membership_payments',
                'BillPayment' => 'bill_payments',
                'TipGoalsPayment' => 'tip_goals_payments',
                'PiggyPotContribution' => 'piggy_pot_contributions',
                'ShopPayment' => 'shop_payments',
                'TaskPurchase' => 'task_purchases',
                default => 'financial_transactions',
            };

            $sourceId = $source === 'financial_transactions' ? $tx->id : $tx->source_id;

            $status = $tx->status;
            $reserveAmount = (float) ($tx->reserve_amount ?? 0);

            // Item status for tasks/shops
            $itemStatus = null;
            if ($tx->source_type === TaskPurchase::class && $tx->source) {
                $itemStatus = match ($tx->source->status) {
                    'completed', 'completed_accepted', 'paid_out' => 'task_complete',
                    'delivered' => 'task_delivered',
                    'pending_review' => 'task_review_pending',
                    'paid', 'assigned' => 'task_pending',
                    default => 'task_'.$tx->source->status
                };
            } elseif ($tx->source_type === ShopPayment::class && $tx->source) {
                $deliverableStatus = $tx->source->deliverable ? $tx->source->deliverable->status : 'processing';
                $itemStatus = match ($deliverableStatus) {
                    'delivered' => 'item_complete',
                    'shipped' => 'item_shipped',
                    'processing' => 'item_processing',
                    default => 'item_'.$deliverableStatus
                };
            }

            // Inclusion logic for UI messages.
            // Must match the canonical earned-status list used by
            // FinancialService::getSummary, PayoutService and ReleaseReserves —
            // a 'delivered' task is still in escrow until the buyer accepts (or
            // auto-confirm runs), so it is NOT counted as earned yet. Listing it
            // as "included in totals" here contradicted the dashboard/payout.
            $isIncluded = true;
            if ($tx->type === 'income' && $tx->source_type === TaskPurchase::class) {
                $taskStatus = $tx->source->status ?? null;
                $isIncluded = in_array($taskStatus, ['completed', 'completed_accepted', 'paid_out']);
            } elseif ($tx->status !== 'completed') {
                $isIncluded = false;
            }

            // Gifter view normalization
            if ($tab === 'sent') {
                $reserveAmount = 0; // Hide reserves from gifter
                $isIncluded = true; // Gifter always sees their spend in their local totals

                // Gifter only sees 'completed' or 'refunded'
                if ($status === 'refunded') {
                    $status = 'refunded';
                } elseif (in_array($status, ['completed', 'review_hold', 'disputed', 'pending'])) {
                    $status = 'completed';
                }
            }

            // Normalized item + reward contract for the history UI.
            // Every paid item exposes the same shape so the frontend renders one card.
            $cdn = function ($v) {
                if (empty($v)) {
                    return null;
                }

                return Str::startsWith($v, ['http://', 'https://'])
                    ? $v
                    : 'https://ucarecdn.com/'.$v.'/';
            };

            $src = $tx->source;
            $deliverable = $src->deliverable ?? null;
            $certificateUrl = $deliverable->certificate_url ?? null;
            $creatorUsername = $tx->user->username ?? null;

            $itemTitle = null;
            $openPage = null;
            $askQuestion = null;
            $answer = null;
            $paymentId = null;
            $reward = [
                'description' => null,
                'media' => null,
                'file_url' => null,
                'perks' => [],
                'access' => null,
                'is_instant' => true,
            ];

            if ($base === 'StripePaymentItems' && $src) {
                $wish = $src->wish;
                $itemTitle = $wish?->wishname;
                $openPage = 'wishes';
                if ($wish) {
                    if ($wish->content_file) {
                        $reward['media'] = [
                            'type' => $wish->content_file_type ?? 'image',
                            'name' => $wish->content_file_name ?: 'Exclusive content',
                            'url' => $cdn($wish->content_file),
                        ];
                    }
                    $reward['file_url'] = $cdn($wish->reward ?? null);
                }
            } elseif ($base === 'ShopPayment' && $src) {
                $shop = $src->shop;
                $itemTitle = $shop->name ?? null;
                $openPage = 'shop';
                $askQuestion = $shop->ask_question ?? null;
                $answer = $src->answer ?? null;
                $paymentId = $src->uuid;
                $reward['is_instant'] = ($shop->type ?? 'digital') !== 'physical';
                if ($reward['is_instant']) {
                    $reward['description'] = $shop->success_page_value ?? null;
                    if ($shop->reward_file ?? null) {
                        $reward['media'] = [
                            'type' => $shop->reward_file_type ?? null,
                            'name' => 'Digital content',
                            'url' => $cdn($shop->reward_file),
                        ];
                    }
                }
            } elseif ($base === 'TaskPurchase' && $src) {
                $task = $src->task;
                $itemTitle = $task->title ?? null;
                $openPage = 'tasks';
                $reward['is_instant'] = ($task->type ?? 'timed') === 'instant';
                $reward['description'] = $task->deliverable_note ?? null;
                if ($reward['is_instant'] && ($task->deliverable_content ?? null)) {
                    $reward['media'] = [
                        'type' => $task->deliverable_content_type ?? 'image',
                        'name' => 'Task content',
                        'url' => $cdn($task->deliverable_content),
                    ];
                }
            } elseif ($base === 'MembershipPayment' && $src) {
                $membership = $src->membership;
                $itemTitle = ($membership?->level) ? 'Level '.ucfirst($membership->level) : null;
                $openPage = 'memberships';
                $rawRewards = $membership?->rewards;
                if (is_string($rawRewards)) {
                    $decoded = json_decode($rawRewards, true);
                    $rawRewards = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $rawRewards)));
                }
                if (is_array($rawRewards)) {
                    $reward['perks'] = array_values(array_filter(array_map(
                        fn ($r) => ucwords(str_replace('_', ' ', trim((string) $r))),
                        $rawRewards
                    )));
                }
                if ($membership && $membership->thumbnail) {
                    $reward['media'] = ['type' => 'image', 'name' => 'Membership', 'url' => $cdn($membership->thumbnail)];
                }
            } elseif ($base === 'BillPayment' && $src) {
                $bill = $src->bill;
                $itemTitle = $bill->name ?? null;
                $openPage = 'bills';
                if ($bill && $bill->content_file) {
                    $reward['media'] = ['type' => null, 'name' => 'Subscription content', 'url' => $cdn($bill->content_file)];
                }
            } elseif ($base === 'PiggyPotContribution' && $src) {
                $pot = $src->piggyPot;
                $itemTitle = $pot->title ?? null;
                $openPage = 'piggy-pots';
                if ($pot) {
                    $reward['description'] = $pot->content_description ?? null;
                    if ($pot->content_file) {
                        $reward['media'] = ['type' => $pot->content_file_type ?? null, 'name' => 'Exclusive content', 'url' => $cdn($pot->content_file)];
                    }
                }
            } elseif ($base === 'TipGoalsPayment' && $src) {
                $tip = $src->tipGoal;
                $itemTitle = $tip?->name;
                $openPage = 'tips';
                $reward['description'] = $tip?->description;
            }

            $openLink = ($creatorUsername && $openPage) ? '/'.$creatorUsername.'?page='.$openPage : null;

            // Content-access reward: members-only / subscriber / supporter-only posts.
            $accessSpec = match ($type) {
                'gift_membership' => ['module' => 'membership',   'label' => 'Members-only posts'],
                'gift_bill' => ['module' => 'subscription', 'label' => 'Subscriber posts'],
                'gift_tip' => ['module' => 'support',      'label' => 'Supporter-only posts'],
                default => null,
            };
            if ($accessSpec && $creatorUsername) {
                $byCreator = $gatedPostCounts->get($tx->user_id);
                $countRow = $byCreator ? $byCreator->firstWhere('for_module', $accessSpec['module']) : null;
                $reward['access'] = [
                    'label' => $accessSpec['label'],
                    'count' => $countRow ? (int) $countRow->c : 0,
                    'url' => '/'.$creatorUsername,
                ];
            }

            $event = [
                'uuid' => $tx->uuid,
                'type' => $type,
                'source' => $source,
                'source_id' => $sourceId,
                'category' => $tab,
                'amount' => $baseAmount,
                'display_amount' => $displayAmount,
                'currency' => strtolower($from),
                'display_currency' => strtolower($displayCurrency),
                'status' => $status,
                'item_status' => $itemStatus,
                'is_included_in_totals' => $isIncluded,
                'reserve_status' => $tab === 'sent' ? 'none' : $tx->reserve_status,
                'reserve_amount' => $reserveAmount,
                'is_success' => $status === 'completed',
                'created_at' => optional($tx->transaction_date)->format('Y-m-d H:i:s') ?? $tx->created_at->format('Y-m-d H:i:s'),
                'creator_id' => $tx->user_id,
                'gifter_id' => $tx->supporter_id,
                'id' => $tx->id,
                'description' => $tx->description,
                'support_tickets' => optional($supportTickets->get($source.'_'.$sourceId))->map(function ($t) {
                    return [
                        'uuid' => $t->uuid,
                        'type' => $t->type,
                        'status' => $t->status,
                        'created_at' => $t->created_at->format('Y-m-d H:i:s'),
                    ];
                }) ?? [],
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
                'item_title' => $itemTitle,
                'open_link' => $openLink,
                'reward' => $reward,
                'ask_question' => $askQuestion,
                'answer' => $answer,
                'certificate_url' => $certificateUrl,
                'payment_id' => $paymentId,
                'vat_amount' => (float) ($tx->vat_amount ?? 0),
                // Mode of payment: bank rows are tagged fee_profile='bank'; NULL/'card' = card/wallet.
                'payment_method' => (($tx->fee_profile ?? 'card') === 'bank') ? 'bank' : 'card',
            ];

            // Reactions and replies, read from the pre-loaded lookups keyed on the same
            // composite the bulk queries above grouped by.
            try {
                $eventKey = $composite($tx->user_id, $tx->supporter_id, $type, $source, $sourceId);
                $event['reactions'] = $reactionsByKey[$eventKey] ?? [];
                $event['user_reacted'] = Auth::check() ? ($userReactedByKey[$eventKey] ?? []) : [];
                $event['replies'] = $repliesByKey[$eventKey] ?? [];
            } catch (\Throwable $e) {
                $event['reactions'] = [];
                $event['user_reacted'] = [];
                $event['replies'] = [];
            }

            return $event;
        })->values()->toArray();

        $nextBefore = $hasMore && ! empty($events) ? end($events)['created_at'] : null;

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
        $rate = Currency::where('ISO', $displayCurrency)->value('conversion_rate');
        if (! $rate || (float) $rate <= 0) {
            $displayCurrency = 'GBP';
        }

        return response()->json(
            $this->buildFinancialTransactionsFeed($user, $tab, $limit, $before, $displayCurrency)
        );
    }

    public function profileStepsStatus()
    {
        $user = User::where('id', Auth::id())->first();
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
        $intro = ! empty($userIntro) ? 1 : 0;
        if ($intro) {
            $total += 1;
        }
        // $post_required = !empty($memPost) && !empty($subPost) && !empty($supPost) ? 1 : 0;
        // if ($post_required) {
        //     $total += 1;
        // }
        $member_required = ! empty($membership) ? 1 : 0;
        if ($member_required) {
            $total += 1;
        }
        $bill_required = ! empty($bill) ? 1 : 0;
        if ($bill_required) {
            $total += 1;
        }
        $vat_setting = ! empty($user->vat_amount_percentage) ? 1 : 0;
        if ($vat_setting) {
            $total += 1;
        }
        // $payment_connect = $user->stripe_details_submitted ? 1 : 0;
        // if ($payment_connect) {
        //     $total += 1;
        // }
        $shop = ! empty($user->shop) ? 1 : 0;
        if ($shop) {
            $total += 1;
        }
        $contents = ! empty($user->wishItems) && ! empty($user->memberships) && ! empty($user->bills) ? 1 : 0;
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
        $user = User::where('id', Auth::id())->first();

        $notifications = Notification::where('notifiable_id', $user->id)->with('user')->orderBy('created_at', 'DESC')->paginate(30);

        return response()->json([
            'status' => true,
            'notifications' => $notifications->items(),
            'last_page' => $notifications->lastPage() ?? null,
            'current_page' => $notifications->currentPage() ?? null,
            'total' => $notifications->total() ?? null,
            'per_page' => $notifications->perPage() ?? null,
        ]);
    }

    public function markRead()
    {
        $user = User::where('id', Auth::id())->first();

        Notification::where('notifiable_id', $user->id)->where('is_read', 0)->update(['is_read' => 1]);

        return response()->json([
            'status' => true,
            'message' => 'Notifications marked as read.',
        ]);
    }

    public function deleteAllNotifications()
    {
        $user = User::where('id', Auth::id())->first();

        Notification::where('notifiable_id', $user->id)->delete();

        return response()->json([
            'status' => true,
            'message' => 'All notifications deleted.',
        ]);
    }

    public function piggyBankSetting()
    {
        $user = User::where('id', Auth::id())->first();

        if ($user->show_piggy_bank == 0) {
            $user->show_piggy_bank = 1;
        } else {
            $user->show_piggy_bank = 0;
        }
        $user->save();
        $this->userProfileService->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'message' => 'Piggy Bank Settings Updated.',
        ]);
    }

    public function getImageGenerateAI(Request $request)
    {
        $request->validate([
            'prompt' => [
                'required',
                'string',
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
            'Authorization' => 'Bearer '.$secret,
        ])->post('https://api.openai.com/v1/images/generations', $data);

        $resp = json_decode($response);

        if (! empty($resp->data[0])) {
            $url = $resp->data[0];

            return response()->json([
                'status' => true,
                'image_url' => $url,
            ]);
        }

        return response()->json([
            'status' => false,
            'data' => $resp,
        ]);
    }

    public function uploadDalleImage(Request $request)
    {
        $request->validate([
            'url' => [
                'required',
            ],
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
            'uuid' => $response->getUuid(),
        ]);
    }

    public function show2faQR()
    {
        $user = User::where('id', Auth::id())->first();
        $qrCode = null;

        if (empty($user->tfa_key)) {
            $user->tfa_key = $this->google2FA->generateSecretKey();
            $user->save();
        }

        $qrCode = $this->google2FA->getQRCodeInline('SpennyPiggy', $user->email, $user->tfa_key);

        return response()->json([
            'status' => true,
            'qr_code' => $qrCode,
        ]);
    }

    public function verification2FA(Request $request)
    {
        $user = User::where('id', Auth::id())->first();

        $valid = false;
        if (! empty($request->otp)) {
            $valid = $this->google2FA->verifyKey($user->tfa_key, $request->otp);
        }

        $codes = [];
        if ($valid) {
            $recovery = new Recovery;
            $codes = $recovery->setCount(5)->toCollection();
            UserBackupCode::where('user_id', $user->id)->delete();
            foreach ($codes as $key => $value) {
                $backup = new UserBackupCode;
                $backup->user_id = $user->id;
                $backup->code = encrypt($value);
                $backup->save();
            }

            $user->is_2fa = 1;
            $user->save();
        }

        $message = $valid ? 'Two factor authentication verification success.' : 'Two factor authentication verification failed.';

        return response()->json([
            'status' => $valid,
            'msg' => $message,
            'codes' => $codes,
        ]);
    }

    /**
     * Enable disable 2FA
     *
     * @return \Illuminate\Http\Response json
     */
    public function update2faStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|boolean',
        ]);
        $user = User::find(Auth::id());
        $status = $request->status ?? 0;

        $user->is_2fa = $status;
        $user->save();
        if ($status == 0) {
            UserBackupCode::where('user_id', $user->id)->delete();
        }

        $msg = 'Two factor authentication has been '.($status ? 'enabled.' : 'disabled.');

        return response()->json([
            'status' => true,
            'tfa_status' => $user->is_2fa,
            'msg' => $msg,
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

        $recovery = new Recovery;
        $codes = $recovery->setCount(5)->toCollection();
        UserBackupCode::where('user_id', $user->id)->delete();
        foreach ($codes as $key => $value) {
            $backup = new UserBackupCode;
            $backup->user_id = $user->id;
            $backup->code = encrypt($value);
            $backup->save();
        }

        return response()->json([
            'status' => true,
            'tfa' => true,
            'msg' => 'Open your authenticator app to get security code.',
            'qr' => request()->query('type') == 1 ? $this->twofQR($user->id) : null,
            'backup_codes' => $codes ?? null,
        ], 200);
    }

    public function historyBlockedUsers(Request $request)
    {
        $blockedUsers = UserBlock::with([
            'blockedUser:id,name,username,email,avatar,role',
        ])
            ->where('creator_id', auth()->id())
            ->latest()
            ->paginate(20);

        return Inertia::render(
            'History/BlockedUsers',
            [
                'blockedUsers' => $blockedUsers,
            ]
        );
    }

    // public function blockedUsers($id)
    // {
    //     $block = UserBlock::where(
    //         'creator_id',
    //         auth()->id()
    //     )
    //         ->where('id', $id)
    //         ->firstOrFail();

    //     $block->delete();

    //     return response()->json([
    //         'status' => true,
    //         'message' => 'User unblocked successfully.',
    //     ]);
    // }
}

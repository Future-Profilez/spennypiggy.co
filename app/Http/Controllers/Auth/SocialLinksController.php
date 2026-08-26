<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\SendBioSocialUpdateEmail;
use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserVerificationStatus;
use App\Services\UserProfileService;
use App\Support\ProfileAssetVisibility;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class SocialLinksController extends Controller
{
    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        $this->userProfileService = $userProfileService;
    }

    public function saveSocialLinks(Request $request)
    {
        $redirectUrl = $request->redirect_url;
        $userId = Auth::id();

        try {
            $blockedWord = Helpers::checkBlockData($request);
            if ($blockedWord !== false) {
                return response([
                    'status' => 422,
                    'message' => "The word or emoji '{$blockedWord}' is not allowed as per our policies.",
                ], 422);
            }

            // The platforms a creator may verify against.
            //
            // 🚨 Narrowed to three on 11 Aug 2026 (client decision). This list
            // used to hold THIRTEEN, and any one of them satisfied the
            // requirement — so the platform accepted Facebook and YouTube while
            // the public documentation said "Instagram, X or TikTok only", and
            // TikTok was not a field at all. A creator read the rule and was
            // then shown a Facebook box.
            //
            // These three are what verification is actually performed against:
            // an account with a public post history and a profile photo a human
            // reviewer can compare to a passport.
            $socialPlatforms = SocialLinks::ACCEPTED_PLATFORMS;

            // ✅ Enforce at least one filled field
            $hasAtLeastOne = false;
            foreach ($socialPlatforms as $platform) {
                if ($request->filled($platform)) {
                    $hasAtLeastOne = true;
                    break;
                }
            }

            if (! $hasAtLeastOne) {
                return response([
                    'status' => 422,
                    'message' => 'Please add at least one social media link.',
                ], 422);
            }

            // ✅ Prepare data (ALLOW NULLS)
            //
            // ⚠️ ONLY the accepted platforms are written. The retired columns
            // (facebook, youtube, twitch, tumblr, reddit, discord, onlyfans,
            // loyalfans, fansly, manyvids, other) are deliberately left ALONE
            // rather than nulled: creators verified on them before the narrowing
            // still have those handles approved and rendered on their profile,
            // and writing `$request->facebook` — which the form no longer sends,
            // so always null — would silently wipe an approved link the first
            // time an existing creator edited their Instagram handle.
            //
            // Nothing new can be written to them, which is the whole point; what
            // is already there is theirs.
            $data = [
                'whoyouinto' => $request->whoyouinto,
                'updated_at' => now(),
            ];

            foreach (SocialLinks::ACCEPTED_PLATFORMS as $platform) {
                $data[$platform] = $request->{$platform};
            }

            /*
             * ✅ Moderation reset — for a CREATOR.
             *
             * 🚨 A gifter's handles are approved as they are saved (19 Aug 2026,
             * client direction). Only a creator's profile is reviewed; a gifter
             * reaches an admin for one thing, the £500 address check. Queueing
             * their handles filled the socials screen with rows nobody was going
             * to decide — measured on the day of the change, 13 of them.
             *
             * ⚠️ An admin asking a gifter to change something still sets this
             * back to 0, and that path is untouched — which is why a pending
             * gifter row now always means "an admin asked for this".
             */
            $data['status'] = (int) (Auth::user()->role ?? 1) === 0 ? 1 : 0;
            $data['reason'] = null;

            // ⚠️ Provenance follows the latest submission: a handle first given at
            // signup and then edited here IS a Creator Studio submission now, and a
            // reviewer reading "From signup" on it would be told something untrue.
            // See the 2026_08_25_120000 migration — the column gates nothing.
            $data['source'] = null;

            // ⚠️ `uuid` used to be regenerated here on every save, because it is
            // fillable and was passed in the VALUES array rather than the match array.
            // The row's public identifier changed each time a creator edited a handle.
            $existing = SocialLinks::where('user_id', $userId)->first();

            $user = Auth::user();

            // Handles that are already published are edited through review — the
            // approved set stays on the profile until an admin decides.
            //
            // ⚠️ The proposed map carries EXPLICIT NULLS. `social_links` is one row
            // with one column per platform, and this controller deliberately writes
            // every column, so "I removed my Instagram" is a change carried by a null.
            // Filtering them out would silently drop deletions.
            if (ProfileAssetVisibility::isLive($user, ProfileChangeRequest::ASSET_SOCIALS)) {
                ProfileChangeRequest::open(
                    $user,
                    ProfileChangeRequest::ASSET_SOCIALS,
                    Arr::except($data, ['status', 'reason', 'updated_at', 'source']),
                    $existing ? Arr::only($existing->getAttributes(), ProfileChangeRequest::SOCIAL_FIELDS) : [],
                );
            } else {
                // ✅ Update or create (DO NOT filter nulls)
                SocialLinks::updateOrCreate(
                    ['user_id' => $userId],
                    array_merge($data, [
                        'uuid' => $existing->uuid ?? Uuid::uuid4(),
                    ])
                );
            }

            // ✅ Verification logic
            $role = $user->role;

            UserVerificationStatus::updateOrCreate(
                [
                    'user_id' => $userId,
                    'role' => $role,
                ],
                [
                    'role' => $role,
                    'social_status' => 0,
                    'user_profile_status' => 0,
                ]
            );

            // 🚨 This used to also set `profile_status_lock = 1`. That is not "under
            // review" — it takes the verified badge, removes the creator from Discover,
            // search, trending and top-earners, DELISTS EVERY ITEM THEY SELL, and blocks
            // Stripe onboarding; and nothing on the website ever sets it back to 2. A
            // creator who corrected a typo in their Instagram handle disappeared from the
            // platform until an admin noticed.
            //
            // `social_links.status = 0` above is the review signal, and
            // `CreatorReviewService::queue()` already reads it.
            if ($user->profile_status_lock == 2) {
                dispatch(new SendBioSocialUpdateEmail($user, [
                    'bio' => false,
                    'social' => true,
                ]));
            }

            $this->userProfileService->clearUserCaches($user->username, $user->id);

            return response([
                'status' => 200,
                'message' => 'Social links updated successfully.',
                'url' => $redirectUrl ?? null,
                'socialCheck' => true,
            ]);
        } catch (\Throwable $th) {
            Log::error('Failed to save social links', ['error' => $th->getMessage()]);

            return response([
                'status' => 500,
                'message' => 'An error occurred while saving social links.',
            ], 500);
        }
    }

    // public function saveSocialLinks(Request $request)
    // {
    //     $redirectUrl = $request->redirect_url;
    //     $userId = Auth::id();

    //     try {
    //         if (Helpers::checkBlockData($request) === 1) {
    //             return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute, dick, goddess, master, mistress, 😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
    //         }
    //         $data = [
    //             'whoyouinto' => $request->whoyouinto,
    //             'twitter'    => $request->twitter,
    //             'instagram'  => $request->instagram,
    //             'facebook'   => $request->facebook,
    //             'youtube'    => $request->youtube,
    //             'twitch'     => $request->twitch,
    //             'tumblr'     => $request->tumblr,
    //             'reddit'     => $request->reddit,
    //             'discord'    => $request->discord,
    //             'onlyfans'   => $request->onlyfans,
    //             'loyalfans'  => $request->loyalfans,
    //             'fansly'     => $request->fansly,
    //             'manyvids'   => $request->manyvids,
    //             'other'      => $request->other,
    //             'updated_at' => now(),
    //         ];

    //         $moderation = [
    //             'status' => 0,
    //             'reason' => $request->has('reason') ? $request->reason : null,
    //         ];

    //         $payload = array_filter(array_merge($data, $moderation), fn($v) => $v !== null);
    //         // Add UUID and created_at only if creating
    //         $socialLink = SocialLinks::updateOrCreate(
    //             ['user_id' => $userId],
    //             array_merge($payload, [
    //                 // 'status'       => 1,
    //                 // 'reason'       => null,
    //                 'uuid'       => Uuid::uuid4(),
    //                 'created_at' => now(),
    //             ])
    //         );

    //         // $socialCheck = SocialLinks::whereUserId($userId)
    //         //     ->where(function ($q) {
    //         //         $q->where('twitter', '!=', null)
    //         //             ->orWhere('instagram', '!=', null)
    //         //             ->orWhere('facebook', '!=', null)
    //         //             ->orWhere('twitch', '!=', null)
    //         //             ->orWhere('tumblr', '!=', null)
    //         //             ->orWhere('reddit', '!=', null);
    //         //     })
    //         //     ->exists();

    //         // Define only the social media platforms
    //         $socialPlatforms = ['twitter', 'instagram', 'facebook', 'twitch', 'tumblr', 'reddit'];

    //         // Check if any of them is coming in the request
    //         $socialCheck = false;
    //         foreach ($socialPlatforms as $platform) {
    //             if ($request->filled($platform)) {
    //                 $socialCheck = true;
    //                 break;
    //             }
    //         }

    //         $role = Auth::user()->role;

    //         if ($socialCheck) {
    //             UserVerificationStatus::updateOrCreate(
    //                 [
    //                     'user_id' => $userId,
    //                     'role'    => $role,
    //                 ],
    //                 [
    //                     'role'                => $role,
    //                     'social_status'       => 0,
    //                     'user_profile_status' => 0,
    //                 ]
    //             );

    //             $updatedFields = [
    //                 'bio'    => false,
    //                 'social' => true,
    //             ];

    //             dispatch(new SendBioSocialUpdateEmail(Auth::user(), $updatedFields));
    //         }

    //         // $user = Auth::user();
    //         // $user->profile_status_lock = 1;
    //         // $user->save();

    //         return response([
    //             'status'  => 200,
    //             'message' => "Social links updated successfully.",
    //             'url'     => $redirectUrl ?? null,
    //             'socialCheck'     => $socialCheck,
    //         ]);
    //     } catch (\Throwable $th) {
    //         Log::error('Failed to save social links', ['error' => $th->getMessage()]);
    //         return response([
    //             'status'  => 500,
    //             'message' => 'An error occurred while saving social links.',
    //         ]);
    //     }
    // }
}

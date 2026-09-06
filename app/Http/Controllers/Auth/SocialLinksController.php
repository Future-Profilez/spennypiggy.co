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
use App\Support\InvisibleText;
use App\Support\ProfileAssetVisibility;
use App\Support\SocialVisibility;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class SocialLinksController extends Controller
{
    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        $this->userProfileService = $userProfileService;
    }

    /**
     * The value this save is proposing for one handle column.
     *
     * 🚨 A FIELD THE PAYLOAD DOES NOT CARRY IS NOT A DELETION. `ConvertEmptyStringsToNull`
     * is global (Kernel.php:72), so a box the creator deliberately emptied arrives as
     * null — and so does a field the form never sent. Reading `$request->instagram`
     * made the two IDENTICAL, and this controller writes every accepted column, so a
     * partial payload proposed wiping handles the creator had never touched.
     *
     * Live example, `profile_change_requests` #1 (3 Sep 2026): the row held
     * `instagram = https://instagram.com/4242xo` and the proposal carried
     * `instagram = null`. Approving it would have deleted an approved, published
     * handle that the creator had not edited.
     *
     * `$request->has()` is the discriminator, and it is still true for a real null,
     * so genuinely clearing a handle is unaffected. Same rule as the bio, and the
     * same rule `creator_category` and `pride_badges` already follow.
     */
    private static function submittedValue(Request $request, string $field, ?SocialLinks $existing): ?string
    {
        if (! $request->has($field)) {
            return $existing->{$field} ?? null;
        }

        $value = $request->input($field);

        return is_scalar($value) ? (string) $value : null;
    }

    /**
     * Write the creator's show/hide choice to the live row.
     *
     * ⚠️ The query builder, not `save()`. `social_links.updated_at` is what the admin
     * review queue ages and orders on, so a creator hiding a handle would otherwise
     * jump to the top of a reviewer's list with nothing for them to decide — the same
     * reason `StripeChargesFlag::sync()` avoids Eloquent.
     *
     * ⚠️ No row yet means there is nothing to show either way; the create branch writes
     * the column itself.
     */
    private static function persistVisibility(?SocialLinks $existing, array $visibility): void
    {
        if (! $existing) {
            return;
        }

        // 🚨 `DB::table`, never the Eloquent builder — `Builder::update()` stamps
        // `updated_at` for you (addUpdatedAtColumn), which is the one thing this method
        // exists to avoid.
        DB::table('social_links')
            ->where('id', $existing->getKey())
            ->update(['public_platforms' => json_encode($visibility)]);
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

            // Read BEFORE the payload is turned into a proposal: it is both the
            // fallback for a field the form did not send and the thing this save
            // is compared against.
            //
            // ⚠️ `uuid` used to be regenerated here on every save, because it is
            // fillable and was passed in the VALUES array rather than the match array.
            // The row's public identifier changed each time a creator edited a handle.
            $existing = SocialLinks::where('user_id', $userId)->first();

            $data = [
                'whoyouinto' => self::submittedValue($request, 'whoyouinto', $existing),
                'updated_at' => now(),
            ];

            foreach (SocialLinks::ACCEPTED_PLATFORMS as $platform) {
                $data[$platform] = self::submittedValue($request, $platform, $existing);
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

            /*
             * 🚨 VISIBILITY IS NOT REVIEWABLE CONTENT, so it is kept OUT of `$data`.
             *
             * Turning a handle on or off changes nothing an admin decided — the handle,
             * and therefore the verification, is identical either way. Folding it into
             * the diff below would mean pressing "show my Instagram" re-opened the whole
             * row for review, zeroed `status`, mailed the creator and superseded any
             * request already pending: the creator would hide a handle and lose their
             * place in the queue for it. It is written DIRECTLY to the row instead, on
             * every save, including the "nothing changed" early return.
             *
             * ⚠️ Narrowed against the handles THIS save proposes, not the stored row —
             * a creator types a handle and shows it in the same submit.
             */
            $visibility = SocialVisibility::forStorage(
                $request->input('public_platforms'),
                Arr::only($data, SocialVisibility::platforms()),
            );

            $user = Auth::user();

            /*
             * 🚨 A SAVE THAT CHANGES NOTHING IS NOT AN EDIT.
             *
             * There was no comparison here at all: pressing Save re-opened the
             * handles for review, zeroed `social_links.status`, reset the whole
             * profile's verification status and mailed the creator — for a form
             * they had only looked at. `ProfileChangeRequest::open()` supersedes
             * any request already pending, so a creator who saved twice also took
             * their own earlier submission out of the queue.
             *
             * ⚠️ Compared against WHAT IS BEING SUBMITTED, not only against what is
             * published: with a request already pending, the live row is not what
             * this save would change. Re-submitting the pending values is a no-op;
             * going BACK to the published ones differs from that pending proposal,
             * so it correctly opens a request that reverts it.
             *
             * ⚠️ A REJECTED row is deliberately let through. `status = 2` means an
             * admin asked for something, and refusing to re-submit would leave the
             * creator holding a rejection they cannot clear.
             */
            $pending = ProfileChangeRequest::openFor($userId, ProfileChangeRequest::ASSET_SOCIALS);
            $current = $pending?->proposed
                ?? ($existing ? Arr::only($existing->getAttributes(), ProfileChangeRequest::SOCIAL_FIELDS) : []);

            $unchanged = $existing
                && (int) $existing->status !== SocialLinks::STATUS_REJECTED
                && InvisibleText::sameMap($data, $current, ProfileChangeRequest::SOCIAL_FIELDS);

            if ($unchanged) {
                /*
                 * ⚠️ "The handles did not change" is the COMMONEST way a visibility
                 * change arrives — the creator opened the editor to hide a handle and
                 * touched nothing else. Returning here without writing it would make
                 * the toggle look saved and do nothing.
                 *
                 * ⚠️ Written through the query builder so `updated_at` is untouched: the
                 * admin review queue orders on it, and a display choice must not
                 * reshuffle a reviewer's list.
                 */
                self::persistVisibility($existing, $visibility);

                $this->userProfileService->clearUserCaches($user->username, $user->id);

                return response([
                    'status' => 200,
                    'message' => 'Social links updated successfully.',
                    'url' => $redirectUrl ?? null,
                    'socialCheck' => true,
                    'public_platforms' => $visibility,
                ]);
            }

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

                // The published handles stay on the profile while the edit is reviewed,
                // so the creator's show/hide choice has to reach the LIVE row now — it
                // governs what is on the page today, not what the reviewer is deciding.
                self::persistVisibility($existing, $visibility);
            } else {
                // ✅ Update or create (DO NOT filter nulls)
                SocialLinks::updateOrCreate(
                    ['user_id' => $userId],
                    array_merge($data, [
                        'uuid' => $existing->uuid ?? Uuid::uuid4(),
                        'public_platforms' => $visibility,
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
                'public_platforms' => $visibility,
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

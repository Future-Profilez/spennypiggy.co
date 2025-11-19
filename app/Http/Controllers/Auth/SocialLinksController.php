<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\SendBioSocialUpdateEmail;
use App\Models\GifterCardVerification;
use App\Models\Membership;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserVerificationStatus;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;

class SocialLinksController extends Controller
{
    public function saveSocialLinks(Request $request)
    {
        $redirectUrl = $request->redirect_url;
        $userId = Auth::id();

        try {
            if (Helpers::checkBlockData($request) === 1) {
                return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute, dick, goddess, master, mistress, 😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
            }

            $data = [
                'whoyouinto' => $request->whoyouinto,
                'twitter'    => $request->twitter,
                'instagram'  => $request->instagram,
                'facebook'   => $request->facebook,
                'youtube'    => $request->youtube,
                'twitch'     => $request->twitch,
                'tumblr'     => $request->tumblr,
                'reddit'     => $request->reddit,
                'discord'    => $request->discord,
                'onlyfans'   => $request->onlyfans,
                'loyalfans'  => $request->loyalfans,
                'fansly'     => $request->fansly,
                'manyvids'   => $request->manyvids,
                'other'      => $request->other,
                'updated_at' => now(),
            ];

            $moderation = [
                'status' => 0,
                'reason' => $request->has('reason') ? $request->reason : null,
            ];
            $payload = array_filter(array_merge($data, $moderation), fn($v) => $v !== null);

            // Add UUID and created_at only if creating
            $socialLink = SocialLinks::updateOrCreate(
                ['user_id' => $userId],
                array_merge($payload, [
                    'uuid'       => Uuid::uuid4(),
                    'created_at' => now(),
                ])
            );


            // $socialCheck = SocialLinks::whereUserId($userId)
            //     ->where(function ($q) {
            //         $q->where('twitter', '!=', null)
            //             ->orWhere('instagram', '!=', null)
            //             ->orWhere('facebook', '!=', null)
            //             ->orWhere('twitch', '!=', null)
            //             ->orWhere('tumblr', '!=', null)
            //             ->orWhere('reddit', '!=', null);
            //     })
            //     ->exists();

            // Define only the social media platforms
            $socialPlatforms = ['twitter', 'instagram', 'facebook', 'twitch', 'tumblr', 'reddit'];

            // Check if any of them is coming in the request
            $socialCheck = false;
            foreach ($socialPlatforms as $platform) {
                if ($request->filled($platform)) {
                    $socialCheck = true;
                    break;
                }
            }


            $role = Auth::user()->role;

            if ($socialCheck) {
                UserVerificationStatus::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'role'    => $role,
                    ],
                    [
                        'role'                => $role,
                        'social_status'       => 0,
                        'user_profile_status' => 0,
                    ]
                );

                $updatedFields = [
                    'bio'    => false,
                    'social' => true,
                ];

                dispatch(new SendBioSocialUpdateEmail(Auth::user(), $updatedFields));
            }


            // $user = Auth::user();
            // $user->profile_status_lock = 1;
            // $user->save();

            return response([
                'status'  => 200,
                'message' => "Social links updated successfully.",
                'url'     => $redirectUrl ?? null,
                'socialCheck'     => $socialCheck,
            ]);
        } catch (\Throwable $th) {
            Log::error('Failed to save social links', ['error' => $th->getMessage()]);
            return response([
                'status'  => 500,
                'message' => 'An error occurred while saving social links.',
            ]);
        }
    }
}

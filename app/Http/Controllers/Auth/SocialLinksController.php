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

            // Add UUID and created_at only if creating
            $socialLink = SocialLinks::updateOrCreate(
                ['user_id' => $userId],
                array_merge($data, [
                    'uuid'       => Uuid::uuid4(),
                    'created_at' => now(),
                ])
            );


            $socialCheck = SocialLinks::whereUserId($userId)
                ->where(function ($q) {
                    $q->where('twitter', '!=', null)
                        ->orWhere('instagram', '!=', null)
                        ->orWhere('facebook', '!=', null)
                        ->orWhere('twitch', '!=', null)
                        ->orWhere('tumblr', '!=', null)
                        ->orWhere('reddit', '!=', null);
                })
                ->exists();

            $role = Auth::user()->role;

            if ($socialCheck) {
                UserVerificationStatus::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'role' => $role,
                    ],
                    [
                        'role' => $role,
                        'social_status' => $socialCheck ? 0 : null,
                    ]
                );

                $updatedFields = [
                    'bio' => false,
                    'social' => true,
                ];

                if ($updatedFields['bio'] || $updatedFields['social']) {
                    dispatch(new SendBioSocialUpdateEmail(Auth::user(), $updatedFields));
                }


            }


            return response([
                'status'  => 200,
                'message' => "Social links updated successfully.",
                'url'     => $redirectUrl ?? null,
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

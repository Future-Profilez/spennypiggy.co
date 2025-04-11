<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\SocialLinks;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;

class SocialLinksController extends Controller
{
    public function saveSocialLinks(Request $request)
    {
        // dd($request->all());
        $redirect_url =  $request->redirect_url;
        $user = User::where('id', Auth::id())->first();
        try {
            $checkdata = Helpers::checkBlockData($request);
            if ($checkdata == 1) {
                return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
                😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
            } else {
                $sociallinks = SocialLinks::where('user_id', Auth::id())->first();
                if (!empty($sociallinks)) {
                    $links = SocialLinks::where('user_id', Auth::id())->update([
                        'whoyouinto' => $request->whoyouinto ?? '',
                        'twitter' => $request->twitter ?? null,
                        'instagram' => $request->instagram ?? null,
                        'facebook' => $request->facebook ?? null,
                        'youtube' => $request->youtube ?? null,
                        'twitch' => $request->twitch ?? null,
                        'tumblr' => $request->tumblr ?? null,
                        'reddit' => $request->reddit ?? null,
                        'discord' => $request->discord ?? null,
                        'onlyfans' => $request->onlyfans ?? null,
                        'loyalfans' => $request->loyalfans ?? null,
                        'fansly' => $request->fansly ?? null,
                        'manyvids' => $request->manyvids ?? null,
                        'other' => $request->other ?? null,
                        'updated_at' => Carbon::now(),
                    ]);
                    // dd($links);

                    // if ($redirect_url) {

                    return response([
                        'status' => 200,
                        'message' => "Social links updated successfully.",
                        'url' => $redirect_url ?? null,
                    ]);
                    // return redirect(route("user.show", ["username" => $user->username]))->with('success', "Social links updated successfully.");
                    // } else {
                    //     return response([
                    //         'status' => 200,
                    //         'url' => $redirect_url,
                    //         'message' => "Social links updated successfully.",
                    //     ]);
                    // }
                } else {
                    $links =  SocialLinks::create([
                        'uuid' => Uuid::uuid4(),
                        'user_id' => Auth::id(),
                        'whoyouinto' => $request->whoyouinto ?? null,
                        'twitter' => $request->twitter ?? null,
                        'instagram' => $request->instagram ?? null,
                        'facebook' => $request->facebook ?? null,
                        'youtube' => $request->youtube ?? null,
                        'twitch' => $request->twitch ?? null,
                        'tumblr' => $request->tumblr ?? null,
                        'reddit' => $request->reddit ?? null,
                        'discord' => $request->discord ?? null,
                        'onlyfans' => $request->onlyfans ?? null,
                        'loyalfans' => $request->loyalfans ?? null,
                        'fansly' => $request->fansly ?? null,
                        'manyvids' => $request->manyvids ?? null,
                        'other' => $request->other ?? null,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                    // if ($redirect_url) {
                    return response([
                        'status' => 200,
                        'message' => "Social links updated successfully.",
                        'url' => $redirect_url ?? null,
                    ]);
                    // return redirect(route("user.show", ["username" => $user->username]))->with('success', "Social links updated successfully.");
                    // } else {
                    //     return response([
                    //         'status' => 200,
                    //         'url' => $redirect_url,
                    //         'message' => "Social links added successfully.",
                    //     ]);
                    // }
                }
            }
        } catch (\Throwable $th) {
            throw $th->getMessage();
        }
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialLinks;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class SocialLinksController extends Controller
{
    public function saveSocialLinks(Request $request)
    {
        try {
            $sociallinks = SocialLinks::where('user_id', Auth::id())->first();
            if (!empty($sociallinks)) {
                $links = SocialLinks::where('user_id', Auth::id())->update([
                    'whoyouinto' => $request->whoyouinto ?? '',
                    'twitter' => $request->twitter ?? $sociallinks->twitter,
                    'instagram' => $request->instagram ?? $sociallinks->instagram,
                    'reddit' => $request->reddit ?? $sociallinks->reddit,
                    'discord' => $request->discord ?? $sociallinks->discord,
                    'onlyfans' => $request->onlyfans ?? $sociallinks->onlyfans,
                    'loyalfans' => $request->loyalfans ?? $sociallinks->loyalfans,
                    'fansly' => $request->fansly ?? $sociallinks->fansly,
                    'manyvids' => $request->manyvids ?? $sociallinks->manyvids,
                    'other' => $request->other ?? $sociallinks->other,
                    'updated_at' => Carbon::now(),
                ]);
                return redirect(route("dashboard", ["sociallinks" => $links]))->with('success', "social links updated successfully.");
            } else {
                $links =  SocialLinks::create([
                    'uuid' => Uuid::uuid4(),
                    'user_id' => Auth::id(),
                    'whoyouinto' => $request->whoyouinto ?? '',
                    'twitter' => $request->twitter ?? '',
                    'instagram' => $request->instagram ?? '',
                    'reddit' => $request->reddit ?? '',
                    'discord' => $request->discord ?? '',
                    'onlyfans' => $request->onlyfans ?? '',
                    'loyalfans' => $request->loyalfans ?? '',
                    'fansly' => $request->fansly ?? '',
                    'manyvids' => $request->manyvids ?? '',
                    'other' => $request->other ?? '',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                return redirect(route("dashboard", ["sociallinks" => $links]))->with('success', "social links added successfully.");
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }
}

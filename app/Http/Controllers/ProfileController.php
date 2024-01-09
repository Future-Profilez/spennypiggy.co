<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use App\Models\UserIntro;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
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

        $user = User::where('id', Auth::id())->where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->first();
        $currency = strtolower($request->cookie("currency", "GBP"));

        if($request->min_surprise_amount < 5){
            return redirect()->back()->with("error", "Please set the minimum amount greater than 5.");
        }

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. Paypig, Findom, Worship, Unlock, Unblock, Receive,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {
            $request->validate([
                'name' => ['string', 'max:255'],
                'username' => ['string', 'lowercase', 'max:20', Rule::unique('users')->ignore($user->id)],
                'bio' => ['sometimes', 'max:255'],
                'tags' => ['sometimes', 'max:255'],
            ]);
            $user->name = $request->name;
            $user->username = $request->username;
            $user->bio = $request->bio;
            $user->min_surprise_amount = $request->min_surprise_amount ?? 0;
            $user->avatar = $request->avatar;
            $user->cover = $request->cover;

            $user->save();
            $user->refresh();

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
        $user = User::where('id',Auth::id())->first();
        if($user->notification_send == 0){
            $user->notification_send == 1;
            $status = 'Enabled';
        }
        else{
            $user->notification_send == 0;
            $status = 'Disabled';
        }

        $user->save();

        return response()->json([
            'status' => true,
            'msg' => "Notifications for email are $status."
        ]);
    }


    public function checkAdultContent($uuid){
        $rest_words = ['Adult', '18+', 'Pornographic', 'xxx', 'nsfw','NSFW','XXX', 'Blood', 'Brutality', 'Explicit', 'Mature', 'Weapons', 'Aggression', 'Combat', 'Sexual', 'Porn', 'Fucking','Graphic'];


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
        ])->get("https://api.uploadcare.com/files/". $uuid ."/?include=appdata");

        $data = $response->json();
        $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];

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
    public function saveIntroVideo(Request $request){
        $request->vailidate([
            'media' => [
                'required',
            ]
        ]);

        $media = $request->media;

        $intro = UserIntro::create([
            'uuid' => $media['uuid'],
            'user_id' => Auth::id(),
            'height' => $media['contentInfo']['videoInfo']['video']['height'],
            'width' => $media['contentInfo']['videoInfo']['video']['width'],
        ]);
        $intro->refresh();

        $intro->poster_url;

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
    public function getIntroVideo(){
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
    public function getIntroById($uuid){
        $intro = UserIntro::whereUuid($uuid)->first();

        return response()->json([
            'status' => true,
            'intro' => $intro
        ]);
    }
}

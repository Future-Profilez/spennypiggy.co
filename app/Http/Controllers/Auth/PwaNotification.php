<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Models\BulkPwaNotification;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PwaNotification extends Controller
{
    /**
     * send pwa notifications to all followers
     */
    public function sendPwaToFollower(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        $user = Auth::user();
        $title = $request->title;
        $body = $request->body;

        if ($user->role != 1) {
            return response()->json([
                'status' => false,
                'msg' => 'Only creators can send push notifications.',
            ]);
        }

        // Get follower IDs who are not from UK
        $followerIds = Follow::where('followed_id', $user->id)
            ->pluck('follower_id');

        $users = User::whereIn('id', $followerIds)
            ->get();

        if ($users->isEmpty()) {
            return response()->json([
                'status' => false,
                'msg' => 'No users have followed you yet.',
            ]);
        }

        // Limit check: max 2 notifications per day
        $today = now()->startOfDay();

        $notificationCountToday = BulkPwaNotification::where('creator_id', $user->id)
            ->where('created_at', '>=', $today)
            ->count();

        if ($notificationCountToday >= 2) {
            return response()->json([
                'status' => false,
                'msg' => 'You cannot send more than 2 push notifications per day.',
            ]);
        }

        try {
            $count = 0;
            $userIds = [];
            foreach ($users as $usersData) {
                $count++;
                $userIds[] = $usersData->id;
                Helpers::sendNotification($title, $body, $usersData->email);
            }

            BulkPwaNotification::create([
                'title' => $title,
                'body' => $body,
                'creator_id' => $user->id,
                'users_count' => $count,
                'user_ids' => $userIds,
            ]);

            return response()->json([
                'status' => true,
                'msg' => 'Push notifications sent successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Push notification error: ' . $e->getMessage());

            return response()->json([
                'status' => false,
                'msg' => 'Failed to send push notifications. Please try again later.',
            ]);
        }
    }

    /**
     * user follow and unfollow with this method
     */
    public function userFollowUnFollow(Request $request)
    {
        $followed_id = $request->user_id;
        $LoggedInUser = Auth::user();
        if ($LoggedInUser->id == $followed_id) {
            return redirect()->back()->with('error', 'You cannot follow yourself.');
        }
        $userFollow = Follow::where('follower_id', Auth::id())->where('followed_id', $followed_id)->first();
        $followedUser = User::select('id', 'name', 'username', 'email')->where('id', $followed_id)->first();
        $userName = ucfirst($followedUser->name);
        // dd($userFollow, $LoggedInUser, $followedUser, $userName);
        if ($userFollow === null) {
            // User is not following, so we will follow
            Follow::create([
                'follower_id' => Auth::id(),
                'followed_id' => $followed_id,
            ]);

            $title = "👥 New Follower!";
            $content = ucfirst($LoggedInUser->name) . "($LoggedInUser->username)" . " just followed you. Just Check their profile!";
            $email = $followedUser->email; // user being followed

            Helpers::sendNotification($title, $content, $email);

            $status = 'followed';
        } else {
            // User is already following, so we will unfollow
            $userFollow->delete();
            $status = 'unfollowed';
        }

        // Get the updated follow count
        return redirect()->back()->with('success', "You have $status $userName.");
        // return response()->json([
        //     'status' => true,
        //     'msg' => "You have $status $userName.",
        //     'status' => $status,
        //     'username' => $followedUser->username,
        // ]);
    }

    /**
     * call this method to autoFollowed spenny piggy account by all users
     */
    public function sendAutomaticallyFollowRequestToAll()
    {
        // Get the ID of the target user to be followed
        $followedId = User::where('email', 'spennypiggyofficial@gmail.com')->value('id');

        if (!$followedId) {
            return response()->json(['status' => false, 'message' => 'Target user not found.']);
        }

        $users = User::where('id', '!=', $followedId)->get();

        foreach ($users as $user) {
            try {
                Follow::updateOrCreate(
                    ['follower_id' => $user->id, 'followed_id' => $followedId],
                    ['follower_id' => $user->id, 'followed_id' => $followedId]
                );
            } catch (\Exception $e) {
                // Log error but continue processing
                Log::error("Failed to follow for user ID {$user->id}: " . $e->getMessage());
            }
        }

        return response()->json(['status' => true, 'message' => 'Follow requests sent successfully.']);
    }
}

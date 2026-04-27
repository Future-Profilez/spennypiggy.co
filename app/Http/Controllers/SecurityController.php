<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Jenssegers\Agent\Agent;
use Carbon\Carbon;

class SecurityController extends Controller
{
    /**
     * Get active sessions for the current user.
     */
    public function getSessions()
    {
        // Note: This requires SESSION_DRIVER=database to work effectively
        $sessions = DB::table('sessions')
            ->where('user_id', Auth::id())
            ->orderBy('last_activity', 'desc')
            ->get();

        $filteredSessions = $sessions->filter(function ($session) {
            try {
                // Laravel's database session payload is base64 encoded and serialized
                $payload = unserialize(base64_decode($session->payload));
                
                // Hide sessions emulated by admin to avoid user confusion/alarm
                if (isset($payload['emulated_by_admin']) && $payload['emulated_by_admin'] === true) {
                    return false;
                }
            } catch (\Exception $e) {
                // If decoding fails, keep the session in the list for security safety
            }
            return true;
        });

        return response()->json([
            'status' => true,
            'sessions' => $filteredSessions->values()->map(function ($session) {
                $agent = new Agent();
                $agent->setUserAgent($session->user_agent);

                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'is_current_device' => $session->id === Session::getId(),
                    'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
                    'device' => [
                        'browser' => $agent->browser(),
                        'platform' => $agent->platform(),
                        'is_desktop' => $agent->isDesktop(),
                        'is_mobile' => $agent->isMobile(),
                    ],
                ];
            }),
        ]);
    }

    /**
     * Revoke a specific session.
     */
    public function revokeSession(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
        ]);

        DB::table('sessions')
            ->where('id', $request->session_id)
            ->where('user_id', Auth::id())
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Session revoked successfully.',
        ]);
    }

    /**
     * List blocked users for the creator.
     */
    public function getBlockedUsers()
    {
        $blockedUsers = UserBlock::where('creator_id', Auth::id())
            ->with('blockedUser:id,name,username,avatar,avatar_cdn_modifier')
            ->get();

        return response()->json([
            'status' => true,
            'blocked_users' => $blockedUsers->map(function($block) {
                return [
                    'id' => $block->blockedUser->id,
                    'name' => $block->blockedUser->name,
                    'username' => $block->blockedUser->username,
                    'avatar_url' => $block->blockedUser->avatar_url,
                    'blocked_at' => $block->created_at->diffForHumans(),
                    'reason' => $block->reason,
                ];
            }),
        ]);
    }

    /**
     * Block a user.
     */
    public function blockUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($request->user_id == Auth::id()) {
            return response()->json(['status' => false, 'message' => 'You cannot block yourself.'], 422);
        }

        UserBlock::updateOrCreate([
            'creator_id' => Auth::id(),
            'blocked_id' => $request->user_id,
        ], [
            'reason' => $request->reason,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'User blocked successfully.',
        ]);
    }

    /**
     * Unblock a user.
     */
    public function unblockUser($userId)
    {
        UserBlock::where('creator_id', Auth::id())
            ->where('blocked_id', $userId)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'User unblocked successfully.',
        ]);
    }

    /**
     * Search for users to block.
     */
    public function searchUsers(Request $request)
    {
        $query = $request->query('query');
        if (strlen($query) < 2) {
            return response()->json(['status' => true, 'users' => []]);
        }

        $users = User::where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('username', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->where('id', '!=', Auth::id())
            ->limit(10)
            ->get(['id', 'name', 'username', 'avatar', 'avatar_cdn_modifier']);

        return response()->json([
            'status' => true,
            'users' => $users->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar_url' => $user->avatar_url,
                ];
            }),
        ]);
    }
}

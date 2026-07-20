<?php

namespace App\Http\Controllers;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\TipGoal;
use App\Models\WishItem;
use App\Services\UserProfileService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

/**
 * DEV HELPER — refresh the logged-in creator's content dates to "now".
 *
 * Bumps created_at/updated_at on every content item the activity /
 * posting-cadence gates read (posts, wishes, shops, tasks, piggy pots, bills,
 * memberships, tip goals), clears the content-posting pause flag, and busts
 * profile caches — so a stale test account passes the gates again.
 *
 * Invokable controller (not a closure) so the route survives route:cache on
 * Vapor. Testing/scratch only: GET /dev/refresh-my-dates (auth required).
 */
class DevRefreshDatesController extends Controller
{
    public function __invoke()
    {
        // Defence in depth: the route is already excluded from production in
        // routes/web.php. This helper clears content_posting_paused_at and
        // back-dates content, which would let a creator self-bypass the
        // posting-cadence pause and the creator-activity payment gate.
        if (app()->environment('production')) {
            abort(404);
        }

        $user = Auth::user();
        if (! $user) {
            return response()->json(['status' => false, 'message' => 'Log in first.'], 401);
        }

        $now = now();
        $bumped = [];

        // label => [Model, owner column]
        $targets = [
            'posts' => [Post::class, 'user_id'],
            'wishes' => [WishItem::class, 'user_id'],
            'shops' => [Shop::class, 'user_id'],
            'tasks' => [Task::class, 'creator_id'],
            'piggy_pots' => [PiggyPot::class, 'user_id'],
            'bills' => [Bills::class, 'user_id'],
            'memberships' => [Membership::class, 'user_id'],
            'tip_goals' => [TipGoal::class, 'user_id'],
        ];

        foreach ($targets as $label => [$model, $col]) {
            try {
                $bumped[$label] = $model::where($col, $user->id)
                    ->update(['created_at' => $now, 'updated_at' => $now]);
            } catch (\Throwable $e) {
                $bumped[$label] = 'skip: '.$e->getMessage();
            }
        }

        // Clear the posting-cadence pause so subscriptions resume.
        if (Schema::hasColumn('users', 'content_posting_paused_at')) {
            $user->forceFill(['content_posting_paused_at' => null])->save();
        }

        // Bust profile caches so the gates re-read fresh.
        try {
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);
        } catch (\Throwable $e) {
            // non-fatal
        }

        return response()->json([
            'status' => true,
            'user' => $user->username,
            'bumped' => $bumped,
            'paused' => $user->content_posting_paused_at,
            'message' => 'All your content items are now dated today. Refresh the page.',
        ]);
    }
}

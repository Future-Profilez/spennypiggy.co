<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostMention;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Support\Facades\DB;

/**
 * Resolves `@username` in a post's text into real creator accounts.
 *
 * Mentions are stored as rows rather than re-parsed on read, because the row is
 * what makes "notify each mentioned creator exactly once" possible across an
 * edit, and what lets the renderer link only handles that actually resolved.
 */
class PostMentionService
{
    /** A post may notify at most this many creators — mass-tagging is spam. */
    public const MAX_PER_POST = 5;

    /** Usernames only; the trailing boundary keeps an email address from matching. */
    private const PATTERN = '/(?<![\w@])@([a-zA-Z0-9_\.]{2,50})/';

    /**
     * Extract candidate usernames from a post's text, in order, deduped.
     *
     * @return string[]
     */
    public static function parse(?string ...$texts): array
    {
        $found = [];

        foreach ($texts as $text) {
            if (empty($text)) {
                continue;
            }

            preg_match_all(self::PATTERN, $text, $matches);
            foreach ($matches[1] ?? [] as $username) {
                $key = mb_strtolower(rtrim($username, '.'));
                if ($key !== '' && ! in_array($key, $found, true)) {
                    $found[] = $key;
                }
            }
        }

        return $found;
    }

    /**
     * Resolve the usernames a post mentions to creator accounts that may be told
     * about it, then store them.
     *
     * Skipped: the author themselves, non-creators, suspended accounts, and
     * anyone on either side of a block with the author. Capped at MAX_PER_POST —
     * the extra handles stay as plain text and nobody is notified.
     *
     * @return int Number of mentions now attached to the post.
     */
    public function sync(Post $post): int
    {
        $usernames = self::parse($post->content, $post->title);

        $users = collect();
        if (! empty($usernames)) {
            $users = User::query()
                ->whereIn(DB::raw('LOWER(username)'), $usernames)
                ->where('role', 1)
                ->where('suspended_account', 0)
                ->where('id', '!=', $post->user_id)
                ->select('id', 'username')
                ->get()
                // Keep the order the creator typed them in, so the cap cuts the
                // tail rather than an arbitrary set.
                ->sortBy(fn ($u) => array_search(mb_strtolower($u->username), $usernames, true))
                ->values();

            if ($users->isNotEmpty()) {
                $ids = $users->pluck('id');

                $blocked = UserBlock::query()
                    ->where(function ($q) use ($post, $ids) {
                        $q->where('creator_id', $post->user_id)->whereIn('blocked_id', $ids);
                    })
                    ->orWhere(function ($q) use ($post, $ids) {
                        $q->whereIn('creator_id', $ids)->where('blocked_id', $post->user_id);
                    })
                    ->get()
                    ->flatMap(fn ($row) => [$row->creator_id, $row->blocked_id])
                    ->unique()
                    ->all();

                $users = $users->reject(fn ($u) => in_array($u->id, $blocked, true))->values();
            }

            $users = $users->take(self::MAX_PER_POST);
        }

        $keepIds = $users->pluck('id')->all();

        // A handle removed by an edit is dropped — but only while it is still
        // unnotified. Deleting a notified row would let the same creator be
        // notified twice by re-adding the handle.
        PostMention::where('post_id', $post->id)
            ->whereNull('notified_at')
            ->when($keepIds, fn ($q) => $q->whereNotIn('user_id', $keepIds))
            ->delete();

        foreach ($keepIds as $userId) {
            PostMention::firstOrCreate(['post_id' => $post->id, 'user_id' => $userId]);
        }

        return count($keepIds);
    }
}

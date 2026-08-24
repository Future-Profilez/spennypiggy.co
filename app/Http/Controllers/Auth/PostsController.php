<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\NotificationSave;
use App\Models\Logs;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostCommentReplies;
use App\Models\PostLike;
use App\Models\PostSlugHistory;
use App\Models\User;
use App\SeoMeta;
use App\Services\CreatorActivityService;
use App\Services\ModerationService;
use App\Services\PostMentionService;
use App\Services\UserProfileService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PostsController extends Controller
{
    /**
     * Audiences a creator may publish to. `support_thanks` posts are written by the
     * platform, never by this endpoint.
     */
    private const ALLOWED_MODULES = ['public', 'membership', 'subscription', 'support'];

    /** Post kinds a creator may submit. */
    private const ALLOWED_TYPES = ['image', 'video', 'blog', 'media'];

    /**
     * Validation rules shared by savePost/editPost.
     */
    /**
     * How far ahead a post may be scheduled. Long enough for a real content
     * calendar, short enough that a post cannot be queued against a profile,
     * a price or a membership tier that no longer exists when it fires.
     */
    private const MAX_SCHEDULE_DAYS = 90;

    /** How many posts one creator may have waiting to publish at once. */
    private const MAX_QUEUED_POSTS = 20;

    /**
     * One entry per uploaded file, whatever the client sent.
     *
     * ⚠️ The uploader hands its whole collection back and can re-fire for a file
     * that was already added, so a payload could legitimately arrive carrying the
     * same uuid twice — and the post then rendered ONE upload as two thumbnails
     * everywhere it appeared. It is a single stored Uploadcare file either way
     * (one uuid = one file), so the duplicate costs nothing in storage; it is the
     * post's own record of what it contains that must not lie. Guarded in the
     * composer too — this is the write path, so it guards itself rather than
     * trusting what it is handed.
     */
    private function dedupeMedia($media)
    {
        if (! is_array($media) || $media === []) {
            return $media ?: null;
        }

        $seen = [];
        $unique = [];

        foreach ($media as $item) {
            $item = $this->storableMediaEntry($item);

            $id = is_array($item) ? ($item['uuid'] ?? $item['url'] ?? null) : null;

            // An entry with no identifier of its own cannot be compared, so it is
            // kept rather than guessed at — dropping a file the creator uploaded
            // is far worse than keeping a duplicate.
            if (! is_string($id) || $id === '') {
                $unique[] = $item;

                continue;
            }

            if (isset($seen[$id])) {
                continue;
            }

            $seen[$id] = true;
            $unique[] = $item;
        }

        return $unique ?: null;
    }

    /**
     * 🚨 THE COLUMN STORES WHAT THE UPLOADER PRODUCED — NOTHING THE SERVER ADDED.
     *
     * The composer round-trips: `mediaFromItem()` in `AddPost.jsx` opens an edit
     * with the post's OWN stored array and submits it back verbatim, so every key
     * this method keeps is persisted again on the next edit, for ever. That is
     * the `piggy_pots.cover_media` trap — a value the server derived at render
     * time gets saved back as the source, and a derived value with an EXPIRY in
     * it (a signed paid-content URL, a time-limited token) then rots into a
     * permanently broken link that nothing can distinguish from a real one.
     *
     * So the write path whitelists. A read-time accessor may append whatever it
     * needs to each entry — a signed URL for a members-only post, a watermark
     * chain — and this drops it again on the way back in, which is what makes
     * adding one safe. Keys are the uploader's own shape, verified against live
     * rows.
     *
     * ⚠️ An entry that is not an array is returned untouched: it cannot be
     * filtered meaningfully, and dropping a file the creator uploaded is far
     * worse than storing a key we did not expect.
     */
    private function storableMediaEntry($item)
    {
        if (! is_array($item)) {
            return $item;
        }

        return array_intersect_key($item, array_flip([
            'uuid',
            'url',
            'name',
            'size',
            'mimeType',
            'mimeSubtype',
            'isImage',
            'isVideo',
            'isAudio',
        ]));
    }

    private function postRules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(self::ALLOWED_TYPES)],
            'for_module' => ['required', 'string', Rule::in(self::ALLOWED_MODULES)],
            'image' => ['required_without:media', 'nullable', 'string', 'max:500'],
            'media' => ['sometimes', 'nullable', 'array'],
            // ⚠️ Required. It was nullable, and an untitled post fell back to the
            // literal slug `post` — the second one ever written collided on the unique
            // index and the creator's post button 500'd. The title is also what the
            // post's own URL, the feed card and every share preview are built from.
            'title' => ['required', 'string', 'max:150'],
            'content' => ['nullable', 'string', 'max:5000'],
            'ai_generated' => ['sometimes', 'boolean'],
            // A publish time. Absent or null = publish as soon as it is approved,
            // which is every post that existed before scheduling shipped.
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
        ];
    }

    /**
     * Resolve the requested publish time, or an error string to hand back.
     *
     * ⚠️ The clock is the SERVER's. The picker sends a local wall-clock time and
     * the browser's timezone; trusting a raw string would publish a post at 9am
     * in whichever timezone the server happens to run in, which is nobody's 9am.
     *
     * @return array{0: ?Carbon, 1: ?string} [publish time or null, error or null]
     */
    private function resolveScheduledAt(Request $request, ?Post $ignore = null): array
    {
        if (! $request->filled('scheduled_at')) {
            return [null, null];
        }

        try {
            $when = Carbon::parse($request->input('scheduled_at'));
        } catch (\Throwable $e) {
            return [null, 'That publish time could not be read. Pick a date and time again.'];
        }

        // A minute of slack: the creator picked a time, then spent a moment
        // uploading, and refusing them for that is nonsense.
        if ($when->lt(now()->subMinute())) {
            return [null, 'Pick a publish time in the future.'];
        }

        if ($when->gt(now()->addDays(self::MAX_SCHEDULE_DAYS))) {
            return [null, 'You can schedule up to '.self::MAX_SCHEDULE_DAYS.' days ahead.'];
        }

        // Already due — treat as "publish now" rather than queueing something the
        // sweep would release seconds later.
        if ($when->lte(now())) {
            return [null, null];
        }

        $queued = Post::onlyScheduled()
            ->where('user_id', Auth::id())
            ->when($ignore, fn ($q) => $q->where('id', '!=', $ignore->id))
            ->count();

        if ($queued >= self::MAX_QUEUED_POSTS) {
            return [null, 'You already have '.self::MAX_QUEUED_POSTS.' posts waiting to publish. Publish or remove one first.'];
        }

        return [$when, null];
    }

    /**
     * Feed posts belong to creators (role 1). Fans/gifters (role 0) have no audience,
     * so publishing to `membership`/`subscription`/`support` is meaningless for them —
     * the route was gated only by `auth`, so a non-creator could POST a post directly.
     */
    private function ensureCreator(): ?JsonResponse
    {
        if ((int) (Auth::user()->role ?? 0) !== 1) {
            return response()->json([
                'status' => false,
                'msg' => 'Only creator accounts can publish posts.',
            ], 403);
        }

        return null;
    }

    public function savePost(Request $request)
    {
        if ($block = $this->ensureCreator()) {
            return $block;
        }

        $request->validate($this->postRules(), [
            'image.required_without' => 'Add an image or video for this post.',
            'title.required' => 'Give your post a title.',
        ]);

        // NOTE: this endpoint is called with axios and the caller reads resp.data.status.
        // These two guards used to return redirect()->back(), so the real reason was
        // swallowed and the creator saw a generic failure with no idea what to change.
        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return response()->json([
                'status' => false,
                'msg' => "The word or emoji '{$blockedWord}' is not allowed as per our policies.",
            ], 422);
        }

        // Stripe compliance: PG-13 / adult-content moderation seam (media classifier wired later).
        $moderation = app(ModerationService::class)
            ->classify(trim(($request->title ?? '').' '.($request->content ?? '')), $request->image ?? null);
        if ($moderation['flagged']) {
            return response()->json([
                'status' => false,
                'msg' => $moderation['reason'] ?? 'This content did not pass moderation.',
            ], 422);
        }

        [$scheduledAt, $scheduleError] = $this->resolveScheduledAt($request);
        if ($scheduleError) {
            return response()->json(['status' => false, 'msg' => $scheduleError], 422);
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'type' => $request->type,
            'for_module' => $request->for_module,
            'title' => $request->title ?: null,
            'content' => $request->content ?: null,
            'image' => $request->image ?: null,
            'media' => $this->dedupeMedia($request->media),
            'ai_generated' => $request->boolean('ai_generated'),
            'scheduled_at' => $scheduledAt,
        ]);

        // ⚠️ `created_at` IS the publish time for a scheduled post, set here
        // rather than mutated later. Every feed, sitemap and cadence window on
        // this platform orders and filters posts by `created_at`, so a post that
        // kept its drafting date would go live already buried down its own
        // creator's feed and would count toward the posting window from a day it
        // was not visible on.
        if ($scheduledAt) {
            $post->forceFill(['created_at' => $scheduledAt])->saveQuietly();
        }

        // Resolve @handles into real creators. Nobody is told yet — mentions are
        // notified once the post is approved (see mentions:notify).
        app(PostMentionService::class)->sync($post);

        // Clear activity cache to ensure real-time updates
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());

        // Clear user caches
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'uuid' => $post->uuid,
            'scheduled_at' => $post->scheduled_at?->toIso8601String(),
            'msg' => $scheduledAt
                ? 'Scheduled for '.$scheduledAt->format('j M \a\t g:ia').'. It publishes then, once it has been checked.'
                : 'Post saved. It will appear to your audience once approved.',
        ]);
    }

    public function editPost(Request $request, $uuid)
    {
        if ($block = $this->ensureCreator()) {
            return $block;
        }

        $request->validate($this->postRules(), [
            'image.required_without' => 'Add an image or video for this post.',
            'title.required' => 'Give your post a title.',
        ]);

        // ⚠️ withScheduled(): the global scope hides a post whose publish time has
        // not arrived, so without this a creator could not edit, reschedule or
        // cancel the post they had just scheduled — it would answer "not found".
        $post = Post::withScheduled()->where('uuid', $uuid)->first();

        if (empty($post)) {
            return response()->json(['status' => false, 'msg' => 'Post not found.'], 404);
        }

        // Ownership check — only the post's author can edit it (IDOR).
        if ((int) $post->user_id !== (int) Auth::id()) {
            return response()->json(['status' => false, 'msg' => 'Unauthorized.'], 403);
        }

        // Platform-written posts (support thank-yous) are not creator-editable.
        if ($post->type === 'support_thanks') {
            return response()->json([
                'status' => false,
                'msg' => 'Automatic thank-you posts cannot be edited.',
            ], 422);
        }

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return response()->json([
                'status' => false,
                'msg' => "The word or emoji '{$blockedWord}' is not allowed as per our policies.",
            ], 422);
        }

        // Edits go back through moderation exactly like a new post does — without this an
        // approved post could be edited into anything and stay live until re-review.
        $moderation = app(ModerationService::class)
            ->classify(trim(($request->title ?? '').' '.($request->content ?? '')), $request->image ?? null);
        if ($moderation['flagged']) {
            return response()->json([
                'status' => false,
                'msg' => $moderation['reason'] ?? 'This content did not pass moderation.',
            ], 422);
        }

        $previousTitle = (string) $post->title;
        $previousSlug = (string) $post->slug;

        $post->type = $request->type;
        $post->for_module = $request->for_module;
        $post->title = $request->title ?: null;
        $post->content = $request->content ?: null;
        $post->image = $request->image ?: null;
        $post->media = $this->dedupeMedia($request->media);
        $post->ai_generated = $request->boolean('ai_generated');
        $post->approved = 0;

        // Rescheduling, and cancelling a schedule.
        //
        // ⚠️ Only touched when the field is actually present in the request. An
        // edit form that does not carry a schedule picker must not silently
        // publish a queued post by omitting it — several callers post a partial
        // payload, and "absent" is not "the creator cleared it".
        if ($request->has('scheduled_at')) {
            [$scheduledAt, $scheduleError] = $this->resolveScheduledAt($request, $post);
            if ($scheduleError) {
                return response()->json(['status' => false, 'msg' => $scheduleError], 422);
            }

            $post->scheduled_at = $scheduledAt;

            // created_at follows the publish time in both directions: rescheduled
            // later it moves out, cancelled it comes back to now, so the post
            // never lands in the feed dated to a moment it was not visible.
            $post->created_at = $scheduledAt ?: now();

            // A post that has already been released cannot be re-queued — the
            // release claim would still be set and the sweep would skip it, so it
            // would sit hidden forever.
            if ($scheduledAt && $post->schedule_released_at) {
                $post->schedule_released_at = null;
            }
        }

        // A retitled post gets a URL that matches its new title. The old slug is
        // kept in post_slug_history so every link already shared — and everything
        // already indexed — redirects instead of 404ing.
        if (trim((string) $post->title) !== trim($previousTitle)) {
            $newSlug = Post::generateUniqueSlug($post->title ?: 'post', $post->id, $post->user_id);

            if ($newSlug !== $previousSlug) {
                $post->slug = $newSlug;

                PostSlugHistory::firstOrCreate(['slug' => $previousSlug], ['post_id' => $post->id]);
                // The new slug may itself be a retired one from an earlier edit;
                // leaving that row would redirect the live URL to itself.
                PostSlugHistory::where('slug', $newSlug)->delete();
            }
        }

        $post->save();

        $logs = Logs::where('edited_post_id', $post->id)->where('status', 'pending')->first();
        if (! empty($logs)) {
            $logs->status = 'updated';
            $logs->save();
        }

        // Re-resolve mentions: handles the creator removed drop out (while still
        // unnotified), new ones are added and notified on the next approval.
        app(PostMentionService::class)->sync($post);

        // An edit changes the approved-content count the payment gate reads, so the same
        // caches savePost clears must be cleared here too.
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());

        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'Post updated. It will be re-checked before going live again.',
            // The caller is often standing on the post's own page — it needs the
            // new address to swap into the URL bar.
            'slug' => $post->slug,
            'url' => rtrim(config('app.url'), '/').'/'.$user->username.'/post/'.$post->slug,
        ]);
    }

    public function deletePost($uuid)
    {
        // withScheduled(): a queued post must be cancellable. Without it the
        // creator's only route out of a scheduled post would be to wait for it
        // to publish and then delete it.
        $post = Post::withScheduled()->where('uuid', $uuid)->first();

        if (empty($post)) {
            return response()->json(['status' => false, 'msg' => 'Data not found.'], 404);
        }

        // Ownership is checked FIRST — the thank-you-post branch below leaks the post's
        // type and age to anyone who guesses a uuid if it runs before this.
        if ((int) $post->user_id !== (int) Auth::id()) {
            return response()->json([
                'status' => false,
                'msg' => "You don't have permission to delete this post.",
            ], 403);
        }

        // Check if this is a support_thanks post with deletion protection
        if ($post->type === 'support_thanks') {
            // Use can_delete_until if set, otherwise calculate from created_at
            $canDeleteUntil = $post->can_delete_until ?
                Carbon::parse($post->can_delete_until) :
                $post->created_at->addMonth();

            if (now()->lt($canDeleteUntil)) {
                $daysLeft = max(1, (int) ceil(now()->floatDiffInDays($canDeleteUntil)));

                return response()->json([
                    'status' => false,
                    'msg' => "Creator support thank you posts cannot be deleted for 1 month after creation. You can delete this post in {$daysLeft} day(s).",
                ], 422);
            }
        }

        $comments = PostComment::where('post_id', $post->id)->get();
        foreach ($comments as $comment) {
            PostCommentReplies::where('post_comment_id', $comment->id)->delete();
        }
        PostComment::where('post_id', $post->id)->delete();
        PostLike::where('post_id', $post->id)->delete();

        $post->delete();

        // Deleting a post lowers the approved-content count the payment gate reads.
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());

        // Clear user caches
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'Post deleted successfully.',
        ]);
    }

    public function postLike($uuid)
    {
        $post = Post::where('uuid', $uuid)->first();

        if (empty($post)) {
            return response()->json(['status' => false, 'msg' => 'Post not found.'], 404);
        }

        $user = Auth::user();

        $like = PostLike::where('user_id', $user->id)->where('post_id', $post->id)->first();

        if ($like) {
            $wasLiked = (int) $like->status === 1;
            $like->status = $wasLiked ? 0 : 1;
            $like->save();
            $isLiked = ! $wasLiked;
            // A like that has already been announced once must not re-notify on every
            // unlike/relike — that turned a toggling supporter into an email flood.
            $shouldNotify = false;
        } else {
            PostLike::create([
                'user_id' => $user->id,
                'post_id' => $post->id,
                'status' => 1,
            ]);
            $isLiked = true;
            $shouldNotify = true;
        }

        // Never notify a creator about their own like, and never send to a missing author.
        if ($shouldNotify && $post->user && (int) $post->user_id !== (int) $user->id) {
            $label = $this->postLabel($post);
            $name = ucfirst($user->name);

            NotificationSave::dispatch("{$user->name} liked your post {$label}", $post->user, $user, 'Post Like');
            Helpers::sendNotification('❤️ New Like on Your Post!', "$name liked one of your posts ({$label}).", $post->user->email);
        }

        return response()->json([
            'status' => true,
            'liked' => $isLiked,
            'likes_count' => $post->likes()->where('status', 1)->count(),
            'msg' => $isLiked ? 'Post liked successfully.' : 'Post unliked successfully.',
        ]);
    }

    /**
     * Human label for a post in a notification. Posts are not required to have a title
     * (an image-only post has none), and the old copy read "liked your post " with a
     * trailing blank.
     */
    private function postLabel(Post $post): string
    {
        $title = trim((string) $post->title);
        if ($title !== '') {
            return $title;
        }

        $content = trim((string) $post->content);
        if ($content !== '') {
            return Str::limit($content, 40);
        }

        return 'your latest post';
    }

    public function commentOnPost(Request $request, $uuid)
    {
        $request->validate([
            'comment' => [
                'required',
                'string',
            ],
        ]);

        $post = Post::where('uuid', $uuid)->first();
        $user = User::where('id', Auth::id())->first();

        if (! empty($post)) {

            $blockedMessage = Helpers::validateSupporterMessage(
                $request->comment
            );

            if ($blockedMessage) {
                return response()->json([
                    'status' => false,
                    'msg' => $blockedMessage,
                ], 422);
            }

            // Check if the comment is by the post owner
            $isPostOwner = ($post->user_id === $user->id);

            // Auto-approve owner comments immediately; other comments start pending creator review.
            // Status values: 0 = waiting creator approval, 1 = visible/approved, 2 = approved by creator and waiting admin review.
            $isApproved = $isPostOwner ? 1 : 0;

            $comment = $post->comments()->create([
                'user_id' => $user->id,
                'comment' => $request->comment,
                'is_approved' => $isApproved,
            ]);

            // Only send notification if comment is NOT from the post owner
            if (! $isPostOwner) {
                $message = $user->name.' commented on your post '.$this->postLabel($post);
                NotificationSave::dispatch($message, $post->user, $user, 'Post Comment');

                $name = ucfirst($user->name);
                $title = '💬 New Comment Needing Approval!';
                $label = $this->postLabel($post);
                $content = "$name commented on your post ({$label}). Please review and approve it.";
                $email = $post->user->email;

                Helpers::sendNotification($title, $content, $email);
            }

            return response()->json([
                'status' => true,
                'msg' => $isPostOwner ? 'Comment added successfully.' : 'Comment added and pending approval.',
                'is_approved' => $isApproved,
            ]);
        }

        return response()->json([
            'status' => false,
            'msg' => 'Post not found.',
        ]);
    }

    public function replyOnComment(Request $request, $comment_uid)
    {
        $request->validate([
            'reply' => [
                'required',
                'string',
            ],
        ]);

        $comment = PostComment::where('uuid', $comment_uid)->first();
        $user = User::where('id', Auth::id())->first();

        if (! empty($comment)) {

            $blockedMessage = Helpers::validateSupporterMessage(
                $request->reply
            );

            if ($blockedMessage) {
                return response()->json([
                    'status' => false,
                    'msg' => $blockedMessage,
                ], 422);
            }

            // Check if the reply is by the post owner
            $isPostOwner = ($comment->post->user_id === $user->id);

            // Auto-approve owner replies immediately; other replies start pending creator review.
            $isApproved = $isPostOwner ? 1 : 0;

            $reply = $comment->replies()->create([
                'user_id' => $user->id,
                'reply' => $request->reply,
                'is_approved' => $isApproved,
            ]);

            // Notify post owner if reply is from someone else (needs approval).
            if (! $isPostOwner) {
                $name = ucfirst($user->name);
                $title = '💬 New Reply Needing Approval!';
                $label = $this->postLabel($comment->post);
                $content = "$name replied to a comment on your post ({$label}). Please review and approve it.";
                $email = $comment->post->user->email;
                Helpers::sendNotification($title, $content, $email);

                $message = $user->name.' replied to a comment on your post '.$this->postLabel($comment->post);
                NotificationSave::dispatch($message, $comment->post->user, $user, 'Post Reply');
            }

            // Always notify original commenter when someone else replies
            // (covers creator replying to gifter comments).
            if ($comment->user_id !== $user->id) {
                $commenter = $comment->user;
                $name = ucfirst($user->name);
                $title = '↩️ Your Comment Got a Reply!';
                $label = $this->postLabel($comment->post);
                $content = "$name replied to one of your comments on the post ({$label}).";
                $email = $commenter->email;
                Helpers::sendNotification($title, $content, $email);
            }

            return response()->json([
                'status' => true,
                'msg' => $isPostOwner ? 'Reply added successfully.' : 'Reply added and pending approval.',
                'is_approved' => $isApproved,
            ]);
        }

        return response()->json([
            'status' => false,
            'msg' => 'Comment not found.',
        ]);
    }

    public function allComments($uuid)
    {
        $post = Post::where('uuid', $uuid)->first();

        if (empty($post)) {
            return response()->json([
                'status' => false,
                'msg' => 'Post not found.',
            ]);
        }

        $userId = Auth::id();
        $isCreator = $post->user_id === $userId;

        // This route is public, so guard comments on premium/gated posts: an
        // unauthenticated caller must not read comments (and commenter identities) on
        // subscription/membership/support-gated posts.
        if (! $isCreator && ! $userId && in_array($post->for_module, ['subscription', 'membership', 'support'], true)) {
            return response()->json([
                'status' => false,
                'msg' => 'Unauthorized.',
            ], 403);
        }

        $comments = PostComment::where('post_id', $post->id)
            ->with(['replies' => function ($query) use ($userId, $isCreator) {
                $query->where(function ($q) use ($userId, $isCreator) {
                    $q->whereIn('is_approved', [1, 2])
                        ->orWhere('user_id', $userId);

                    if ($isCreator) {
                        $q->orWhereRaw('1=1'); // Creators see all replies on their post
                    }
                })->with('user');
            }, 'user'])
            ->where(function ($query) use ($userId, $isCreator) {
                $query->whereIn('is_approved', [1, 2])
                    ->orWhere('user_id', $userId);

                if ($isCreator) {
                    $query->orWhereRaw('1=1'); // Creators see all comments on their post
                }
            })
            ->get();

        return response()->json([
            'status' => true,
            'comments' => $comments,
            'post_user_id' => $post->user_id,
        ]);
    }

    public function approveComment($uuid)
    {
        $comment = PostComment::where('uuid', $uuid)->first();
        if (empty($comment)) {
            return response()->json(['status' => false, 'msg' => 'Comment not found.']);
        }

        // Only the post creator can approve comments
        if ($comment->post->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => 'Unauthorized.']);
        }

        if ($comment->is_approved === 0) {
            $comment->is_approved = 2;
            $msg = 'Comment sent to admin review.';
        } else {
            $comment->is_approved = 0;
            $msg = 'Comment hidden and reset to pending approval.';
        }
        $comment->save();

        return response()->json([
            'status' => true,
            'is_approved' => $comment->is_approved,
            'msg' => $msg,
        ]);
    }

    public function approveReply($uuid)
    {
        $reply = PostCommentReplies::where('uuid', $uuid)->first();
        if (empty($reply)) {
            return response()->json(['status' => false, 'msg' => 'Reply not found.']);
        }

        // Only the post creator can approve replies
        if ($reply->post_comment->post->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => 'Unauthorized.']);
        }

        if ($reply->is_approved === 0) {
            $reply->is_approved = 2;
            $msg = 'Reply sent to admin review.';
        } else {
            $reply->is_approved = 0;
            $msg = 'Reply hidden and reset to pending approval.';
        }
        $reply->save();

        return response()->json([
            'status' => true,
            'is_approved' => $reply->is_approved,
            'msg' => $msg,
        ]);
    }

    public function adminApproveComment($uuid)
    {
        $comment = PostComment::where('uuid', $uuid)->first();
        if (empty($comment)) {
            return response()->json(['status' => false, 'msg' => 'Comment not found.']);
        }

        $comment->is_approved = 1;
        $comment->save();

        return response()->json([
            'status' => true,
            'is_approved' => 1,
            'msg' => 'Comment approved by admin.',
        ]);
    }

    public function adminRejectComment($uuid)
    {
        $comment = PostComment::where('uuid', $uuid)->first();
        if (empty($comment)) {
            return response()->json(['status' => false, 'msg' => 'Comment not found.']);
        }

        $comment->is_approved = 3;
        $comment->save();

        return response()->json([
            'status' => true,
            'is_approved' => 3,
            'msg' => 'Comment rejected by admin.',
        ]);
    }

    public function adminApproveReply($uuid)
    {
        $reply = PostCommentReplies::where('uuid', $uuid)->first();
        if (empty($reply)) {
            return response()->json(['status' => false, 'msg' => 'Reply not found.']);
        }

        $reply->is_approved = 1;
        $reply->save();

        return response()->json([
            'status' => true,
            'is_approved' => 1,
            'msg' => 'Reply approved by admin.',
        ]);
    }

    public function adminRejectReply($uuid)
    {
        $reply = PostCommentReplies::where('uuid', $uuid)->first();
        if (empty($reply)) {
            return response()->json(['status' => false, 'msg' => 'Reply not found.']);
        }

        $reply->is_approved = 3;
        $reply->save();

        return response()->json([
            'status' => true,
            'is_approved' => 3,
            'msg' => 'Reply rejected by admin.',
        ]);
    }

    public function deleteComment($uuid)
    {
        $comment = PostComment::where('uuid', $uuid)->first();
        if (empty($comment)) {
            return response()->json(['status' => false, 'msg' => 'Comment not found.']);
        }

        // Only the post creator or comment owner can delete comments
        if ((int) $comment->post->user_id !== (int) Auth::id() && (int) $comment->user_id !== (int) Auth::id()) {
            return response()->json(['status' => false, 'msg' => 'Unauthorized.'], 403);
        }

        // Soft deletes do NOT cascade in Eloquent — replies were being left behind,
        // orphaned and still counted by the post's comment counter.
        PostCommentReplies::where('post_comment_id', $comment->id)->delete();
        $comment->delete();

        return response()->json([
            'status' => true,
            'msg' => 'Comment removed successfully.',
        ]);
    }

    public function deleteReply($uuid)
    {
        $reply = PostCommentReplies::where('uuid', $uuid)->first();
        if (empty($reply)) {
            return response()->json(['status' => false, 'msg' => 'Reply not found.']);
        }

        // Only the post creator or reply owner can delete replies
        if ($reply->post_comment->post->user_id !== Auth::id() && $reply->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => 'Unauthorized.']);
        }

        $reply->delete();

        return response()->json([
            'status' => true,
            'msg' => 'Reply removed successfully.',
        ]);
    }

    public function showPostDetail(string $username, string $slug)
    {
        $creator = User::where('username', $username)->where('suspended_account', 0)->firstOrFail();

        $post = Post::where('user_id', $creator->id)
            ->where('slug', $slug)
            ->first();

        // A slug this creator used before an edit: redirect permanently rather
        // than 404, so shared links and indexed URLs survive a retitle.
        if (! $post) {
            $retired = PostSlugHistory::where('slug', $slug)->first();
            $current = $retired
                ? Post::where('id', $retired->post_id)->where('user_id', $creator->id)->first()
                : null;

            if ($current) {
                return redirect()->route('post.show', [
                    'username' => $creator->username,
                    'slug' => $current->slug,
                ], 301);
            }

            abort(404);
        }

        // Check if creator viewing or if it's approved
        if (! Auth::check() || Auth::id() !== $creator->id) {
            if ($post->approved != 1) {
                abort(404);
            }
        }

        // Apply access control (is_lock, content strip)
        $profileService = app(UserProfileService::class);
        $post = $profileService->checkPostAccessAndLockStatus($post, $creator->id);

        // Load comment counts, likes etc.
        $post->load(['user', 'mentionedUsers']);

        $this->applyPostDetailSeo($post, $creator);

        return Inertia::render('feed/PostDetail', [
            'post' => $post,
            'creator' => $creator,
            'isOwner' => Auth::check() && Auth::id() === $creator->id,
            'IsloggedIn' => Auth::check() && Auth::user()->username === $creator->username,
        ]);
    }

    /**
     * SEO for a single post page.
     *
     * Meta is rendered server-side (SeoMeta -> app.blade.php) because link
     * unfurlers — Twitter/X, Facebook, WhatsApp, Slack, iMessage — never run
     * the page's JavaScript, so an Inertia <Head> would leave every shared
     * post with the generic site card.
     *
     * The post passed in has already been through
     * UserProfileService::checkPostAccessAndLockStatus(), which nulls `content`
     * and `image` on a locked post. That is what the meta is built from, so
     * paid content can never leak through a description or an og:image.
     */
    private function applyPostDetailSeo(Post $post, User $creator): void
    {
        $url = rtrim(config('app.url'), '/').'/'.$creator->username.'/post/'.$post->slug;
        $isLocked = empty($post->content) && empty($post->image) && $post->for_module !== 'public';

        $audienceNoun = [
            'membership' => 'members',
            'subscription' => 'subscribers',
            'support' => 'supporters',
        ][$post->for_module] ?? null;

        $title = Str::limit(trim((string) $post->title) ?: 'Post', 65, '');
        $pageTitle = $title.' — '.$creator->name.' on Spenny Piggy';

        if ($isLocked && $audienceNoun) {
            $description = "{$creator->name} published this for {$audienceNoun} on Spenny Piggy. Unlock it to see the full post.";
        } else {
            $description = trim(preg_replace('/\s+/', ' ', strip_tags((string) $post->content)));
            $description = $description !== ''
                ? Str::limit($description, 155)
                : "{$title} — a post by {$creator->name} on Spenny Piggy.";
        }

        // A post awaiting moderation, or one on a hidden profile, is reachable
        // by its owner but must never enter the index.
        $indexable = (int) $post->approved === 1
            && (int) ($creator->is_public_profile ?? 1) === 1
            && (int) $creator->suspended_account === 0;

        SeoMeta::setRobots(
            $indexable
                ? 'index,follow,max-image-preview:large,max-snippet:-1'
                : 'noindex,follow'
        );
        SeoMeta::addTag('title', $pageTitle);
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);
        SeoMeta::addTag('meta', ['name' => 'author', 'content' => $creator->name]);
        SeoMeta::setCanonical($url);

        // A locked post falls back to the creator's avatar: its own image is the
        // thing being sold.
        $image = ! $isLocked && $post->image_url
            ? $post->image_url
            : ($creator->avatar_url ?: url('/og-image.png'));

        SeoMeta::setOgData('article', $pageTitle, $description, $image, $url);
        SeoMeta::addTag('meta', ['property' => 'og:site_name', 'content' => 'Spenny Piggy']);
        SeoMeta::addTag('meta', ['property' => 'og:image:alt', 'content' => $title]);
        SeoMeta::addTag('meta', ['property' => 'article:author', 'content' => rtrim(config('app.url'), '/').'/'.$creator->username]);
        if ($post->created_at) {
            SeoMeta::addTag('meta', ['property' => 'article:published_time', 'content' => $post->created_at->toIso8601String()]);
        }
        if ($post->updated_at) {
            SeoMeta::addTag('meta', ['property' => 'article:modified_time', 'content' => $post->updated_at->toIso8601String()]);
        }

        SeoMeta::setTwitterCard('summary_large_image', $pageTitle, $description, $image);
        SeoMeta::addTag('meta', ['name' => 'twitter:site', 'content' => '@spennypiggy']);

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'SocialMediaPosting',
            'headline' => $title,
            'url' => $url,
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
            'description' => $description,
            'image' => $image,
            'author' => [
                '@type' => 'Person',
                'name' => $creator->name,
                'alternateName' => '@'.$creator->username,
                'url' => rtrim(config('app.url'), '/').'/'.$creator->username,
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => 'Spenny Piggy',
                'url' => rtrim(config('app.url'), '/'),
            ],
            'interactionStatistic' => [
                [
                    '@type' => 'InteractionCounter',
                    'interactionType' => 'https://schema.org/LikeAction',
                    'userInteractionCount' => (int) $post->likes_count,
                ],
                [
                    '@type' => 'InteractionCounter',
                    'interactionType' => 'https://schema.org/CommentAction',
                    'userInteractionCount' => (int) $post->comments_count,
                ],
            ],
        ];

        if ($post->created_at) {
            $jsonLd['datePublished'] = $post->created_at->toIso8601String();
        }
        if ($post->updated_at) {
            $jsonLd['dateModified'] = $post->updated_at->toIso8601String();
        }

        // Google's paywalled-content markup: declaring the gate is what keeps a
        // teaser page from reading as cloaking. `.paywalled-content` is the
        // wrapper around the locked panel in feed/PostDetail.jsx.
        if ($isLocked) {
            $jsonLd['isAccessibleForFree'] = false;
            $jsonLd['hasPart'] = [
                '@type' => 'WebPageElement',
                'isAccessibleForFree' => false,
                'cssSelector' => '.paywalled-content',
            ];
        } else {
            $jsonLd['isAccessibleForFree'] = true;
        }

        SeoMeta::addJsonLd($jsonLd);

        SeoMeta::addBreadcrumbJsonLd([
            ['name' => 'Spenny Piggy', 'url' => rtrim(config('app.url'), '/')],
            ['name' => $creator->name, 'url' => rtrim(config('app.url'), '/').'/'.$creator->username],
            ['name' => $title, 'url' => $url],
        ]);
    }

    /**
     * Typeahead for the composer's @mention field.
     *
     * Creators only (role 1): a fan has no public creator page, so tagging one
     * would produce a link to nowhere. Requires at least one character so the
     * endpoint can never be used to page through the whole user table.
     */
    public function mentionSearch(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));

        if (mb_strlen($term) < 1) {
            return response()->json(['users' => []]);
        }

        $users = User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->where('id', '!=', Auth::id())
            ->where(function ($q) use ($term) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
                $q->where('username', 'like', $like)->orWhere('name', 'like', $like);
            })
            ->select('id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier')
            // Exact prefix matches first — typing "spen" should put @spenny_piggy
            // above a creator whose bio-name merely contains it.
            ->orderByRaw('CASE WHEN username LIKE ? THEN 0 ELSE 1 END', [$term.'%'])
            ->orderBy('username')
            ->limit(8)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'avatar_url' => $u->avatar_url,
            ]);

        return response()->json(['users' => $users]);
    }

    public function togglePin($uuid)
    {
        $post = Post::withScheduled()->where('uuid', $uuid)->first();
        if (empty($post)) {
            return response()->json(['status' => false, 'msg' => 'Post not found.'], 404);
        }
        if ((int) $post->user_id !== (int) Auth::id()) {
            return response()->json(['status' => false, 'msg' => 'Unauthorized.'], 403);
        }

        // Toggle pin status
        $post->is_pinned = ! $post->is_pinned;
        $post->save();

        // Clear caches
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'is_pinned' => $post->is_pinned,
            'msg' => $post->is_pinned ? 'Post pinned successfully.' : 'Post unpinned successfully.',
        ]);
    }
}

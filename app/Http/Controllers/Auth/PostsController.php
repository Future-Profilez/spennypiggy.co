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
use App\Models\User;
use App\Services\CreatorActivityService;
use App\Services\ModerationService;
use App\Services\UserProfileService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostsController extends Controller
{
    /**
     * Audiences a creator may publish to. `support_thanks` posts are written by the
     * platform, never by this endpoint.
     */
    private const ALLOWED_MODULES = ['public', 'membership', 'subscription', 'support'];

    /** Post kinds a creator may submit. */
    private const ALLOWED_TYPES = ['image', 'blog'];

    /**
     * Validation rules shared by savePost/editPost.
     *
     * A post must carry an image OR text — previously `image` was `required` outright,
     * so a text-only update was impossible, while title/content were only required for
     * type=blog (a type the UI never sends), meaning an image post could be saved with
     * no title and no body at all.
     */
    private function postRules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(self::ALLOWED_TYPES)],
            'for_module' => ['required', 'string', Rule::in(self::ALLOWED_MODULES)],
            'image' => ['nullable', 'string', 'max:500', 'required_without:content'],
            'title' => ['nullable', 'string', 'max:150'],
            'content' => ['nullable', 'string', 'max:5000', 'required_without:image'],
            'ai_generated' => ['sometimes', 'boolean'],
        ];
    }

    public function savePost(Request $request)
    {
        $request->validate($this->postRules(), [
            'content.required_without' => 'Add some text or choose an image for this post.',
            'image.required_without' => 'Add some text or choose an image for this post.',
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

        $post = Post::create([
            'user_id' => Auth::id(),
            'type' => $request->type,
            'for_module' => $request->for_module,
            'title' => $request->title ?: null,
            'content' => $request->content ?: null,
            'image' => $request->image ?: null,
            'ai_generated' => $request->boolean('ai_generated'),
        ]);

        // Clear activity cache to ensure real-time updates
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());

        // Clear user caches
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'uuid' => $post->uuid,
            'msg' => 'Post saved. It will appear to your audience once approved.',
        ]);
    }

    public function editPost(Request $request, $uuid)
    {
        $request->validate($this->postRules(), [
            'content.required_without' => 'Add some text or choose an image for this post.',
            'image.required_without' => 'Add some text or choose an image for this post.',
        ]);

        $post = Post::where('uuid', $uuid)->first();

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

        $post->type = $request->type;
        $post->for_module = $request->for_module;
        $post->title = $request->title ?: null;
        $post->content = $request->content ?: null;
        $post->image = $request->image ?: null;
        $post->ai_generated = $request->boolean('ai_generated');
        $post->approved = 0;
        $post->save();

        $logs = Logs::where('edited_post_id', $post->id)->where('status', 'pending')->first();
        if (! empty($logs)) {
            $logs->status = 'updated';
            $logs->save();
        }

        // An edit changes the approved-content count the payment gate reads, so the same
        // caches savePost clears must be cleared here too.
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());

        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'Post updated. It will be re-checked before going live again.',
        ]);
    }

    public function deletePost($uuid)
    {

        $post = Post::where('uuid', $uuid)->first();

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
}

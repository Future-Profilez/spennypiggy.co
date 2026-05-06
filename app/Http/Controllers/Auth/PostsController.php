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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Services\UserProfileService;

class PostsController extends Controller
{

    public function savePost(Request $request)
    {
        $request->validate([
            "type" => [
                'required',
                "string",
            ],
            'image' => [
                'required'
            ],
            "title" => [
                'sometimes',
                'required_if:type,blog'
            ],
            "content" => [
                'sometimes',
                "required_if:type,blog"
            ],
            'for_module' => [
                'sometimes',
                'string'
            ],
        ]);

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return redirect()->back()->with("error", "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
        } else {
            Post::create([
                'user_id' => Auth::id(),
                'type' => $request->type,
                'for_module' => $request->for_module,
                'title' => $request->title ?? null,
                'content' => $request->content ?? null,
                'image' => $request->image ?? null,
                "ai_generated" => $request->ai_generated ?? 0,
            ]);

            // Clear activity cache to ensure real-time updates
            app(\App\Services\CreatorActivityService::class)->clearActivityCache(Auth::user());

            // Clear user caches
            $user = Auth::user();
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => "Post saved successfully, your upload will be approved shortly."
            ]);
        }
    }


    public function editPost(Request $request, $uuid)
    {
        $post = Post::where('uuid', $uuid)->first();

        $request->validate([
            "type" => [
                'required',
                "string",
            ],
            "title" => [
                'sometimes',
                "string",
            ],
            "content" => [
                'sometimes',
                "string",
            ],
            'for_module' => [
                'required',
                'string'
            ],
            'image' => [
                'sometimes',
                'string',
            ]
        ]);

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return redirect()->back()->with("error", "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
        } else {
            if (!empty($post)) {
                $post->type = $request->type;
                $post->for_module = $request->for_module;
                $post->title = $request->title ?? null;
                $post->content = $request->content ?? null;
                $post->image = $request->image ?? null;
                $post->ai_generated = $request->ai_generated ?? 0;
                $post->approved = 0;
                $post->save();

                $logs = Logs::where('edited_post_id', $post->id)->where('status', 'pending')->first();
                if (!empty($logs)) {
                    $logs->status = 'updated';
                    $logs->save();
                }

                // Clear user caches
                $user = Auth::user();
                app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

                return response()->json([
                    'status' => true,
                    'msg' => "Post edited successfully."
                ]);
            }

            return response()->json([
                'status' => false,
                'msg' => "Post not found."
            ]);
        }
    }


    public function deletePost($uuid)
    {

        $post = Post::where('uuid', $uuid)->first();
        if (!empty($post)) {
            // Check if this is a support_thanks post with deletion protection
            if ($post->type === 'support_thanks') {
                // Use can_delete_until if set, otherwise calculate from created_at
                $canDeleteUntil = $post->can_delete_until ?
                    \Carbon\Carbon::parse($post->can_delete_until) :
                    $post->created_at->addMonth();

                if (now()->lt($canDeleteUntil)) {
                    $daysLeft = max(1, now()->diffInDays($canDeleteUntil));
                    return response()->json([
                        'status' => false,
                        'msg' => "Creator support thank you posts cannot be deleted for 1 month after creation. You can delete this post in {$daysLeft} day(s)."
                    ]);
                }
            }

            // Verify the user owns this post (security check)
            if ($post->user_id !== Auth::id()) {
                return response()->json([
                    'status' => false,
                    'msg' => "You don't have permission to delete this post."
                ]);
            }

            $comments = PostComment::where('post_id', $post->id)->get();
            foreach ($comments as $comment) {
                PostCommentReplies::where('post_comment_id', $comment->id)->delete();
            }
            PostComment::where('post_id', $post->id)->delete();
            PostLike::where('post_id', $post->id)->delete();

            $post->delete();

            // Clear user caches
            $user = Auth::user();
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => "Post deleted successfully."
            ]);
        } else {
            return response()->json([
                'status' => false,
                'msg' => "Data not found."
            ]);
        }
    }


    public function postLike($uuid)
    {
        $post = Post::where('uuid', $uuid)->first();

        $user = User::where('id', Auth::id())->first();

        if (!empty($post)) {
            $is_liked = false;
            $like = PostLike::where('user_id', $user->id)->where('post_id', $post->id)->first();

            if (!empty($like)) {

                if ($like->status == 0) {
                    $like->status = 1;
                    $like->save();

                    $is_liked = true;

                    $message = $user->name . " liked your post " . $post->title;
                    NotificationSave::dispatch($message, $post->user, $user, 'Post Like');

                    $name = ucfirst($user->name);
                    $title = "❤️ New Like on Your Post!";
                    $content = "$name liked one of your post ({$post->title}).";
                    $email = $post->user->email;

                    Helpers::sendNotification($title, $content, $email);
                } else {
                    $like->status = 0;
                    $like->save();

                    $is_liked = false;

                    return response()->json([
                        'status' => true,
                        'liked' => $is_liked,
                        'msg' => "Post unliked successfully."
                    ]);
                }
            } else {
                PostLike::create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                    'status' => 1
                ]);

                $is_liked = true;
                $name = ucfirst($user->name);
                $title = "❤️ New Like on Your Post!";
                $content = "$name liked one of your post ({$post->title}).";
                $email = $post->user->email;

                Helpers::sendNotification($title, $content, $email);


                $message = $user->name . " liked your post " . $post->title;
                NotificationSave::dispatch($message, $post->user, $user, 'Post Like');
            }

            return response()->json([
                'status' => true,
                'liked' => $is_liked,
                'msg' => "Post liked successfully."
            ]);
        }

        return response()->json([
            'status' => false,
            'msg' => "Post not found."
        ]);
    }

    public function commentOnPost(Request $request, $uuid)
    {
        $request->validate([
            'comment' => [
                'required',
                'string'
            ]
        ]);

        $post = Post::where('uuid', $uuid)->first();
        $user = User::where('id', Auth::id())->first();

        if (!empty($post)) {
            // Check if the comment is by the post owner
            $isPostOwner = ($post->user_id === $user->id);

            // Auto-approve if post owner is commenting, otherwise set as pending approval
            $isApproved = $isPostOwner ? 1 : 0;

            $comment = $post->comments()->create([
                'user_id' => $user->id,
                'comment' => $request->comment,
                'is_approved' => $isApproved
            ]);

            // Only send notification if comment is NOT from the post owner
            if (!$isPostOwner) {
                $message = $user->name . " commented on your post " . $post->title;
                NotificationSave::dispatch($message, $post->user, $user, 'Post Comment');

                $name = ucfirst($user->name);
                $title = "💬 New Comment Needing Approval!";
                $content = "$name commented on your post ({$post->title}). Please review and approve it.";
                $email = $post->user->email;

                Helpers::sendNotification($title, $content, $email);
            }

            return response()->json([
                'status' => true,
                'msg' => $isPostOwner ? "Comment added successfully." : "Comment added and pending approval.",
                'is_approved' => $isApproved
            ]);
        }

        return response()->json([
            'status' => false,
            'msg' => "Post not found."
        ]);
    }


    public function replyOnComment(Request $request, $comment_uid)
    {
        $request->validate([
            'reply' => [
                'required',
                'string'
            ]
        ]);

        $comment = PostComment::where('uuid', $comment_uid)->first();
        $user = User::where('id', Auth::id())->first();

        if (!empty($comment)) {
            // Check if the reply is by the post owner
            $isPostOwner = ($comment->post->user_id === $user->id);

            // Auto-approve if post owner is replying, otherwise set as pending approval
            $isApproved = $isPostOwner ? 1 : 0;

            $reply = $comment->replies()->create([
                'user_id' => $user->id,
                'reply' => $request->reply,
                'is_approved' => $isApproved
            ]);

            // Only send notifications if reply is NOT from the post owner
            if (!$isPostOwner) {
                // Notify post owner about the reply
                $name = ucfirst($user->name);
                $title = "💬 New Reply Needing Approval!";
                $content = "$name replied to a comment on your post ({$comment->post->title}). Please review and approve it.";
                $email = $comment->post->user->email;
                Helpers::sendNotification($title, $content, $email);

                // Notify the commenter (if different from replier)
                if ($comment->user_id !== $user->id) {
                    $commenter = $comment->user;
                    $name = ucfirst($user->name);
                    $title = "↩️ Your Comment Got a Reply!";
                    $content = "$name replied to one of your comments on the post ({$comment->post->title}).";
                    $email = $commenter->email;
                    Helpers::sendNotification($title, $content, $email);
                }

                $message = $user->name . " replied to a comment on your post " . $comment->post->title;
                NotificationSave::dispatch($message, $comment->post->user, $user, 'Post Reply');
            }

            return response()->json([
                'status' => true,
                'msg' => $isPostOwner ? "Reply added successfully." : "Reply added and pending approval.",
                'is_approved' => $isApproved
            ]);
        }

        return response()->json([
            'status' => false,
            'msg' => "Comment not found."
        ]);
    }


    public function allComments($uuid)
    {
        $post = Post::where('uuid', $uuid)->first();

        if (empty($post)) {
            return response()->json([
                'status' => false,
                'msg' => "Post not found."
            ]);
        }

        $userId = Auth::id();
        $isCreator = $post->user_id === $userId;

        $comments = PostComment::where('post_id', $post->id)
            ->with(['replies' => function ($query) use ($userId, $isCreator) {
                $query->where(function ($q) use ($userId, $isCreator) {
                    $q->where('is_approved', 1)
                        ->orWhere('user_id', $userId);

                    if ($isCreator) {
                        $q->orWhereRaw('1=1'); // Creators see all replies on their post
                    }
                })->with('user');
            }, 'user'])
            ->where(function ($query) use ($userId, $isCreator) {
                $query->where('is_approved', 1)
                    ->orWhere('user_id', $userId);

                if ($isCreator) {
                    $query->orWhereRaw('1=1'); // Creators see all comments on their post
                }
            })
            ->get();

        return response()->json([
            'status' => true,
            'comments' => $comments,
            'post_user_id' => $post->user_id
        ]);
    }

    public function approveComment($uuid)
    {
        $comment = PostComment::where('uuid', $uuid)->first();
        if (empty($comment)) {
            return response()->json(['status' => false, 'msg' => "Comment not found."]);
        }

        // Only the post creator can approve comments
        if ($comment->post->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => "Unauthorized."]);
        }

        $comment->is_approved = !$comment->is_approved;
        $comment->save();

        return response()->json([
            'status' => true,
            'is_approved' => $comment->is_approved,
            'msg' => $comment->is_approved ? "Comment approved." : "Comment hidden."
        ]);
    }

    public function approveReply($uuid)
    {
        $reply = PostCommentReplies::where('uuid', $uuid)->first();
        if (empty($reply)) {
            return response()->json(['status' => false, 'msg' => "Reply not found."]);
        }

        // Only the post creator can approve replies
        if ($reply->post_comment->post->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => "Unauthorized."]);
        }

        $reply->is_approved = !$reply->is_approved;
        $reply->save();

        return response()->json([
            'status' => true,
            'is_approved' => $reply->is_approved,
            'msg' => $reply->is_approved ? "Reply approved." : "Reply hidden."
        ]);
    }

    public function deleteComment($uuid)
    {
        $comment = PostComment::where('uuid', $uuid)->first();
        if (empty($comment)) {
            return response()->json(['status' => false, 'msg' => "Comment not found."]);
        }

        // Only the post creator or comment owner can delete comments
        if ($comment->post->user_id !== Auth::id() && $comment->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => "Unauthorized."]);
        }

        // Soft delete handles replies if cascading is set up, otherwise manual delete
        $comment->delete();

        return response()->json([
            'status' => true,
            'msg' => "Comment removed successfully."
        ]);
    }

    public function deleteReply($uuid)
    {
        $reply = PostCommentReplies::where('uuid', $uuid)->first();
        if (empty($reply)) {
            return response()->json(['status' => false, 'msg' => "Reply not found."]);
        }

        // Only the post creator or reply owner can delete replies
        if ($reply->post_comment->post->user_id !== Auth::id() && $reply->user_id !== Auth::id()) {
            return response()->json(['status' => false, 'msg' => "Unauthorized."]);
        }

        $reply->delete();

        return response()->json([
            'status' => true,
            'msg' => "Reply removed successfully."
        ]);
    }
}

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

class PostsController extends Controller
{

    public function savePost(Request $request){
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

         $checkdata = Helpers::checkBlockData($request);
         if ($checkdata == 1) {
             return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
         }
         else
         {
             Post::create([
                 'user_id' => Auth::id(),
                 'type' => $request->type,
                 'for_module' => $request->for_module,
                 'title' => $request->title ?? null,
                 'content' => $request->content ?? null,
                 'image' => $request->image ?? null,
             ]);

             return response()->json([
                 'status' => true,
                 'msg' => "Post saved successfully, your upload will be approved shortly."
             ]);
         }
     }


     public function editPost(Request $request,$uuid){
         $post = Post::where('uuid',$uuid)->first();

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

         $checkdata = Helpers::checkBlockData($request);
         if ($checkdata == 1) {
             return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
         }
         else
         {
             if(!empty($post)){
                 $post->type = $request->type;
                 $post->for_module = $request->for_module;
                 $post->title = $request->title ?? null;
                 $post->content = $request->content ?? null;
                 $post->image = $request->image ?? null;
                 $post->approved = 0;
                 $post->save();

                $logs = Logs::where('edited_post_id',$post->id)->where('status','pending')->first();
                if(!empty($logs)){
                    $logs->status = 'updated';
                    $logs->save();
                }

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


     public function deletePost($uuid){

        $post = Post::where('uuid', $uuid)->first();
        if (!empty($post)) {
            $comments = PostComment::where('post_id',$post->id)->get();
            foreach ($comments as $comment) {
                PostCommentReplies::where('post_comment_id',$comment->id)->delete();
            }
            PostComment::where('post_id',$post->id)->delete();
            PostLike::where('post_id',$post->id)->delete();

            $post->delete();

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


    public function postLike($uuid){
        $post = Post::where('uuid',$uuid)->first();

        $user = User::where('id',Auth::id())->first();

        if(!empty($post)){
            $is_liked = false;
            $like = PostLike::where('user_id',$user->id)->where('post_id',$post->id)->first();

            if(!empty($like)){

                if($like->status == 0){
                    $like->status = 1;
                    $like->save();

                    $is_liked = true;


                    $message = $user->name . " liked your post " . $post->title;
                    NotificationSave::dispatch($message,$post->user,$user,'Post Like');

                }
                else{
                    $like->status = 0;
                    $like->save();

                    $is_liked = false;

                    return response()->json([
                     'status' => true,
                     'liked' => $is_liked,
                     'msg' => "Post unliked successfully."
                    ]);
                }
            }
            else
            {
                PostLike::create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                    'status' => 1
                ]);
                $is_liked = true;

                $message = $user->name . " liked your post " . $post->title;
                NotificationSave::dispatch($message,$post->user,$user,'Post Like');
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

    public function commentOnPost(Request $request,$uuid){
        $request->validate([
            'comment' => [
                'required',
                'string'
            ]
        ]);

        $post = Post::where('uuid',$uuid)->first();
        $user = User::where('id',Auth::id())->first();
        if(!empty($post)){
            $post->comments()->create([
                'user_id' => $user->id,
                'comment' => $request->comment
            ]);

            $message = $user->name . " commented on your post " . $post->title;
            NotificationSave::dispatch($message,$post->user,$user,'Post Comment');

            return response()->json([
             'status' => true,
             'msg' => "Comment added successfully."
            ]);
        }

        return response()->json([
          'status' => false,
          'msg' => "Post not found."
        ]);
    }


    public function replyOnComment(Request $request,$comment_uid){
        $request->validate([
            'reply' => [
               'required',
               'string'
            ]
        ]);

        $comment = PostComment::where('uuid',$comment_uid)->first();
        $user = User::where('id',Auth::id())->first();
        if(!empty($comment)){
            $comment->replies()->create([
                'user_id' => $user->id,
                'reply' => $request->reply
            ]);

            $message = $user->name . " commented on your post " . $comment->post->title;
            NotificationSave::dispatch($message,$comment->post->user,$user,'Post Comment');

            return response()->json([
            'status' => true,
            'msg' => "Reply added successfully."
            ]);
        }

        return response()->json([
         'status' => false,
         'msg' => "Comment not found."
        ]);
    }


    public function allComments($uuid){
        $post = Post::where('uuid',$uuid)->first();

        $comments = PostComment::where('post_id',$post->id)->with(['replies','replies.user','user'])->get();

        return response()->json([
            'status' => true,
            'comments' => $comments
        ]);

    }

}

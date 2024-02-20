<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Post;
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
            "title" => [
                'sometimes',
                "string",
                'required_if:type,blog'
            ],
            "content" => [
                'sometimes',
                "string",
                "required_if:type,blog"
            ],
            'for_module' => [
                'required',
                'string'
            ],
            'image' => [
                'sometimes',
                'string',
                'required_if:type,image'
            ]
        ]);

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
            'msg' => "Post saved successfully."
        ]);
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
 
        if(!empty($post)){
            $post->type = $request->type;
            $post->for_module = $request->for_module;
            $post->title = $request->title ?? null;
            $post->content = $request->content ?? null;
            $post->image = $request->image ?? null;
            $post->save();

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


    public function deletePost($uuid){
        Post::where('uuid',$uuid)->delete();

        return response()->json([
            'status' => true,
            'msg' => 'Post deleted.'
        ]);
    }

}

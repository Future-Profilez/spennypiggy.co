import React, { useState } from 'react';
import axios from 'axios';
import {likes} from '../../includes/Icons'
import { usePage } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

export default function PostLike({text, post_uuid, is_liked, likes_count, updatecount}) {

  const [liked, setliked] = useState(is_liked ? true : false);
  const [likecount, setlikecount] = useState(likes_count);
  const { auth } = usePage().props;

  const postlike = () => {
    if(auth && auth.user == undefined || null){
      toast.error("You must log in first.")
      return false;
    }
    if(liked){
      setliked(false);
    } else { 
      setliked(true);
    }
    axios.get(`/post/like/${post_uuid}`).then((resp) => {
        if(resp.data.liked){
          setliked(true);
          const c = likecount+1;
          updatecount(c)
          setlikecount(c)
        } else {
          setliked(false);
          const c = likecount-1;
          updatecount(c)
          setlikecount(c)
        }
    }).catch((_err) => {
        console.error("error", _err);
        setliked(false);
    });
  };

  return (
    <>  
    <div onClick={postlike} className={`likebtn ${ liked ? 'liked' : 'unliked' } `} dangerouslySetInnerHTML={{ __html: text }} />
    </>
  )
}

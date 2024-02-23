import axios   from 'axios';
import React from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import Post from './Post';
import { usePage } from '@inertiajs/react';
import LoadingScreen from '@/includes/LoadingScreen';
import Nocontent from '@/includes/Nocontent';
export default function FeedList({ IsloggedIn}) {

  const { user, auth } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const fetchdata = () => {
    setLoading(true);
    axios.get(`/posts/${user && user.username}`).then((resp) => {
        console.log("resp", resp);
        setPosts(resp.data.posts);
        setLoading(false);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{
    fetchdata();
  },[])

  return (
    <div className='max-feed m-auto'>
      {loading ? <LoadingScreen /> :
      <>
        {posts && posts.length ? posts.map((post, i)=>{ 
          return <Post key={`post-${i}`} user={user} item={post} />
        })
        : <Nocontent text="No Posts to see" /> }
      </>}
    </div>
  )
}

import Post from './Post';
import { usePage } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
export default function FeedList() {
  const { posts } = usePage().props;
  console.log("posts", posts);
  return (
    <div className='max-feed m-auto'>
      <>
        {posts && posts.length ? posts.map((post, i)=>{ 
          return <Post key={`post-${i}`} item={post} />
        })
        : <Nocontent text="No Posts to see" /> }
      </>
    </div>
  )
}

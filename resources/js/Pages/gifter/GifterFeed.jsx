import axios from 'axios';
import { useState } from 'react';
import { useEffect } from 'react';
import Post from '../feed/Post';
import { usePage } from '@inertiajs/react';
import LoadingScreen from '@/includes/LoadingScreen';
import Nocontent from '@/includes/Nocontent';

export default function GifterFeed({username}) {

  const { user, auth } = usePage().props;
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  // Whose page this is. The empty state is the only thing that reads it: the
  // owner gets somewhere to go, a visitor gets a plain fact about somebody
  // else's page and no instruction addressed to the wrong person.
  const isOwner = !!(auth?.user?.id && user?.id && auth.user.id === user.id);

  const fetchdata = () => {
    setLoading(true);
    axios.get(`/gifter-access-posts/${username}`).then((resp) => {
        setPosts(resp.data.posts.data || []);
        setLoading(false);
    }).catch((_err) => {
        console.error("post error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{
    fetchdata();
  },[]);

  return (
    <div className='max-feed m-auto'>
      {loading ? <LoadingScreen /> :
      <>
        {posts && posts.length ? posts.map((post, i)=>{
          return <Post key={`post-${i}`} item={post} />
        })
        : (
          /*
           * 🚨 AN EMPTY TAB WITH NO ROUTE OUT IS THE WHOLE COMPLAINT THIS PAGE
           * WAS REBUILT FOR. This read `No Posts to see` — a dead end on the
           * page a new supporter lands on, where the feed is empty by
           * definition until they have unlocked something.
           *
           * ⚠️ Literal path, never `route()`. `resources/js/ziggy.js` is a
           * generated snapshot and `route()` THROWS for a name it does not
           * carry, which would take the whole tab down to render a link.
           */
          <Nocontent
            text={isOwner ? "Your feed is empty" : "Nothing posted here yet"}
            subheading={
              isOwner
                ? "Posts from the creators you unlock land here. Find someone to support and their updates start showing up in this tab."
                : "Posts from the creators this supporter has unlocked would show here."
            }
            actionHref={isOwner ? "/discover" : undefined}
            actionText={isOwner ? "Find creators" : undefined}
            showdiscover={!isOwner}
          />
        )}
      </>}
    </div>
  )
}

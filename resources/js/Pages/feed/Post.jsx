import { useState } from "react";
import {likes, comment} from '../../includes/Icons'
import { TimeFormat } from '@/includes/TimeFormat'
import supportorsimg from '../../../assets/img/supportors-img.png'
import subscriberimg from '../../../assets/img/subscribers-img.png'
import membershipimg from '../../../assets/img/membership-img.png'
import PostLike from './PostLike'
import CommentList from './CommetsLists'
import DropdownButton from 'react-bootstrap/DropdownButton';
import AddPost from './AddPost';
import {  Link, usePage } from "@inertiajs/react";
import userphoto from "../../../assets/siteicon.png";
import RemovePost from './RemovePost'
import { LazyLoadImage } from 'react-lazy-load-image-component'

export default function Post({item}) {

  const { auth, user } = usePage().props;
  const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));

  function posturl (){
    if(IsloggedIn || item && item.is_lock === 0){
      return item.image_url
    } else {
      if(item && item.for_module == 'membership'){
        return membershipimg
      }
      if(item && item.for_module == 'subscription'){
        return subscriberimg
      }
      if(item && item.for_module == 'support'){
        return supportorsimg
      }
    }
  }

  const [lcount, setlcount] = useState(item?.likes_count || 0);
  const [ccount, setccount] = useState(item?.comments_count || 0);
  const updateComments = (e) => {
    setccount(ccount+1);
  }
  const updatecount = (e) => {
    setlcount(e);
  }
  const [showComments, setShowComments] = useState(false);

  const postBadge = () => {
    if(item && item.for_module === 'membership'){
      return "membership only"
    }
    if(item && item.for_module === 'subscription'){
      return "subscriber only"
    }
    if(item && item.for_module === 'support'){
      return "supporters only"
    }
  }

  return (
    <>
      <div className="post-wrap bg-light rounded-[30px] p-[15px] xl:p-6 mb-3 mb-md-4 shadow-pink border-2 border-[#F94F97]">
        <div className='flex items-center justify-between mb-3' >
            {item?.user ? <Link href={`${item?.user?.username}`} className="headerpost mb-0 head w-auto" >
                <img alt='spenny piggy' className="author-img" src={item?.user?.avatar_url || userphoto} />
                <div>
                  <p className="authors text-dark !capitalize"> <b> {item?.user?.name || "SPENNY PIGGY"} </b> </p>
                  <p className="authors text-muted text-small"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
                </div>
            </Link>
            :
            <Link href={`${user && user.username}`} className="headerpost mb-0 head w-auto" >
                <img alt='spenny piggy' className="author-img" src={user && user.avatar_url || userphoto} />
              <div>
                <p className="authors text-dark !capitalize"> <b> {user && user.name || "SPENNY PIGGY"} </b> </p>
                <p className="authors text-muted text-small"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
              </div>
            </Link> }


            {IsloggedIn ? <DropdownButton
              className='edit-post pe-0 ' id="dropdown-basic-button"
              title={
                <div className='dots' >
              <span className='bg-dark' ></span>
              <span className='bg-dark' ></span>
              <span className='bg-dark' ></span>
            </div>}>
                <AddPost title="Edit Post"   text={"Edit Post"} classes={`text-start`} item={item} isEdit={true} />
                <RemovePost classes={`px-[18px] py-2 text-start w-full`} uuid={item.uuid} text="Remove Post" />
            </DropdownButton> : ''}
        </div>

        {IsloggedIn && item && item.approved == 0 ?  <div className='bg-yellow-50 text-yellow-500 p-2 text-sm rounded-3 mb-2 border !border-yellow-500' >
          Post waiting for approval. Currently only you can see this post.
        </div> : ''}

        {item && item.type =='image' ?
          <div className='post-images lazywrap position-relative  w-full' >
              <span className='rounded-xl pinkbg position-absolute py-1 px-2 top-3 right-3 text-uppercase text-[10px] text-light ' >{postBadge()}</span>
              <LazyLoadImage
              effect="blur"
              width='400' height='400' alt='spenny piggy'
              className="post-img w-full max-h-[400px] object-cover" src={posturl()} />

              {item.ai_generated == 1 ? <div className='absolute bottom-2 left-2 z-1 bg-black shadow-sm rounded-xl px-2 py-1 text-[8px] text-white'>MADE WITH AI </div> : ""}
          </div>
        : ''}

        <div>
          <p className="description text-dark mt-3 mb-1 pe-5"><b>{item?.title || ''}</b></p>
          <p className="description text-muted">{item?.content || ''}</p>
        </div>

        <div className="interactions flex items-center"  >
          <PostLike is_liked={item.liked} likes_count={item?.likes_count || 0} updatecount={updatecount} text={likes} post_uuid={item.uuid} />
          <div onClick={()=>setShowComments(!showComments)} dangerouslySetInnerHTML={{ __html: comment }} />
        </div>

        <div className='flex' >
          <p className="like-count text-dark me-3"><b><span id="like-number">{lcount || 0}</span> likes</b></p>
          <p className="like-count text-dark"><b><span id="like-number">{ccount || 0}</span> Comments</b></p>
        </div>

        {showComments ? <CommentList updateComments={updateComments}  post_uuid={item.uuid} /> : ''}

      </div>
    </>
  )
}

import React, { useState } from 'react'
import {likes, comment} from '../../includes/Icons'
import { TimeFormat } from '@/includes/TimeFormat'
import supportorsimg from '../../../assets/img/supportors-img.png'
import subscriberimg from '../../../assets/img/subscribers-img.png'
import membershipimg from '../../../assets/img/membership-img.png'
import PostLike from './PostLike'
import CommentList from './CommetsLists'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import AddPost from './AddPost';
import {  Link, usePage } from "@inertiajs/react";

export default function Post({item, updateState}) {
  const { auth, user } = usePage().props;
  const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));

  function posturl (){ 
    if(item && item.is_lock === 0){
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
      return "supportors only"
    }
  }

  return (
    <>
      <div className="post-wrap bg-light rounded-4 p-3 mb-3 mb-md-4">
        <div className='d-flex align-items-center justify-content-between mb-3' >
            <Link href={`${user && user.username}`} className="headerpost mb-0 head w-auto" >
                <img className="author-img" src={user && user.avatar_url || "SPENNY PIGGY"} />
              <div>
                <p className="authors text-dark"> <b> {user && user.name || "SPENNY PIGGY"} </b> </p>
                <p className="authors text-muted text-small"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
              </div>
            </Link>
            {IsloggedIn ? <DropdownButton
              className='edit-post pe-0 ' id="dropdown-basic-button"
              title={
              <div className='dots' >
              <span className='bg-dark' ></span>
              <span className='bg-dark' ></span>
              <span className='bg-dark' ></span>
            </div>}>
                <AddPost updateState={updateState} text={"Edit Post"} classes={``} item={item} isEdit={true} />
            </DropdownButton> : ''} 
        </div>
        
        {item && item.type =='image' ? 
          <div className='post-images position-relative' >
              <span className='titlebadge badge pinkbg position-absolute p-2 px-3 top-3 right-3 text-uppercase ' >{postBadge()}</span>
            <img className="post-img w-100 max-h-[400px] object-cover" src={posturl()} />
          </div>
        : ''}

        <div>
          <p className="description text-dark mt-3 mb-1"><b>{item?.title || ''}</b></p>
          <p className="description text-muted">{item?.content || ''}</p>
        </div>

        <div className="interactions d-flex align-items-center"  >
          <PostLike is_liked={item.liked} likes_count={item?.likes_count || 0} updatecount={updatecount} text={likes} post_uuid={item.uuid} />
          <div onClick={()=>setShowComments(!showComments)} dangerouslySetInnerHTML={{ __html: comment }} />
        </div>
        
        <div>
          <p className="like-count text-dark"><b><span id="like-number">{lcount || 0}</span> likes</b></p>
        </div>

        {showComments ? <CommentList  post_uuid={item.uuid} /> : ''}
        
      </div>
    </>
  )
}

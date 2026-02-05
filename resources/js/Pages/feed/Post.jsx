import { useState, Fragment } from "react";
import {likes, comment} from '../../includes/Icons'
import { TimeFormat } from '@/includes/TimeFormat'
import supportorsimg from '../../../assets/img/supportors-img.png'
import subscriberimg from '../../../assets/img/subscribers-img.png'
import membershipimg from '../../../assets/img/membership-img.png'
import PostLike from './PostLike'
import CommentList from './CommetsLists'
import { Menu, Transition } from '@headlessui/react';
import AddPost from './AddPost';
import {  Link, usePage } from "@inertiajs/react";
import userphoto from "../../../assets/siteicon.png";
import RemovePost from './RemovePost'
import { LazyLoadImage } from 'react-lazy-load-image-component'

export default function Post({item}) {

  const { auth, user } = usePage().props;
  const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));

  function posturl (){
    if(item && item?.for_module == 'public'){
      return item.image_url || false
    }
    // Check if user is the post owner OR post is accessible
    if(IsloggedIn || (item && item.is_lock === 0)){
      return item.image_url
    } else {
      // Show locked placeholder based on post type
      if(item && item.for_module == 'membership'){
        return membershipimg
      }
      if(item && item.for_module == 'subscription'){
        return subscriberimg
      }
      if(item && item.for_module == 'support'){
        return supportorsimg
      }
      // Default fallback for posts without specific module
      return item.image_url
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
      <div className=" post-wrap bg-white rounded-[20px] md:rounded-[35px] p-[15px] xl:p-6 mb-3 md:mb-4 shadow-pink sborder-2 sborder-[#F94F97]">
        <div className='flex items-center justify-between mb-3' >
            {item?.user ? <Link href={`${item?.user?.username}`} className="headerpost mb-0 head w-auto" >
                <img alt='spenny piggy' className="fading author-img" src={item?.user?.avatar_url || userphoto} />
                <div>
                  <p className="authors text-gray-900 !capitalize"> <b> {item?.user?.name || "SPENNY PIGGY"} </b> </p>
                  <p className="authors text-gray-500 text-sm"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
                </div>
            </Link>
            :
            <Link href={`${user && user.username}`} className="headerpost mb-0 head w-auto" >
                <img alt='spenny piggy' className="fading author-img" src={user && user.avatar_url || userphoto} />
              <div>
                <p className="fading authors text-gray-900 !capitalize"> <b> {user && user.name || "SPENNY PIGGY"} </b> </p>
                <p className="fading authors text-gray-500 text-sm"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
              </div>
            </Link> }


            {IsloggedIn ? (
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="edit-post pr-0 bg-transparent border-0 p-0 flex items-center">
                      <div className='dots'>
                        <span className='bg-gray-900'></span>
                        <span className='bg-gray-900'></span>
                        <span className='bg-gray-900'></span>
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="px-1 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <div className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-md text-sm`}>
                              <AddPost title="Edit Post" text={"Edit Post"} classes={`text-left w-full px-4 py-2`} item={item} isEdit={true} />
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <div className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-md text-sm`}>
                              <RemovePost classes={`px-4 py-2 text-left w-full`} uuid={item.uuid} text="Remove Post" />
                            </div>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
            ) : ''}
        </div>
        {IsloggedIn && item && item.approved == 0 ?  <div className='bg-yellow-50 text-yellow-500 p-2 text-sm rounded-lg mb-2 border !border-yellow-500' >
          Post waiting for approval. Currently only you can see this post.
        </div> : ''}

        {item && item.type =='image' || item && item.type == 'support_thanks' ?
          <div className='fading post-images lazywrap relative w-full' >
              
              {posturl() ?<>
                <span className='rounded-xl pinkbg absolute py-1 px-2 top-3 right-3 uppercase text-[10px] text-white ' >{postBadge()}</span>
                <LazyLoadImage
                effect="blur"
                width='400' height='400' alt='spenny piggy'
                className="post-img rounded-[20px]  md:!rounded-[26px] w-full max-h-[400px] object-cover"
                 src={posturl()} />
                <div className='absolute bottom-3 right-3 z-1 bg-[color:var(--pink)] shadow-sm rounded-xl px-2 py-1 text-[10px] text-white'>
                  {item && item.for_module === 'public' ? "Shoutout" : ""}
                  {item && item.for_module === 'membership' ? "Members Only" : ""}
                  {item && item.for_module === 'subscription' ? "Subscriber Only" : ""}
                  {item && item.for_module === 'support' ? "Supporters Only" : ""}
                </div>
              </> : ''}

              
              
              {item.ai_generated == 1 ? 
              <div className='absolute bottom-3 left-3 z-10 bg-black shadow-sm rounded-xl px-2 py-1 text-[8px] text-white'>MADE WITH AI </div>
               : ""}
          </div>
        : ''}

        <div>
          <p className="fading  description text-gray-900 mt-3 mb-1 pr-5"><b>{item?.title || ''}</b></p>
          <p className="fading  description text-gray-500">{item?.content || ''}</p>
        </div>

        <div className=" interactions flex items-center"  >
          <PostLike is_liked={item.liked} likes_count={item?.likes_count || 0} updatecount={updatecount} text={likes} post_uuid={item.uuid} />
          <div onClick={()=>setShowComments(!showComments)} dangerouslySetInnerHTML={{ __html: comment }} />
        </div>

        <div className='flex '  >
          <p className="fading like-count text-gray-900 mr-3"><b><span id="like-number">{lcount || 0}</span> likes</b></p>
          <p className="fading like-count text-gray-900"><b><span id="like-number">{ccount || 0}</span> Comments</b></p>
        </div>

        {showComments ? <CommentList updateComments={updateComments}  post_uuid={item.uuid} /> : ''}

      </div>
    </>
  )
}

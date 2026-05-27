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
      <div className=" post-wrap bg-[#fdfbf7] rounded-[30px]  md:rounded-[35px] p-[15px] xl:p-6 !mb-4 md:!mb-[22px] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
        <div className='flex items-center justify-between mb-3' >
            <div>
              {item?.user ? <Link href={`${item?.user?.username}`} className="headerpost mb-0 head w-auto" >
                  <img alt='spenny piggy' className="fading author-img border-[3px] border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" src={item?.user?.avatar_url || userphoto} />
                  <div>
                    <p className="authors text-black font-black !capitalize tracking-wider"> <b> {item?.user?.name || "SPENNY PIGGY"} </b> </p>
                    <p className="authors text-gray-700 font-bold text-sm"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
                  </div>
              </Link>
              :
              <Link href={`${user && user.username}`} className="headerpost mb-0 head w-auto" >
                  <img alt='spenny piggy' className="fading author-img border-[3px] border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" src={user && user.avatar_url || userphoto} />
                <div>
                  <p className="fading authors text-black font-black !capitalize tracking-wider"> <b> {user && user.name || "SPENNY PIGGY"} </b> </p>
                  <p className="fading authors text-gray-700 font-bold text-sm"> <TimeFormat dateString={item?.updated_at || ''} />   </p>
                </div>
              </Link> }
            </div>


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
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-[30px]   bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="px-1 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <div className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-[30px]   text-sm`}>
                              <AddPost title="Edit Post" text={"Edit Post"} classes={`text-left w-full px-4 py-2`} item={item} isEdit={true} />
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <div className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-[30px]   text-sm`}>
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

        {IsloggedIn && item && item.approved == 0 ?  <div className='bg-yellow-50 text-yellow-500 p-2 text-sm rounded-[30px]    mb-2 border !border-yellow-500' >
          Post waiting for approval. Currently only you can see this post.
        </div> : ''}

        {item && item.type =='image' || item && item.type == 'support_thanks' ?
          <div className='fading post-images lazywrap relative w-full border-[3px] border-black rounded-[20px] overflow-hidden' >
              
              {posturl() ?<>
                <span className='bg-[#A2E4B8] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black absolute py-2 px-4 top-3 right-3 uppercase text-xs text-black rounded-xl' >{postBadge()}</span>
                <LazyLoadImage
                effect="blur"
                width='400' height='400' alt='spenny piggy'
                className="post-img w-full max-h-[400px] object-cover"
                 src={posturl()} />
                <div className='absolute bottom-3 right-3 z-1 bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl px-3 py-1 text-xs font-black uppercase text-black'>
                  {item && item.for_module === 'public' ? "Shoutout" : ""}
                  {item && item.for_module === 'membership' ? "Members Only" : ""}
                  {item && item.for_module === 'subscription' ? "Subscriber Only" : ""}
                  {item && item.for_module === 'support' ? "Supporters Only" : ""}
                </div>
              </> : ''}
              
              {item.ai_generated == 1 ? 
              <div className='absolute bottom-3 left-3 z-10 bg-black shadow-sm rounded-[30px]   px-2 py-1 text-[8px] text-white'>MADE WITH AI </div>
               : ""}
          </div>
        : ''}

        <div>
          <p className="fading description text-black font-black text-lg mt-4 mb-2 pr-5 uppercase tracking-wide"><b>{item?.title || ''}</b></p>
          <p className="fading description text-gray-800 font-bold">{item?.content || ''}</p>
        </div>

        <div className="interactions flex items-center mt-4 "  >
          <PostLike is_liked={item.liked} likes_count={item?.likes_count || 0} updatecount={updatecount} text={likes} post_uuid={item.uuid} />
          <div className="relative cursor-pointer hover:scale-110 transition-transform ml-4" onClick={()=>setShowComments(!showComments)}>
            <div dangerouslySetInnerHTML={{ __html: comment }} />
            {item.pending_items_count > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-white animate-pulse">
                {item.pending_items_count}
              </span>
            )}
          </div>
        </div>

        <div className='flex mt-3'  >
          <p className="fading like-count text-black mr-4 font-black uppercase text-sm border-[3px] border-black bg-[#A2E4B8] px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><b><span id="like-number">{lcount || 0}</span> likes</b></p>
          <p className="fading like-count text-black font-black uppercase text-sm border-[3px] border-black bg-[#b892ff] px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><b><span id="like-number">{ccount || 0}</span> Comments</b></p>
        </div>

        {showComments ? <CommentList updateComments={updateComments}  post_uuid={item.uuid} /> : ''}

      </div>
    </>
  )
}

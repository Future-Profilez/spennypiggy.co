import { TimeFormat } from '@/includes/TimeFormat'
import { useState } from "react";
import AddComment from './AddComment';
import userphoto from "../../../assets/siteicon.png";
import { usePage } from '@inertiajs/react';
import axios from 'axios';

export default function Comment({c, update, updateComments, postUserId}) {

  const { auth } = usePage().props;
  const currentUserId = auth.user.id;
  const isPostCreator = currentUserId === postUserId;

  const [handleReply, sethandleReply] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updates = () => {
    sethandleReply(false);
    update && update();
  }

  const approveComment = (uuid) => {
    setApproving(true);
    axios.post(`/post/comment-approve/${uuid}`)
      .then(() => {
        update();
        setApproving(false);
      })
      .catch((err) => {
        console.error(err);
        setApproving(false);
      });
  }

  const approveReply = (uuid) => {
    setApproving(true);
    axios.post(`/post/reply-approve/${uuid}`)
      .then(() => {
        update();
        setApproving(false);
      })
      .catch((err) => {
        console.error(err);
        setApproving(false);
      });
  }

  const deleteComment = (uuid) => {
    if (window.confirm("Are you sure you want to remove this comment?")) {
      setDeleting(true);
      axios.post(`/post/comment-delete/${uuid}`)
        .then(() => {
          update();
          setDeleting(false);
        })
        .catch((err) => {
          console.error(err);
          setDeleting(false);
        });
    }
  }

  const deleteReply = (uuid) => {
    if (window.confirm("Are you sure you want to remove this reply?")) {
      setDeleting(true);
      axios.post(`/post/reply-delete/${uuid}`)
        .then(() => {
          update();
          setDeleting(false);
        })
        .catch((err) => {
          console.error(err);
          setDeleting(false);
        });
    }
  }

  const CommentReply = ({item}) => {
    return <>
      <div className="pt-4 pb-2 flex justify-center items-center">
        <div className="w-full h-auto flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex flex-shrink-0 self-start cursor-pointer">
              <img src={item.user?.avatar_url || userphoto} alt="" className="h-10 w-10 object-fill rounded-full" />
            </div>
            <div className="flex items-center justify-center space-x-2 w-full">
              <div className="block w-full">
                <div className="w-auto rounded-[30px]  px-2 ps-0  pb-2">
                  <div className="font-medium flex items-center justify-between">
                    <a href="#" className="hover:underline text-sm">
                      <p className='text-base font-bold capitalize' >{item.user?.name || ''}</p>
                    </a>
                    {!item.is_approved && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        Pending Approval
                      </span>
                    )}
                  </div>
                  <div className="text-small font-ligth text-gray-600">
                    {item.reply || ''}
                  </div>
                </div>
                <div className="flex justify-start items-center text-xs w-full">
                  <div className=" text-gray-700 pe-2 flex items-center justify-center space-x-1">
                    <button onClick={()=>sethandleReply(true)} href="#" className="hover:underline">
                      <p className='text-small ' >Reply</p>
                    </button>
                    <p className="self-center mx-2">.</p>
                    <p className="ppointer-none">
                      <p className='text-small' ><TimeFormat dateString={item.created_at || ''} /></p>
                    </p>
                    {isPostCreator && (
                      <>
                        <p className="self-center mx-2">.</p>
                        <button 
                          disabled={approving}
                          onClick={() => approveReply(item.uuid)} 
                          className={`text-small hover:underline ${item.is_approved ? 'text-red-500' : 'text-green-600 font-bold'}`}
                        >
                          {item.is_approved ? 'Hide' : 'Approve'}
                        </button>
                      </>
                    )}
                    {(isPostCreator || currentUserId === item.user_id) && (
                      <>
                        <p className="self-center mx-2">.</p>
                        <button 
                          disabled={deleting}
                          onClick={() => deleteReply(item.uuid)} 
                          className="text-small text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  }

  return (
    <div className="comment-box py-3 flex justify-center items-center">
      <div className="w-full h-auto flex flex-col space-y-2">

        <div className="flex items-center space-x-2 w-full">
          <div className="flex flex-shrink-0 self-start cursor-pointer">
            <img src={c?.user?.avatar_url || userphoto} alt="" className="h-10 w-10 object-fill rounded-full" />
          </div>

          <div className="items-center w-full ">
            <div className="block">
              <div className="w-auto rounded-[30px]  px-2 ps-0  pb-2">
                <div className="font-medium flex items-center justify-between">
                  <a href="#" className="hover:underline text-sm">
                    <p className='text-base font-bold capitalize' >{c?.user?.name || ''}</p>
                  </a>
                  {!c.is_approved && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      Pending Approval
                    </span>
                  )}
                </div>
                <div className="text-small font-ligth text-gray-600">
                  {c?.comment || ''}
                </div>
              </div>
              <div className="flex justify-start items-center text-xs w-full">
                <div className="  text-gray-700 px-2 flex items-center justify-center space-x-1">
                  <button onClick={()=>sethandleReply(true)} href="#" className="hover:underline">
                    <p className='text-small' >Reply</p>
                  </button>
                  <p className="self-center mx-2">.</p>
                  <a   className=" ">
                    <p className='text-small' ><TimeFormat dateString={c?.created_at || ''} /></p>
                  </a>
                  {isPostCreator && (
                    <>
                      <p className="self-center mx-2">.</p>
                      <button 
                        disabled={approving}
                        onClick={() => approveComment(c.uuid)} 
                        className={`text-small hover:underline ${c.is_approved ? 'text-red-500' : 'text-green-600 font-bold'}`}
                      >
                        {c.is_approved ? 'Hide' : 'Approve'}
                      </button>
                    </>
                  )}
                  {(isPostCreator || currentUserId === c.user_id) && (
                    <>
                      <p className="self-center mx-2">.</p>
                      <button 
                        disabled={deleting}
                        onClick={() => deleteComment(c.uuid)} 
                        className="text-small text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {c.replies && c.replies.length ?
                c.replies.map((item, index) => {
                  return <CommentReply item={item} />
                })
            : ''}

            {handleReply ? <AddComment updateComments={updateComments} is_reply={true} update={updates} comment_uuid={c?.uuid || ''}  /> : ''}

          </div>
        </div>




          {/* <div className="self-stretch flex justify-center items-center transform transition-opacity duration-200 opacity-0 translate -translate-y-2 hover:opacity-100">
            <a href="#" className="">
              <div className="text-xs cursor-pointer flex h-6 w-6 transform transition-colors duration-200 hover:rounded-full items-center justify-center">
                <svg className="w-4 h-6" fill="none" stroke="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
              </div>
            </a>
          </div> */}


      </div>
    </div>
  )
}

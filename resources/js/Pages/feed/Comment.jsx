import { TimeFormat } from '@/includes/TimeFormat'
import { useState } from "react";
import AddComment from './AddComment';
export default function Comment({c, update, updateComments}) {

  const [handleReply, sethandleReply] = useState(false);

  const updates = () =>{
    sethandleReply(false);
    update && update();
  }
  const CommentReply = ({item}) => {
    return <>
      <div className="pt-4 pb-2 flex justify-center items-center">
        <div className="w-full h-auto flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex flex-shrink-0 self-start cursor-pointer">
              <img src={item.user?.avatar_url || ''} alt="" className="h-10 w-10 object-fill rounded-full" />
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="block">
                <div className="w-auto rounded-xl px-2 ps-0  pb-2">
                  <div className="font-medium">
                    <a href="#" className="hover:underline text-sm">
                      <p className='text-base font-bold capitalize' >{item.user?.name || ''}</p>
                    </a>
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
            <img src={c?.user?.avatar_url || ''} alt="" className="h-10 w-10 object-fill rounded-full" />
          </div>

          <div className="items-center w-full ">
            <div className="block">
              <div className="w-auto rounded-xl px-2 ps-0  pb-2">
                <div className="font-medium">
                  <a href="#" className="hover:underline text-sm">
                    <p className='text-base font-bold capitalize' >{c?.user?.name || ''}</p>
                  </a>
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

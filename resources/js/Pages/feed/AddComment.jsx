import React, { useState } from 'react'
import { toast } from 'react-hot-toast';
import axios from 'axios';

export default function AddComment({post_uuid, update, is_reply, comment_uuid}) {
  
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState();

    const addCommmnt = () => {
      setLoading(true);
      if(is_reply){
          axios.post(`/post/comment-reply/${comment_uuid}`, {
            reply: reply,
          }).then((resp) => {
            if(resp.data.status){
              toast.success(resp.data.msg);
              update && update();
              setReply('');
            } else { 
              toast.error(resp.data.msg);
            }
            setLoading(false);
          }).catch((_err) => {
              console.error("error", _err);
              setLoading(false);
          });
      } else { 
          axios.post(`/post/comment/${post_uuid}`, { comment: reply,
          }).then((resp) => {
            if(resp.data.status){
              toast.success(resp.data.msg);
              update && update();
              setReply('');
            } else { 
              toast.error(resp.data.msg);
            }
            setLoading(false);
          }).catch((_err) => {
              console.error("error", _err);
              setLoading(false);
          });
      }
    };

    return <>
      <div className="headerpost mt-3 d-flex align-items-center">
        <input id="user-comment" onChange={(e)=>setReply(e.target.value)} value={reply} className='border text-dark rounded-3 me-3 ' type="text" placeholder="Add comment..." />
        <div disabled={reply == ''} className='' onClick={addCommmnt}>
          
         {loading ? 
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M 12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="4" fill="none" /> </svg>
          : 
          <svg aria-label="Share Post" className="x1lliihq x1n2onr6 x1roi4f4" fill="#000000" height="24" role="img" viewBox="0 0 24 24" width="24">
            <title>Share Post</title>
            <line fill="none" stroke="#000000" stroke-linejoin="round" stroke-width="2" x1="22" x2="9.218" y1="3" y2="10.083"></line>
            <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="#000000" stroke-linejoin="round" stroke-width="2"></polygon>
          </svg>
        }

        </div>
      </div>
    </>
}

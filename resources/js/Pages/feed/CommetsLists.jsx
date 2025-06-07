import React, { useEffect, useState } from 'react'
import Comment from './Comment'
import AddComment from './AddComment'
import axios from 'axios'
export default function CommentList({post_uuid, updateComments}){

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const listComments = () => {
    setLoading(true);
    axios.get(`/comments/${post_uuid}`).then((resp) => {
        setLists(resp.data.comments);
        setLoading(false);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{ 
    listComments();
  },[]);

  return (
    <>
        <AddComment updateComments={updateComments} update={listComments} post_uuid={post_uuid}/>
        
        {loading ? 
        <div className='w-100 flex justify-content-center m-auto d-table' >
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M 12 2 A 10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="4" fill="none" /> </svg> 
        </div>
        : ''}

        {lists && lists.length ? 
          <>
            {lists.map((c, i)=>{ 
              return <Comment updateComments={updateComments} c={c} update={listComments} />
            })}
          </>
        : ''}
    </>
  )
}

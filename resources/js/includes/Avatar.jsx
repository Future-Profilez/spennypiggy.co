import React from 'react'
import { Link } from "@inertiajs/react";
export default function Avatar({src, name, username,  subhead, url, link}) {
   
  return <>
      <style>{`
         .avatar{ border:1px solid #fff; width:60px;height:60px;max-width:60px;max-height:60px;border-radius:13px;overflow:hidden;}
         .avatar img{width:100%;height:100%;object-fit:cover;}
         .useravatar{ width:fit-content; display:flex;align-items:center;}
         .avatar-content{margin-left:13px; }
         .avatar-content p{margin-bottom:0; font-size:16px;}
         .avatar-content h2{margin-bottom:2px;font-size:18px;}
      `}</style>

      {username ? 
         <div className="avatar-wrap" >
            <Link href={url ? url : `/${link ? link : username}`} className="useravatar" >
               <div className="avatar" >
                     <img src={src}alt="image-avatar" className="img-fluid" />
               </div>
               <div className="avatar-content" >
                     <h2>{name}</h2>
                     <p>{subhead ? subhead : username}</p>
               </div>
            </Link>
         </div>  
         :
         <div className="avatar-wrap" >
            <div className="useravatar" >
               <div className="avatar" >
                     <img src={src}alt="image-avatar" className="img-fluid" />
               </div>
               <div className="avatar-content" >
                     <h2>{name}</h2>
                     {subhead ? <p>{subhead ? subhead : 'username' }</p> : ''}
               </div>
            </div>
         </div> 
      }
  </>
 
}

import React from 'react'
import { Link } from "@inertiajs/react";
export default function Avatar({src, name, username, url}) {
  return <>
      <style>{`
         .avatar{width:50px;height:50px;max-width:50px;max-height:50px;border-radius:13px;overflow:hidden;}
         .avatar img{width:100%;height:100%;object-fit:cover;}
         .useravatar{display:flex;align-items:center;}
         .avatar-content{margin-left:13px;color:#fff;}
         .avatar-content p{margin-bottom:0; font-size:14px;}
         .avatar-content h2{margin-bottom:2px;font-size:16px;}
      `}</style>

      <div className="avatar-wrap" >
         <Link href={url ? url : `/${username}`} className="useravatar" >
            <div className="avatar" >
                  <img src={src}alt="image-avatar" className="img-fluid" />
            </div>
            <div className="avatar-content" >
                  <h2>{name}</h2>
                  <p>@{username}</p>
            </div>
         </Link>
      </div>
  </>
 
}

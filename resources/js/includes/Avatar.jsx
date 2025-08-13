import React from 'react'
import { Link } from "@inertiajs/react";
import ModernImage from '../Components/ModernImage';
import userphoto from "../../assets/siteicon.png";
import { RiVerifiedBadgeFill } from "react-icons/ri";

export default function Avatar({ src, role, profile_status_lock, imageSrc, name, username, subhead, url, link }) {

  return (
    <>
      <style>{`
      .avatar { border:1px solid #fff;width:60px;height:60px;max-width:60px;max-height:60px;border-radius:13px;overflow:hidden;}
      .avatar img{width:100%;height:100%;object-fit:cover;}
      .useravatar{width:fit-content;display:flex;align-items:center;}
      .avatar-content{margin-left:13px;}
      .avatar-content p{margin-bottom:0;font-size:16px;}
      .avatar-content h2{margin-bottom:2px;font-size:18px;}
      `}</style>

      {username ? (
        <div className="avatar-wrap">
          <Link href={url || `/${link || username}`} className="useravatar">
            <div className="avatar ">
              <ModernImage
                src={imageSrc || src || userphoto}
                alt="image-avatar"
                className="img-fluid"
                width={100}
                height={100}
                loading="lazy"
                decoding="async"
                objectFit="cover"
                responsive={true}
                formats={['webp', 'avif']}
                quality={85}
                aspectRatio="1/1"
                placeholder="blur"
              />
            </div>
            <div className="avatar-content">
              <h2 className='flex items-center '>{name} {role && profile_status_lock ?
              <RiVerifiedBadgeFill  size={'1.2rem'} className="ms-1 mt-1 text-pink" /> : ''}
              </h2>
              <p className='text-gray-500'>{subhead || username}</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="avatar-wrap">
          <div className="useravatar">
            <div className="avatar">
              <ModernImage
                src={imageSrc || src}
                alt="image-avatar"
                className="img-fluid"
                objectFit="cover"
                responsive={true}
                formats={['webp', 'avif']}
                quality={85}
                aspectRatio="1/1"
                placeholder="blur"
              />
            </div>
            <div className="avatar-content">
              <h2>{name}</h2>
              {subhead && <p className=''>{subhead}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

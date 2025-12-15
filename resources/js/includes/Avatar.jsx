import { Link } from "@inertiajs/react";
import ModernImage from '../Components/ModernImage';
import userphoto from "../../assets/siteicon.png";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import FounderBadge from "@/Components/FounderBadge";

export default function Avatar({ src, role, profile_status_lock, imageSrc, name, username, subhead, url, link, is_founder, onClick }) {

  return (
    <>
      <style>{`
      .avatar { 
        border: 1px solid #fff;
        width: 60px;
        height: 60px;
        max-width: 60px;
        max-height: 60px;
        min-width: 60px;
        min-height: 60px;
        border-radius: 13px;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .avatar img,
      .avatar picture,
      .avatar > div {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .avatar .relative {
        position: absolute !important;
        width: 100% !important;
        height: 100% !important;
      }
      .useravatar {
        width: fit-content;
        display: flex;
        align-items: center;
        text-decoration: none;
      }
      .avatar-content {
        margin-left: 13px;
        flex: 1;
        min-width: 0;
      }
      .avatar-content p {
        margin-bottom: 0;
        font-size: 16px;
        word-wrap: break-word;
      }
      .avatar-content h2 {
        margin-bottom: 2px;
        font-size: 18px;
        word-wrap: break-word;
      }
      `}</style>

      {username ? (
        <div className="avatar-wrap">
          <Link href={url || `/${link || username}`} className="useravatar" onClick={onClick}
          >
            <div className="avatar ">
              <img
                src={imageSrc || src || userphoto}
                alt="image-avatar"
                className="img-fluid"
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                onError={(e) => {
                  console.warn('Avatar image failed to load:', imageSrc || src);
                  e.target.src = userphoto;
                }}
              />
            </div>
            <div className="avatar-content">
              <h2 className='flex items-center capitalize '>{name} 
                {role && profile_status_lock ?
                  <>
                    {is_founder ? 
                      <div className="mb-1">
                        <FounderBadge classes="w-4 h-4" icon={true}  />
                      </div>
                      :
                      <RiVerifiedBadgeFill  size={'1.2rem'} 
                      className="ms-1 mt-1 text-pink" /> 
                    }
                  </>
                : ''}
              </h2>
              <p className='text-gray-500'>{subhead || username}</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="avatar-wrap">
          <div className="useravatar">
            <div className="avatar">
              <img
                src={imageSrc || src || userphoto}
                alt="image-avatar"
                className="img-fluid"
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                onError={(e) => {
                  console.warn('Avatar image failed to load:', imageSrc || src);
                  e.target.src = userphoto;
                }}
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

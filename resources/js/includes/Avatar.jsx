import { Link } from "@inertiajs/react";
import ModernImage from '../Components/ModernImage';
import userphoto from "../../assets/siteicon.png";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import FounderBadge from "@/Components/FounderBadge";
import { CircleCheckIcon } from "@animateicons/react/lucide";
import { useRef, useEffect } from "react";

const defaultAvatar = 'https://ucarecdn.com/2c6afc02-8ae1-4e8b-8f53-d71f6066dd77/-/preview/600x600/';

export default function Avatar({ imgclass,hidename, namecolor, src, role, profile_status_lock, imageSrc, name, username, subhead, url, link, is_founder, onClick, nolink }) {
  const badgeRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const startLoop = () => {
        if (badgeRef.current) {
            badgeRef.current.startAnimation?.();
        }
        // Verification badge loops more frequently to be noticed
        const nextDelay = 3000 + Math.random() * 2000;
        timeoutRef.current = setTimeout(startLoop, nextDelay);
    };
    
    const initialDelay = Math.random() * 2000;
    const initialTimeout = setTimeout(startLoop, initialDelay);
    
    return () => {
        clearTimeout(initialTimeout);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [role, profile_status_lock]);

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

      {username && !nolink ? (
        <div className="avatar-wrap">
          <Link 
            href={url || `/${link || username}`} 
            className="useravatar group/avatar" 
            onClick={onClick}
            onMouseEnter={() => badgeRef.current?.startAnimation()}
          >
            <div className={`avatar !border-2 !border-white !overflow-visible relative rounded-[20px] ${imgclass}`}>
              <img
                src={imageSrc || src || defaultAvatar}
                alt="image-avatar"
                className="img-fluid bg-gray-200 !rounded-[17px]" 
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
                  e.target.src = defaultAvatar;
                }}
              />
              {role && profile_status_lock && (
                is_founder ? (
                  <FounderBadge classes="w-6 h-6 absolute top-[-5px] right-[-5px] bg-white !shadow-xl border border-2 !border-[#eab308] rounded-full p-[2px]" icon />
                ) : (
                  <div className="absolute top-[-5px] right-[-5px] bg-gray-100 !shadow-xl rounded-full border border-2 !border-pink-500 rounded-full p-[1px]">
                    <CircleCheckIcon
                      ref={badgeRef}
                      size="1.5rem"
                      duration={1.2}
                      className="text-pink"
                    />
                  </div>
                )
              )}
            </div>
            {hidename ? "" : 
            <>
              <div className="avatar-content">
                  <h2 className={` flex items-center gap-1 capitalize ${namecolor || ''}`}>
                    <span className="line-clamp-1 ">
                      {name}
                    </span>
                  </h2>
                  <p className="text-gray-500">
                    {subhead || username}
                  </p>
              </div>
            </>}

          </Link>
        </div>
      ) : (
        <div className="avatar-wrap">
          <div className="useravatar group/avatar" onMouseEnter={() => badgeRef.current?.startAnimation()}>
            <div className={`avatar !border-2 !border-white !overflow-visible relative rounded-[20px] ${imgclass}`}>
              <img
                src={imageSrc || src || defaultAvatar}
                alt="image-avatar"
                className="img-fluid bg-gray-200 !rounded-[17px]" 
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
                  e.target.src = defaultAvatar;
                }}
              />
              {role && profile_status_lock && (
                is_founder ? (
                  <FounderBadge classes="w-6 h-6 absolute top-[-5px] right-[-5px] bg-white !shadow-xl border border-2 !border-[#eab308] rounded-full p-[2px]" icon />
                ) : (
                  <div className="absolute top-[-5px] right-[-5px] bg-gray-100 !shadow-xl rounded-full border border-2 !border-pink-500 rounded-full p-[1px]">
                    <CircleCheckIcon
                      ref={badgeRef}
                      size="1.5rem"
                      duration={1.2}
                      className="text-pink"
                    />
                  </div>
                )
              )}
            </div>
            <div className="avatar-content">
              <h2 className={`${namecolor || ''}`}>{name}</h2>
              {subhead && <p className=''>{subhead}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

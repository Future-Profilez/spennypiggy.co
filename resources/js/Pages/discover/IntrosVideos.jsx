import { lazy } from "react";
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const LoadingScreen = lazy(() => import('@/includes/LoadingScreen'));
const Nocontent = lazy(() => import('@/includes/Nocontent'));
import userphoto from "../../../assets/siteicon.png";
import Popup from '@/Components/Popup';
import { trackSearchClick } from "@/includes/Analytics";
import { RiVerifiedBadgeFill } from "react-icons/ri";

export default function IntroVideos(props) {

    const [intros, setIntros] = useState();
    const [order, setorder] = useState('new');
    const [gender, setgender] = useState('all');
    const [loading, setloading] = useState(false);
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

    const fetch_videos = () => {
        setloading(true);
        axios.get(`discover/creators/${order}/${gender}`).then((resp) => {
            setIntros(resp.data && resp.data?.intro?.data);
            setloading(false);
        }).catch((_err) => {
            console.error("error", _err);
            setloading(false);
        });
    }

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(()=>{
      !loading && fetch_videos();
    },[order, gender]);

    const Switch = () => {
        return <div className='flex mb-3 mb-sm-0 items-center toggleswitch' >
        <button onClick={()=>setorder('new')} className={`${order == 'new' ? 'active' : ''}`} >Newest</button>
        <button onClick={()=>setorder('old')} className={`${order == 'old' ? 'active' : ''}`} >Oldest</button>
    </div>
    }

    const ProfileIntro = ({ data, text}) => {
    return <>
      <Popup space="0" size="md"  classes={`w-100 h-full`}
        text={text} >
            <div className='video-payer-pop' >
              <video playsInline='false'  controlsList='nodownload' autoPlay   controls src={data && data.perma_link} />
            </div>
        </Popup>
      </>
    }


    const Intro = ({w}) => {
      const verified = w && w.user && ((w.user.role === 1) && (w.user.profile_status_lock === 2));
      return  <div className="relative rounded-[25px] h-[250px] md:h-[350px] overflow-hidden border border-pink-200 bg-black group"> 
        <ProfileIntro data={w}  text={
          <>
            <div className="h-full relative">
              <LazyLoadImage
                alt={"image"}
                effect="blur"
                height={360}
                src={(w && w?.poster_url) || (w && w?.user && w?.user?.avatar_url) || userphoto}
                className="w-full !h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                width={260}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70"></div>
              <div className="absolute top-3 left-3 bg-white/85 text-gray-900 text-xs font-medium px-2 py-1 rounded-md">
                Intro Video
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="transform transition-transform duration-300 group-hover:scale-105">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="32" fill="#F94F97"/>
                    <path d="M40 32.0234L22.72 22.0468V42L40 32.0234Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>
          </>
        } />
        <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 z-[99] text-white">
          {w && w.user && w.user.username ? (
            <Link href={`/${w.user.username}`} onClick={() => trackSearchClick(w.user.id, w.user.username)} className="block">
              <p className="text-normal md:text-lg font-GillSans uppercase mb-0 flex items-center gap-2">
                {w.user.name}
                {verified ? <RiVerifiedBadgeFill size={'1rem'} className="text-pink" /> : ''}
              </p>
              <p className="text-normal mt-0 opacity-90">@{w.user.username}</p>
            </Link>
          ) : (
            <div>
              <p className="text-lg font-GillSans uppercase mb-0">{(w && w.user && w.user.name) || 'Unknown User'}</p>
              <p className="text-normal mt-0 text-gray-300">@unavailable</p>
            </div>
          )}
        </div>
      </div>
    }

    return <>
        <div className={`filters d-block  items-center justify-between w-100 mb-4 ${intros && intros.length < 1 ? '!hidden' : ''}`} >
            <h2 className='text-2xl text-gray-900 font-gulfs uppercase'>Intro Videos</h2>
            {/* <div className='flex gap-1 mt-3 items-center' >
              <button onClick={()=>setorder('new')} className={` flex-shrink-0 px-3 py-[5px] rounded-full text-[14px] font-medium transition-all whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${order == 'new' ? '!bg-blue-600 text-white' : ''}`} >Newest</button>
              <button onClick={()=>setorder('old')} className={` flex-shrink-0 px-3 py-[5px] rounded-full text-[14px] font-medium transition-all whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${order == 'old' ? '!bg-blue-600 text-white' : ''}`} >Oldest</button>
              <button onClick={(e)=> setgender('he')} className={` flex-shrink-0 px-3 py-[5px] rounded-full text-[14px] font-medium transition-all whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${gender == 'he' ? '!bg-blue-600 text-white' : ''}`} >He</button>
              <button onClick={(e)=> setgender('she')} className={` flex-shrink-0 px-3 py-[5px] rounded-full text-[14px] font-medium transition-all whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${gender == 'she' ? '!bg-blue-600 text-white' : ''}`} >She</button>
              <button onClick={(e)=> setgender('they')} className={` flex-shrink-0 px-3 py-[5px] rounded-full text-[14px] font-medium transition-all whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${gender == 'they' ? '!bg-blue-600 text-white' : ''}`} >They</button>
            </div> */}
            
        </div>

        <div className='' >
          {loading ?
          <div className='w-100 flex justify-content-center' ><LoadingScreen /></div>
          :
          <>
            {intros && intros.length ?
            <div className=' w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {intros.map((w, i)=> (
                    <Intro w={w} />
                ))}
            </div>
            : <div className='my-5' >
              {/* <Nocontent text={'New Creators are on their way! Start exploring now!'} /> */}
            </div> }
          </>}

      </div>
    </>

}

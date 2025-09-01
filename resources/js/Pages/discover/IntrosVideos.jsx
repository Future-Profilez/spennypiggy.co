import { lazy } from "react";
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
const LoadingScreen = lazy(() => import('@/includes/LoadingScreen'));
const Nocontent = lazy(() => import('@/includes/Nocontent'));
import userphoto from "../../../assets/siteicon.png";
import Popup from '@/Components/Popup';

export default function IntroVideos(props) {

    const [intros, setIntros] = useState();
    const [order, setorder] = useState('new');
    const [gender, setgender] = useState('all');
    const [loading, setloading] = useState(false);

    const fetch_videos = () => {
        setloading(true);
        axios.get(`discover/creators/${order}/${gender}`).then((resp) => {
            setIntros(resp.data && resp.data.intro.data);
            setloading(false);
        }).catch((_err) => {
            console.error("error", _err);
            setloading(false);
        });
    }

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
      <Popup space="0" size="md"  classes={`w-100`}
        text={text} >
            <div className='video-payer-pop' >
              <video playsInline='false'  controlsList='nodownload' autoPlay   controls src={data && data.perma_link} />
            </div>
        </Popup>
      </>
    }


    const Intro = ({w}) => {
      return  <> <ProfileIntro data={w}  text={<>
        <div className='' >
            <div className='introvideobox overflow-hidden h-[350px] rounded-[25px] border-3 !border-[#F94F97] position-relative' >
              <LazyLoadImage
              alt={"image"}  effect="blur"
              height={360} src={ w && w?.poster_url || w?.user && w?.user?.avatar_url|| userphoto} className='w-full h-full object-cover' width={260} />
              <div  className='cursor-pointer playicon ' >
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="32" fill="#F94F97"/>
                <path d="M40 32.0234L22.72 22.0468V42L40 32.0234Z" fill="black"/>
                </svg>
              </div>
              
            </div>
        </div>
        <div className='absolute bg-[#0004] bottom-0 left-0  p-3 z-[10px]  w-100 text-white transition-colors hover:bg-[#000] ' >
          <Link href={`/${w && w.user && w.user.username}`}  >
            <p className='text-lg font-GillSans hover !uppercase mb-0' >{w && w.user && w.user.name}</p>
            <p className='text-normal' >@{w && w.user && w.user.username}</p>
          </Link>
        </div>
      </>} />
      </>
    }

    return <>
     <div className='filters d-block d-sm-flex  items-center justify-between w-100 mb-4' >
                <Switch />
            <div className='flex items-center' >
              <div className='filter-select-wrap' >
                  <select onChange={(e)=> setgender(e.target.value)} id="types" className="me-2 filter-select bg-gray-50 border border-gray-300 text-gray-900
                  text-sm rounded-md focus:ring-blue-500 focus:border-blue-500
                  block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                  dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                      <option selected value="all" >All Gender </option>
                      <option value="he">He</option>
                      <option value="she">She</option>
                      <option value="they">They</option>
                  </select>
              </div>
            </div>
        </div>

        <div className='row' >
          {loading ?
          <div className='w-100 flex justify-content-center' ><LoadingScreen /></div>
          :
          <>
            {intros && intros.length ?
            <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 lg:!gap-4' >
              {intros.map((w, i)=> {
                return <Intro w={w} />
              })}
            </div>
            : <div className='my-5' ><Nocontent text={'No Result Found'} /></div> }
          </>}

      </div>
    </>

}


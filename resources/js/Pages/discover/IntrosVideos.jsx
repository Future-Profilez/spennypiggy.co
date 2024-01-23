import { Link } from '@inertiajs/react';
import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
const LoadingScreen = React.lazy(() => import('@/includes/LoadingScreen'));
const Nocontent = React.lazy(() => import('@/includes/Nocontent'));

export default function IntroVideos(props) {

    const [intros, setIntros] = useState();
    const [order, setorder] = useState('new');
    const [gender, setgender] = useState('all');
    const [loading, setloading] = useState(false);

    const fetch_videos = () => {
        setloading(true);
        axios.get(`discover/creators/${order}/${gender}`).then((resp) => {
            console.log("resp",resp);
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
        return <div className='d-flex mb-3 mb-sm-0 align-items-center toggleswitch' >
        <button onClick={()=>setorder('new')} className={`${order == 'new' ? 'active' : ''}`} >Newest</button>
        <button onClick={()=>setorder('old')} className={`${order == 'old' ? 'active' : ''}`} >Oldest</button>
    </div>
    }
    
    const Intro = ({w}) => { 
      const [open, setOpen] = useState(false);

      return <div  className=' col-xl-3 col-lg-4 col-6 mb-4' >
          <div className='introbox rounded-lg position-relative' >
            <LazyLoadImage  onClick={()=>setOpen(!open)} 
            alt={"image"} useIntersectionObserver={true} effect="blur"
            height={360} src={w && w.poster_url} className='' width={260} />
            <div onClick={()=>setOpen(!open)} className='cursor-pointer playicon' >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="#F94F97"/>
              <path d="M40 32.0234L22.72 22.0468V42L40 32.0234Z" fill="black"/>
              </svg>
            </div>
            <div className='user-links w-100' >
              <Link href={`/${w && w.user && w.user.username}`}  >
                <p className='text-white text-normal' >{w && w.user && w.user.name}</p>
                <p className='text-mint text-normal' >@{w && w.user && w.user.username}</p>
              </Link>
            </div>

            {open ? <div className='videoPopup-outer'>
                <div className='videoPopup'>
                  <video controlsList='nodownload' autoPlay playsInline={false} controls src={w && w.perma_link} />
                  <button  onClick={()=>setOpen(!open)} className='close-btn' >&times;</button>
                </div>
            </div> : ''}

          </div>
      </div>
    }

    return <>
     <div className='filters d-block d-sm-flex  align-items-center justify-content-between w-100 mb-4' >
                <Switch />
            <div className='d-flex align-items-center' >
              <div className='filter-select-wrap' >
                  <select onChange={(e)=> setgender(e.target.value)} id="types" class="me-2 filter-select bg-gray-50 border border-gray-300 text-gray-900 
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
          <div className='w-100 d-flex justify-content-center' ><LoadingScreen /></div>  
          :
          <>
            {intros && intros.length ? intros.map((w, i)=> { 
              return <Intro w={w} />
            }) : <div className='my-5' ><Nocontent text={'No Result Found'} /></div> }
          </>}

      </div>
    </>
    
}


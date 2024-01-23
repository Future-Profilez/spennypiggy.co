import Popup from '@/Components/Popup'
import GlobalUploader from '@/uploadcare/Uploader'
import React from 'react'
import st from "../../../css/uploader.module.css";
import { useState } from 'react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import LoaderButton from '@/Components/LoaderButton';
import { useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useMemo } from 'react';

export default function AddIntro({IsloggedIn, uuid}){

  const [open, setOpen] = useState(false);
  const [loading,setloading] = useState(false);
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [close, setClose] = useState();
  const [clear, setClear] = useState();
  const [msgMedia, setMsgMedia] = useState(null);
  const getFileUID = async (data) => {
    setMsgMedia(data);
  }; 

  const [introVideo, setIntroVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  async function getVideo (signal) { 
    setVideoLoading(true);
    axios.get(`my-intro/${uuid}`, {signal}).then(resp => {
      if(resp.data.status) { 
        setIntroVideo(resp.data.intro);
      }
      setVideoLoading(false);
    }).catch(_err => {
        console.error("error", _err);
        setVideoLoading(false);
    });
  }

  useEffect(()=>{
    const controller = new AbortController();
    const {signal} = controller;
    getVideo(signal)
    return () => controller.abort();
  },[]); 

  const addVideo = () => { 
    if(msgMedia == null || undefined){
      return false;
    }
    setloading(true);
    axios.post(`intro/save`, { "media":msgMedia }).then(resp => {
      if(resp.data.status){
          getVideo();
          successAlert(resp.data.msg);
          setClose(false);
          setTimeout(()=>{
            setClose();
          },1000);
          setClear(new Date());
          setOpen(false);
      } else {
          errorAlert(resp.data.msg);
      }
      setloading(false);
    }).catch(_err => {
        console.error("error", _err);
        setloading(false);
    });
  }

  const removeVideo = () => { 
    axios.get(`intro/remove`).then(resp => {
      if(resp.data.status){
          getVideo();
          successAlert(resp.data.msg);
          setClose(false);
          setTimeout(()=>{
            setClose();
          },1000);
      } else {
          errorAlert(resp.data.msg);
      }
    }).catch(_err => {
        console.error("error", _err);
    });
  }

  const ProfileIntro = () => {
    return <>
      <Popup
        modalclassName="pinkmodal shadow-pink" space="0" size="md" action={close} classes={`w-100`}
        text={<>
        <div className='isintro cursor-pointer shadow-voilet'>
          <LazyLoadImage
          alt={"image"} useIntersectionObserver={true} effect="blur"
          height={350} src={ introVideo &&  introVideo.poster_url} className='' width={400} />
          <div className='cursor-pointer playicon' >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="#F94F97"/>
            <path d="M40 32.0234L22.72 22.0468V42L40 32.0234Z" fill="black"/>
            </svg>
          </div>
        </div>
        {IsloggedIn && introVideo && introVideo.approved !== 1 ? <div className='mt-4 alert alert-warning  rounded p-2' >Profile intro video is waiting for approval. Currently only you can see this intro.</div> : ''}
        </>} > 
          <div className='video-payer-pop' >
            <video playsInline='false' autoPlay src={introVideo && introVideo?.perma_link || ''} controls controlsList='nodownload' />
          </div>
      </Popup>
    </>
  }

  return (
    <div className={`mt-4 ${videoLoading ? 'd-none' : '' } `}>
      {introVideo ? 
        <div className='position-relative'>
          <ProfileIntro /> 
          {IsloggedIn ? <button onClick={removeVideo} className='badge bg-danger remove-story' >Remove</button> : ''}
        </div>
        : 
        <>
        { IsloggedIn ? 
              <Popup modalclassName="pinkmodal sendSurprize-modal shadow-pink" space="4" size="md" action={close} classes={`w-100`}
                text={ 
                  <div className='cursor-pointer box shadow-voilet rounded-lg p-3 py-4 d-flex align-items-center justify-content-center' >
                    <div>
                        <div className='svg-icon m-auto d-table' >
                        <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 24 24" class="stroke-green-400 fill-none group-hover:fill-green-800 group-active:stroke-green-200 group-active:fill-green-600 group-active:duration-0 duration-300"> <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke-width="1.5" ></path> <path d="M8 12H16" stroke-width="1.5"></path> <path d="M12 16V8" stroke-width="1.5"></path> </svg>
                        </div>
                        <p className='w-100 text-center mt-2' >Add Intro</p>
                    </div>
                  </div> 
                } >  
              <div className='box' >
                <h2 className="text-uppercase font-GillSans pb-1 font-large">Add Intro Video</h2>
                <p className='text-muted mb-4' >Add a 15 to 30 sec video to introduce yourself.</p>
                <div className='my-3' >
                  <GlobalUploader view={true}
                    clear={clear} type='minimal'
                    sendFile={getFileUID}
                    options={st.profileVideo}
                  />  
                </div>  
                <LoaderButton onClick={addVideo}
                    disabled={loading}
                    className="flex px-4  mb-3 btn-pink sm mx-auto"
                    spinnerClassName="fill-red-600" >
                    {loading ? "Adding..." : " Add Video "}
                </LoaderButton>
              </div>
              </Popup>
       : '' }
        </>
      }
    </div>
  )
}
 

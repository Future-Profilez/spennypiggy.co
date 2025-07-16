import Popup from '@/Components/Popup'
import GlobalUploader from '@/uploadcare/Uploader'
import React from 'react'
import st from "../../../css/uploader.module.css";
import { useState } from 'react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import LoaderButton from '@/Components/LoaderButton';
import { useEffect } from 'react';
import wishlistbannerimg from "../../../assets/img/wishlistbannerimg.jpg";
import { useRef } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function AddIntro({IsloggedIn,  text, classes, setIntroStatus}){

  const [open, setOpen] = useState(false);
  const [loading,setloading] = useState(false);
  const { intro, auth } = usePage().props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [close, setClose] = useState();
  const [clear, setClear] = useState();
  const [msgMedia, setMsgMedia] = useState(null);
  const getFileUID = async (data) => {
    setMsgMedia(data);
  };

  const uploaderRef = useRef();
  const resetUploader = () => {
      if (uploaderRef.current) {
          uploaderRef.current.reset();
      }
  };

  const [videoLoading, setVideoLoading] = useState(false);

  const addVideo = () => {
    if(msgMedia == null || undefined){
      return false;
    }
    setloading(true);
    axios.post(`/update/intro/video`, { "media":msgMedia }).then(resp => {
      if(resp.data.status){
          successAlert(resp.data.msg);
          setClose(false);
          resetUploader();
          setOpen(false);
          setMsgMedia(null);
          router.visit(route('user.show', auth?.user?.username), {
            method: 'get',
            preserveScroll: true,
          });
          setIntroStatus && setIntroStatus(1)
          setTimeout(()=>{
            setClose();
          },1000);
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
          router.visit(route('user.show', auth?.user?.username), {
            method: 'get',
            preserveScroll: true,
          });
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
      <Popup space="0" size="md" action={close} classes={`w-100`}
        text={<>
        <div className='isintro relative cursor-pointer shadow-voilet'>
          <img
          alt={"image"}  effect="blur"
          height={350} src={ intro && intro.poster_url || wishlistbannerimg} className='' width={400} />
          <div className='cursor-pointer playicon' >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="#F94F97"/>
            <path d="M40 32.0234L22.72 22.0468V42L40 32.0234Z" fill="black"/>
            </svg>
          </div>
          {IsloggedIn && intro && intro.approved !== 1 ? <div className='text-sm mb-0   alert bg-black text-yellow-400 w-full  absolute z-1 bottom-0 left-0 rounded p-2 px-3' >Profile intro video is waiting for approval. Currently only you can see this intro.</div> : ''}
        </div>
        </>} >
          <div className='video-payer-pop' >
            <video playsInline='false' autoPlay src={intro && intro?.perma_link || ''} controls controlsList='nodownload' />
          </div>
      </Popup>
    </>
  }

  return (
    <div className={`pb-4 ${videoLoading ? 'd-none' : '' } `}>
      {intro ?
        <div className='position-relative'>
          <ProfileIntro />
          {IsloggedIn ? <button onClick={removeVideo} className='badge bg-danger remove-story' >Remove</button> : ''}
        </div>
        :
        <>
        { IsloggedIn ?
              <Popup modalclassName="pinkmodal sendSurprize-modal shadow-pink" space="4" size="md" action={close} classes={`${classes} w-100`}
                text={text ? text :
                  <div className='cursor-pointer box shadow-voilet rounded-lg p-3 py-4 flex items-center justify-content-center' >
                    <div>
                        <div className='svg-icon m-auto d-table' >
                        <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 24 24" className="stroke-green-400 fill-none group-hover:fill-green-800 group-active:stroke-green-200 group-active:fill-green-600 group-active:duration-0 duration-300"> <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5" ></path> <path d="M8 12H16" strokeWidth="1.5"></path> <path d="M12 16V8" strokeWidth="1.5"></path> </svg>
                        </div>
                        <p className='w-100 text-center mt-2' >Add Intro</p>
                    </div>
                  </div>
                }
              >
              <div className='wrap' >
                <h2 className="text-uppercase font-GillSans pb-1 font-large">Add Intro Video</h2>
                <p className='text-muted mb-3' >Add a 15 to 30 sec video to introduce yourself.</p>
                <p className='text-danger mb-4' >All videos are reviewed against our terms before being accepted or rejected.</p>
                <div className='my-3' >
                  <GlobalUploader view={true}
                    ref={uploaderRef} type='minimal'
                    sendFile={getFileUID}
                    options={st.profileVideo}
                  />
                </div>
                <LoaderButton onClick={addVideo}
                    disabled={loading}
                    className={`${!msgMedia ? 'disabled' : ''} flex px-4  mb-3 btn-pink sm mx-auto w-full`}
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

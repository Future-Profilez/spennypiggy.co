import Popup from '@/Components/Popup'
import GlobalUploader from '@/uploadcare/Uploader'
import st from "../../../css/uploader.module.css";
import { useState } from 'react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import LoaderButton from '@/Components/LoaderButton';
import { useEffect } from 'react';
import wishlistbannerimg from "../../../assets/img/wishlistbannerimg.jpg";
import { useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Maximize } from 'lucide-react';

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
    axios.get(`/intro/remove`).then(resp => {
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

  const videoRef = useRef(null);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  const rawUrl = intro?.perma_link || '';

  const fullVideoUrl = intro?.uuid
    ? `https://ucarecdn.com/${intro.uuid}/`
    : rawUrl;

  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    const src = fullVideoUrl || rawUrl;
    if (!src) return;
    setNeedsInteraction(false);
    setPreviewSrc(src);
  }, [fullVideoUrl, rawUrl]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video || !previewSrc) return;

    video.muted = true;
    video.defaultMuted = true;
    video.src = previewSrc;
    video.load();

    const tryPlay = () => {
      video.play().catch((err) => {
        if (err.name !== 'AbortError') setNeedsInteraction(true);
      });
    };

    const onTimeUpdate = () => {
      if (video.currentTime >= 8) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('canplay', tryPlay, { once: true });
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [previewSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (close === true) {
      video.pause();
      return;
    }
    if (close === false) {
      if (needsInteraction) return;
      const id = setTimeout(() => {
        video.play().catch(() => {});
      }, 0);
      return () => clearTimeout(id);
    }
  }, [close, needsInteraction]);

  const popupVideoRef = useRef(null);
  const [popupNeedsInteraction, setPopupNeedsInteraction] = useState(false);

  const cacheBuster = intro?.updated_at || new Date().getTime();
  const popupVideoUrl = fullVideoUrl
    ? `${fullVideoUrl}${fullVideoUrl.includes('?') ? '&' : '?'}v=${cacheBuster}`
    : '';

  const posterUrl = intro?.poster_url 
    ? `${intro.poster_url}${intro.poster_url.includes('?') ? '&' : '?'}v=${intro.updated_at || new Date().getTime()}` 
    : wishlistbannerimg;

  useEffect(() => {
    const video = popupVideoRef.current;
    if (!video) return;

    if (close === true && popupVideoUrl) {
      setPopupNeedsInteraction(false);
      const id = setTimeout(() => {
        video.muted = true;
        video.defaultMuted = true;
        if (video.src !== popupVideoUrl) {
          video.src = popupVideoUrl;
          video.load();
        }
        video.play().catch((err) => {
          if (err?.name !== 'AbortError') setPopupNeedsInteraction(true);
        });
      }, 0);
      return () => clearTimeout(id);
    }

    if (close === false) {
      setPopupNeedsInteraction(false);
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }, [close, popupVideoUrl]);

  return (
    <div className={`pb-4 ${videoLoading ? 'd-none' : '' } `}>
      {intro ?
        <div className='relative'>

          {/* Video card — rendered as div, NOT inside a button (video inside button = invalid HTML, breaks Edge autoplay) */}
          <div className='relative'>
            {IsloggedIn ? <button onClick={removeVideo} className='!z-2 !py-2 !px-4 rounded-xl bg-red-600 remove-story text-sm text-white'>Remove</button> : ''}

            <div
              className='isintro relative border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] !rounded-[20px] md:!rounded-[30px] cursor-pointer overflow-hidden bg-[#f3f4f6]'
              onClick={() => setClose(true)}
            >
              <div className='absolute top-3 left-3 z-10 bg-white/90 px-3 py-1 rounded-full border-2 border-black text-[10px] font-black uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
                Intro video
              </div>

              <video
                ref={videoRef}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                poster={posterUrl}
                className='w-full object-cover !min-h-[200px] md:!min-h-[250px] lg:!min-h-[300px] max-h-[300px] block'
                onPlaying={() => setNeedsInteraction(false)}
                onPlay={() => setNeedsInteraction(false)}
                onError={() => {
                  const video = videoRef.current;
                  if (!video || previewSrc === rawUrl) return;
                  setPreviewSrc(rawUrl);
                  video.muted = true;
                  video.src = rawUrl;
                  video.load();
                  video.play().catch(() => {});
                }}
              />

              {needsInteraction && (
                <div
                  className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      videoRef.current.play().then(() => setNeedsInteraction(false)).catch(() => {});
                    }
                  }}
                >
                  <div className="bg-white/90 rounded-full p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              )}

              <div className='absolute bottom-4 right-4 z-10 bg-[#F94F97] p-2 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:scale-110 transition-transform'>
                <Maximize size={20} strokeWidth={3} />
              </div>

              {IsloggedIn && intro && intro.approved !== 1 ?
                <div className='text-sm mb-0 alert bg-black text-yellow-400 w-full absolute z-1 bottom-0 left-0 rounded p-2 px-3'>
                  Profile intro video is waiting for approval. Currently only you can see this intro.
                </div>
              : ''}
            </div>
          </div>

          {/* Popup trigger button is hidden — open/close controlled via action prop */}
          <Popup space="0" size="md" action={close} onHide={() => setClose(false)} classes="!hidden" text="">
            <div className='video-payer-pop'>
              <div className="relative w-full">
                <video
                  key={popupVideoUrl}
                  ref={popupVideoRef}
                  // playsInline
                  muted
                  autoPlay
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  preload="metadata"
                  poster={posterUrl}
                  className="w-full h-full"
                  src={popupVideoUrl}
                  onPlay={() => setPopupNeedsInteraction(false)}
                  onPlaying={() => setPopupNeedsInteraction(false)}
                />
                {popupNeedsInteraction && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = popupVideoRef.current;
                      if (!v) return;
                      v.muted = true;
                      v.defaultMuted = true;
                      v.play().then(() => setPopupNeedsInteraction(false)).catch(() => {});
                    }}
                  >
                    <div className="bg-white/90 rounded-full p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </div>
        :
        <>
        { IsloggedIn ?
              <Popup modalclass="pinkmodal sendSurprize-modal shadow-pink" space="6" size="md" action={close} classes={`${classes} w-full`}
                text={text ? text :
                  <div className='cursor-pointer bg-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] !rounded-[20px] md:!rounded-[30px] p-3 py-4 flex items-center justify-content-center' >
                    <div className='py-6'>
                        <div className='svg-icon mx-auto flex justify-center' >
                          <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 24 24" className="stroke-black fill-none group-hover:fill-green-800 group-active:stroke-green-200 group-active:fill-green-600 group-active:duration-0 duration-300"> <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5" ></path> <path d="M8 12H16" strokeWidth="1.5"></path> <path d="M12 16V8" strokeWidth="1.5"></path> </svg>
                        </div>
                        <p className='w-full text-center mt-2 text-lg' >Add Verification Video</p>
                    </div>
                  </div>
                } >
              <div className='wrap' >
                <h2 className="uppercase font-GillSans pb-1 font-large">Add Verification Video</h2>
                <p className='text-muted mb-3' >Add a 15 to 30 sec video to introduce yourself.</p>
                <p className='text-red-600 mb-4' >All videos are reviewed against our terms before being accepted or rejected.</p>
                <div className='my-3' >
                  <GlobalUploader view={true} ctxName='add-intro-context'
                    ref={uploaderRef} type='minimal'
                    sendFile={getFileUID}  imgonly={false}
                    options={st.profileVideo}
                    accept="video/*"
                  />
                </div>
                <LoaderButton onClick={addVideo}
                    disabled={loading}
                    className={`${!msgMedia ? 'disabled' : ''} p w-full`}
                    spinnerclass="fill-red-600" >
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

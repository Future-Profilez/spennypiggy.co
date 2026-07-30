import Popup from '@/Components/Popup'
import GlobalUploader from '@/uploadcare/Uploader'
import st from "../../../css/uploader.module.css";
import { useState } from 'react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import LoaderButton from '@/Components/LoaderButton';
import { useEffect } from 'react';
import wishlistbannerimg from "../../../assets/img/wishlistbannerimg.png";
import { useRef } from 'react';
import { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function AddIntro({IsloggedIn, user, text, classes, setIntroStatus}){

  const [open, setOpen] = useState(false);
  const [loading,setloading] = useState(false);
  const { intro, auth } = usePage().props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [close, setClose] = useState();
  const [clear, setClear] = useState();
  const [msgMedia, setMsgMedia] = useState(null);
  const getFileUID = async (data) => {
    setMsgMedia({
      uuid: data?.uuid,
      url: data?.cdnUrl || data?.originalUrl
    });
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
  const [previewAutoStopped, setPreviewAutoStopped] = useState(false);

  const rawUrl = intro?.perma_link || '';

  const fullVideoUrl = intro?.uuid
    ? `https://ucarecdn.com/${intro.uuid}/`
    : rawUrl;

  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    const src = fullVideoUrl || rawUrl;
    if (!src) return;
    setNeedsInteraction(false);
    setPreviewAutoStopped(false);
    setPreviewSrc(src);
  }, [fullVideoUrl, rawUrl]);


  // NOTE: the intro card no longer autoplays. It shows the poster image only
  // (real video poster -> creator avatar); the actual video loads and plays in
  // the click-through popup below. This stops sitewide Uploadcare bandwidth
  // from intros eagerly downloading/playing on every profile view.

  const popupVideoRef = useRef(null);
  const [popupNeedsInteraction, setPopupNeedsInteraction] = useState(false);

  const cacheVersion = useMemo(
    () => intro?.updated_at || intro?.uuid || `${Date.now()}`,
    [intro?.updated_at, intro?.uuid]
  );
  const popupVideoUrl = fullVideoUrl
    ? `${fullVideoUrl}${fullVideoUrl.includes('?') ? '&' : '?'}v=${cacheVersion}`
    : '';

  const posterUrl = (intro?.poster_url && intro.poster_url !== false)
    ? `${intro.poster_url}${intro.poster_url.includes('?') ? '&' : '?'}v=${cacheVersion}` 
    : (user?.avatar_url || wishlistbannerimg);

  useEffect(() => {
    const video = popupVideoRef.current;
    if (!video) return;

    if (close === true && popupVideoUrl) {
      // No autoplay: load the source + poster and let the viewer press play
      // (native controls or the tap overlay). Keeps intros silent until asked.
      const id = setTimeout(() => {
        if (video.src !== popupVideoUrl) {
          video.src = popupVideoUrl;
          video.load();
        }
        setPopupNeedsInteraction(true);
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

  const [posterLoaded, setPosterLoaded] = useState(false);

  return (
    <div className={`${videoLoading ? 'd-none' : '' } `}>
      {intro ?
        <div className='relative'>

          {/* Intro video — framed like a viewfinder: the creator recording themselves,
              a moment you're invited to press play on. One affordance, one accent. */}
          <style>{`
            @keyframes introBreathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
            @keyframes introRing { 0% { transform: scale(1); opacity:.5 } 100% { transform: scale(1.7); opacity:0 } }
            .intro-frame:hover .intro-poster { transform: scale(1.04) }
            .intro-frame:hover .intro-bracket-tl { transform: translate(4px, 4px) }
            .intro-frame:hover .intro-bracket-tr { transform: translate(-4px, 4px) }
            .intro-frame:hover .intro-bracket-bl { transform: translate(4px, -4px) }
            .intro-frame:hover .intro-bracket-br { transform: translate(-4px, -4px) }
            .intro-frame:hover .intro-play { transform: scale(1.08) }
            @media (prefers-reduced-motion: reduce) {
              .intro-play-pulse, .intro-play-ring { animation: none !important }
              .intro-frame:hover .intro-poster { transform: none }
            }
          `}</style>

          <div
            className="intro-frame group relative cursor-pointer overflow-hidden rounded-box-sm bg-[#0B0B0F] md:rounded-box"
            onClick={() => setClose(true)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${user?.name || "creator"}'s intro video`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setClose(true);
              }
            }}
          >
            {!posterLoaded && (
              <div className="absolute inset-0 z-[5] animate-pulse bg-white/10" />
            )}

            {/* Poster — the frozen frame. Quiet zoom on hover, cheap transform. */}
            <img
              src={posterUrl}
              alt=""
              onLoad={() => setPosterLoaded(true)}
              onError={(e) => {
                const fallback = user?.avatar_url || wishlistbannerimg;
                if (e.target.src !== fallback) e.target.src = fallback;
                setPosterLoaded(true);
              }}
              className="intro-poster block max-h-[340px] w-full object-cover !min-h-[220px] transition-transform duration-[600ms] ease-out md:!min-h-[280px] lg:!min-h-[320px]"
            />

            {/* Cinematic scrim so the label + name read against any frame */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

            {/* Viewfinder brackets — the signature: you're framing a person. Pull in on hover. */}
            <span className="intro-bracket-tl pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-tl-[6px] border-l-2 border-t-2 border-[#FF007F] transition-transform duration-300" />
            <span className="intro-bracket-tr pointer-events-none absolute right-3 top-3 h-6 w-6 rounded-tr-[6px] border-r-2 border-t-2 border-[#FF007F] transition-transform duration-300" />
            <span className="intro-bracket-bl pointer-events-none absolute bottom-3 left-3 h-6 w-6 rounded-bl-[6px] border-b-2 border-l-2 border-[#FF007F] transition-transform duration-300" />
            <span className="intro-bracket-br pointer-events-none absolute bottom-3 right-3 h-6 w-6 rounded-br-[6px] border-b-2 border-r-2 border-[#FF007F] transition-transform duration-300" />

            {/* Top-left label — one, not an eyebrow scaffold */}
            <div className="absolute left-6 top-6 z-10 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/90">
              <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF007F]" />
              Intro
            </div>

            {/* The single invitation — a breathing pink play with an emitted ring */}
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="relative">
                <span className="intro-play-ring intro-play-pulse absolute inset-0 rounded-full bg-[#FF007F]" style={{ animation: "introRing 2.2s ease-out infinite" }} />
                <div
                  className="intro-play intro-play-pulse relative flex h-16 w-16 items-center justify-center rounded-full bg-[#FF007F] text-white shadow-[0_8px_30px_rgba(255,0,127,0.45)] transition-transform duration-300"
                  style={{ animation: "introBreathe 2.6s ease-in-out infinite" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom-left — who this is, and what pressing play gets you */}
            <div className="absolute bottom-5 left-6 z-10">
              <div className="font-gulfs text-lg uppercase leading-none tracking-wide text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]">
                Meet {user?.name}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-white/70">
                A 15-second hello
              </div>
            </div>

            {/* Owner: remove, tucked out of the way */}
            {IsloggedIn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVideo();
                }}
                className="absolute right-5 top-5 z-30 flex h-8 items-center gap-1 rounded-full border border-white/25 bg-black/45 px-3 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                Remove
              </button>
            )}

            {IsloggedIn && intro && intro.approved !== 1 ? (
              <div className="absolute inset-x-0 bottom-0 z-20 bg-black/80 px-6 py-2.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                In review — only you can see this until it's approved.
              </div>
            ) : (
              ""
            )}
          </div>

          {/* Popup trigger button is hidden — open/close controlled via action prop */}
          <Popup space="0" size="md" action={close} onHide={() => setClose(false)} classes="!hidden" text="">
            <div className='video-payer-pop'>
              <div className="relative w-full">
                <video
                  key={popupVideoUrl}
                  ref={popupVideoRef}
                  playsInline
                  controls
                  autoPlay={false}
                  controlsList="nodownload"
                  disablePictureInPicture
                  preload="none"
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
                      v.muted = false;
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
              <Popup modalclass="pinkmodal sendSurprize-modal shadow-[4px_4px_0px_0px_#FF007F]ink" space="6" size="md" action={close} classes={`${classes} w-full`}
                text={text ? text :
                  <div className='cursor-pointer bg-white border-black  !rounded-[20px] md:!rounded-[30px]  p-3 py-4 flex items-center justify-content-center' >
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

import React, { useContext, useEffect, useState } from "react";
import axios from 'axios';
import Gallerybox from "@/includes/Gallerybox";
import Nocontent from "@/includes/Nocontent";

export default function GifterMedia ({username}) {

    const [loading, setLoading] = useState(false);
    const [media, setMedia] = useState([]);

    const fetch_items = async () => {
      setLoading(true);
      axios.get(`/gifter-medias/${username}`)
      .then((resp) => {
          setLoading(false);
          setMedia(resp.data.medias || []);
      }).catch((_err) => {
          console.error("error", _err);
          setLoading(false);
      });
    };
  
    useEffect(()=>{
      fetch_items();
    },[]);

    const [showAll, setShowAll] = useState(false);

    useEffect(()=>{
      console.log("showAll",showAll)
    },[showAll]);

    const MediaGroup = ({item}) => { 
      return <>
        <div onClick={()=>setShowAll(item)} className="w-full md:w-[calc(100%/2-11px)] lg:w-[calc(100%/3-1.2rem)] my-6 md:my-0 cursor-pointer">
            {item && item.reward && item.reward.length > 0 ? <>
                  <div className="h-56 mb-2 overflow-hidden rounded-xl w-full flex gap-2">
                    <div className={`${item?.reward[1] ? 'w-[calc(100%/2-4px)]' : 'w-[100%]'}  h-full bg-gray-200`}>
                        <img src={item?.reward[0]} className="w-full h-full object-cover" alt="" />
                    </div> 
                    {item?.reward[1] ? 
                      <div className="flex flex-col gap-2 w-[calc(100%/2-6px)] h-full">
                          <div className={`w-full ${item?.reward[2] ? 'h-[calc(100%/2-4px)]' : 'h-[100%]' } bg-gray-200`}>
                              <img src={item?.reward[1]} className="w-full h-full object-cover" alt="" />
                          </div> 
                          {item?.reward[2] ? <div className="w-full h-[calc(100%/2-4px)] bg-gray-200">
                              <img src={item?.reward[2]} className="w-full h-full object-cover" alt="" />
                          </div> : ''}
                      </div>
                    : ''} 
                  </div>
                  <h1 className="text-xl font-semibold text-gray-300">{item.name || 'Anonymous'}</h1>
            </> 
            : '' } 
        </div>
      </>
    }

    return (
        <>
          {showAll ? 
          <>
          <div onClick={()=>setShowAll(false)} className="d-flex align-items-center cursor-pointer w-auto align-center mb-4"  >
          <svg width="32" height="29" viewBox="0 0 32 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.40909 13H30.5909C30.9646 13 31.323 13.158 31.5873 13.4393C31.8515 13.7206 32 14.1022 32 14.5C32 14.8978 31.8515 15.2794 31.5873 15.5607C31.323 15.842 30.9646 16 30.5909 16H2.40909C2.03538 16 1.67697 15.842 1.41271 15.5607C1.14846 15.2794 1 14.8978 1 14.5C1 14.1022 1.14846 13.7206 1.41271 13.4393C1.67697 13.158 2.03538 13 2.40909 13Z" fill="white"/>
            <path d="M3.29334 14.5L14.6002 26.5219C14.8562 26.7941 15 27.1634 15 27.5484C15 27.9334 14.8562 28.3026 14.6002 28.5748C14.3442 28.8471 13.997 29 13.635 29C13.273 29 12.9258 28.8471 12.6698 28.5748L0.400508 15.5265C0.273553 15.3918 0.172828 15.2318 0.104102 15.0557C0.0353762 14.8795 0 14.6907 0 14.5C0 14.3093 0.0353762 14.1205 0.104102 13.9443C0.172828 13.7682 0.273553 13.6082 0.400508 13.4735L12.6698 0.425178C12.9258 0.152941 13.273 0 13.635 0C13.997 0 14.3442 0.152941 14.6002 0.425178C14.8562 0.697414 15 1.06665 15 1.45165C15 1.83665 14.8562 2.20588 14.6002 2.47812L3.29334 14.5Z" fill="white"/>
          </svg>
            <h1  className="text-xl font-semibold ps-2 text-gray-300 ">
              {/* {showAll && showAll.name || 'Anonymous'} */} Back
              </h1>
          </div>
            <Gallerybox images={showAll.reward || []} />
          </> 
          : 
          <div className="my-4 md:my-10 flex gap-6 flex-wrap">
            {media && media.length ? media.map((itm, i)=>{ 
                return <MediaGroup item={itm} />
            }) : <Nocontent text="No Posts to see" /> } 
          </div>
          }
        </>
    );
};
 
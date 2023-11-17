import Popup from "@/Components/Popup";
import Loading from "./Loading";
import { useState } from "react";

export default function ContentPrefrences(props){
  const [loader, UpdateLoader] = useState(true);
  return <>
  <Popup
   space='0' modalclass="pinkmodal" size="md"
   text={'Consent Preferences'} classes={`${props.classes} content-pre `}  >
   
      {loader ? <Loading /> : <div className="content-pr-modal" > <iframe onLoad={()=>{UpdateLoader(false)}} src="https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6" > </iframe> </div> }
    
  </Popup>
  </>
}
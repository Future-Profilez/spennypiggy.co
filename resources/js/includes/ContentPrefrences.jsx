import Popup from "@/Components/Popup";
import { useState } from "react";
import LoadingScreen from "./LoadingScreen";

export default function ContentPrefrences(props){
  const [loader, setUpdateLoader] = useState(true);

  return <>
    <Popup space='0' modalclass="pinkmodal" size="md"
    text={'Consent Preferences'} classes={`${props.classes} content-pre `} >
          {/* {loader ?
            <LoadingScreen />  :
            <div className="content-pr-modal" >
              <iframe src="https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6" />
            </div>
          } */}
          {/* <div className="content-pr-modal w-100" >
            <iframe src="https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6" />
          </div>  */}
    </Popup>
  </>
}

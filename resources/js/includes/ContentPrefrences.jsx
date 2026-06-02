import Popup from "@/Components/Popup";
import { useState } from "react";
import LoadingScreen from "./LoadingScreen";

export default function ContentPrefrences(props){
  const [loader, setUpdateLoader] = useState(true);

  return <>
    <Popup space='0' modalclass="pinkmodal" size="md"
    text={'Consent Preferences'} classes={`${props.classes} content-pre `} >
          <div className="content-pr-modal" >
            {/* Local consent preferences content could go here */}
            <p className="p-4 text-center text-gray-600">Consent preferences are managed via your account settings.</p>
          </div>
    </Popup>
  </>
}

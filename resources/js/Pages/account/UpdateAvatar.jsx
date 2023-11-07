import Popup from "@/Components/Popup";
import GlobalUploader from "@/uploadcare/Uploader";
import { useState } from "react";
import st from '../../../css/uploader.module.css'

export default function UpdateAvatar({ getImageUID, text, close }) {

    const [clear, setClear] = useState();

    const getFileUID = async (data) => {
        getImageUID(data);
        setClear(new Date);
    }

    const updateImage = () => {
        getFileUID();
        setClear(new Date);
    }


    return <>
        <Popup action={close} text={text}  >
            <h2 className="updateprofile"  >Update Profile Image</h2>
            <GlobalUploader clear={clear} sendFile={getFileUID} options={st.profileimage} />
            <button onClick={updateImage} className="btn" >Confirm</button>
        </Popup>
    </>
}

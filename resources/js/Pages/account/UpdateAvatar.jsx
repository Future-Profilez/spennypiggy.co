import Popup from "@/Components/Popup";
import GlobalUploader from "@/uploadcare/Uploader";
import { useState } from "react";
import st from '../../../css/uploader.module.css'

export default function UpdateAvatar({getImageUID, text, close, type }) {

    const [clear, setClear] = useState();
    const [ClosePop, setClosePop] = useState(close || null);

    const [file,setFile] = useState();
    const getFileUID = async (data) => {
        setFile(data);
        
    }
    const updateImage = () => {
        getImageUID(file);
        setClear(new Date);
        setClosePop(false);
        setTimeout(()=>{ 
            setClosePop();
        },1000);
    }

    return <>
        <Popup modalclassName="updateavatar" action={ClosePop} text={text}  >
             <div className='editprofileModal  innermodal  '>
                <div className='editprofileModalInner shadow-pink  p-4'>
                    <h2 className="updateprofile" > Update {type == 'cover' ? "Cover":"Profile"} Image </h2>
                    <div className="py-4" >
                        <GlobalUploader clear={clear} sendFile={getFileUID} options={st.profileimage} />
                    </div>
                    <button onClick={updateImage} className="btn-pink sm w-100" >Confirm</button>
                </div>
            </div>
        </Popup>
    </>
}

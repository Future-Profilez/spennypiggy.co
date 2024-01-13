import Popup from "@/Components/Popup";
import GlobalUploader from "@/uploadcare/Uploader";
import { useState } from "react";
import st from '../../../css/uploader.module.css'
import AdultScan from "@/includes/AdultScan";

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
        <Popup modalclassName="updateavatar " action={ClosePop} text={text}  >
             <div className='editprofileModal  innermodal  '>
                <div className='editprofileModalInner  p-4'>
                    <h2 className="updateprofile" > Update {type == 'cover' ? "Cover":"Profile"} Image </h2>
                    <div className="py-4" >
                        <GlobalUploader clear={clear} sendFile={getFileUID} options={st.profileimage} />
                    </div>

                    <AdultScan type={file && file.contentInfo && file.contentInfo.mime && file.contentInfo.mime.type} 
                    fileuid={file && file.uuid}
                    onScan={updateImage} content={<>
                        <button className="btn-pink sm w-100" >Confirm</button>
                    </>} 
                    />
                    
                </div>
            </div>
        </Popup>
    </>
}

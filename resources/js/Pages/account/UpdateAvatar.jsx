import Popup from "@/Components/Popup";
import GlobalUploader from "@/uploadcare/Uploader";
import { useState } from "react";
import st from '../../../css/uploader.module.css'
import AdultScan from "@/includes/AdultScan";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { useEffect } from "react";

export default function UpdateAvatar({getImageUID, text, close, type }) {

    const [clear, setClear] = useState();
    const [ClosePop, setClosePop] = useState(close || null);

    const [isEditable, setIsEditable ] = useState(false);
    const [file,setFile] = useState();
    const getFileUID = async (data) => {
        setFile(data);
        if(data){
            setIsEditable(true);
        }
    }

    const updateFile = async (data) => {
        console.log("updated data", data)
         const tmp = file;
         tmp['cdnUrl'] = data.cdnUrl;
         tmp['cdnUrlModifiers'] = data.cdnUrlModifiers;
         setFile(tmp);
         getImageUID(tmp);
         setIsEditable(false);
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
        <Popup  modalclassName="updateavatar" action={ClosePop} text={text}  >
            <div className='editprofileModal  innermodal  '>
                <div className='editprofileModalInner  p-4'>
                    <h2 className="updateprofile" > Update {type == 'cover' ? "Cover":"Profile"} Image </h2>

                    <div className={`${isEditable ? '' : 'd-none'} editable`} >
                        <UploadcareEditor uuid={file && file.uuid || ''} updateFile={updateFile}  />
                    </div>

                    <div className={`${!isEditable ? '' : 'd-none'} edited`} >
                        <div className="py-4" >
                            <GlobalUploader type='minimal' clear={clear} sendFile={getFileUID} options={st.profileimage} />
                        </div>

                        <AdultScan type={file && file.contentInfo && file.contentInfo.mime && file.contentInfo.mime.type} 
                        fileuid={file && file.uuid}
                        onScan={updateImage} content={<> <button className="btn-pink sm w-100" >Confirm</button> </>} 
                        />
                    </div>
                    
                </div>
            </div>
        </Popup>
    </>
}

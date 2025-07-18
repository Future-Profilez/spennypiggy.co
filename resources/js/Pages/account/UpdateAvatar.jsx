import Popup from "@/Components/Popup";
import GlobalUploader from "@/uploadcare/Uploader";
import { useState } from "react";
import st from '../../../css/uploader.module.css'
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { useRef } from "react";

export default function UpdateAvatar({getImageUID, text, close, type }) {

    const [ClosePop, setClosePop] = useState(close || null);

    const uploaderRef = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
    };

    const [isEditable, setIsEditable ] = useState(false);
    const [file,setFile] = useState();
    const getFileUID = async (data) => {
        setFile(data);
        if(data){
            setIsEditable(true);
        }
    }

    const updateFile = async (data) => {
         const tmp = file;
         tmp['cdnUrl'] = data.cdnUrl;
         tmp['cdnUrlModifiers'] = data.cdnUrlModifiers;
         setFile(tmp);
         getImageUID(tmp);
         setIsEditable(false);
    }

    const updateImage = () => {
        getImageUID(file);
        resetUploader();
        setClosePop(false);
        setTimeout(()=>{ 
            setClosePop();
        },1000);
    }


    return <>
        {/* <Popup  modalclassName="updateavatar p-4" action={ClosePop} text={text}  > */}
            <div className='editprofileModal innermodal  '>
                <div className='editprofileModalInner p-4'>
                    <div className={`${isEditable ? '' : 'd-none'} editable`} >
                        <UploadcareEditor height={'50vh'} uuid={file && file.uuid || ''} updateFile={updateFile}  />
                    </div>
                    <div className={`${!isEditable ? '' : 'd-none'} edited`} >
                        <div className="pb-4" >
                            <GlobalUploader ctxName={`update-${type}`} type='minimal' ref={uploaderRef} sendFile={getFileUID} options={st.profileimage} />
                        </div>
                        <button disabled={!file} onClick={updateImage} className={`${!file ? 'disabled' :''} btn-pink sm w-100`} >Confirm</button>
                    </div>
                    
                </div>
            </div>
        {/* </Popup> */}
    </>
}

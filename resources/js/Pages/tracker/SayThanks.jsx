import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import GlobalUploader from '@/uploadcare/Uploader';
import  axios   from 'axios';
import { useState } from 'react'
import st from "../../../css/uploader.module.css";
import { useEffect } from 'react';
import AdultScan from '@/includes/AdultScan';

export default function SayThanks(props) {
   const { name, payment_id, getMessageStatus, clearAction, approvemsg } = props;

   const uploaderRef = useRef();
   const resetUploader = () => {
       if (uploaderRef.current) {
           uploaderRef.current.reset();
       }
   }; 


   useEffect(()=>{
      setClear(clearAction);
   }, [clearAction]);

   const [msgMedia, setMsgMedia] = useState();
   const getFileUID = (data) => {
      setMsgMedia(data);
   };

   const [close,setClose] = useState();
   const [message,setMessage] = useState();
   const [loading,setloading] = useState(false);
   const { successAlert, errorAlert, errorsHandling } = useAlerts();

   const saythankyou = () => { 
      if(!message){
         errorAlert("Message can not be empty.");
         return false;
      }
      setloading(true);
      axios.post(`say-thankyou/${payment_id}`, {
         "messages":message,
         "message_media": msgMedia ? msgMedia : null
      }).then(resp => {
         if(resp.data.success){
            successAlert(resp.data.message);
            setClose(false);
            setTimeout(()=>{
               setClose();
            },1000);
            getMessageStatus(message, msgMedia);
            resetUploader();
            approvemsg && approvemsg(0);
         } else {
            errorAlert(resp.data.message);
         }
         setloading(false);
      }).catch(_err => {
            console.error("error", _err);
            setloading(false);
      });
   }

   return (
      <>   
      <div className="mb-4 border-t border-gray-200 pt-4 mt-4">
         <h2 className='heading'>Send a thankyou note : </h2>
         <p className='text-red-500 mb-4' >All videos are reviewed against our terms before being accepted or rejected.</p>

         <textarea rows={5} placeholder="Say Something..."
            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
            onChange={(e) => setMessage(e.target.value)} type="text"
         />
         <p className='mb-2 mt-3' >Choose Video or Picture</p>
         <GlobalUploader  type='minimal'
            ref={uploaderRef} ctxName='add-thankyou-context'
            sendFile={getFileUID}
            options={st.thankyoumessage}
         />
      </div>
       
       <AdultScan type={msgMedia && msgMedia.contentInfo && msgMedia.contentInfo.mime && msgMedia.contentInfo.mime.type} 
         fileuid={msgMedia && msgMedia.uuid}
         onScan={saythankyou} content={<>
            <LoaderButton 
               disabled={loading}
               className="p w-auto"
               spinnerclass="fill-red-600" >
               {loading ? "Sending..." : "Say Thanks"}
            </LoaderButton>
         </>} 
         />
      </>
   )
}

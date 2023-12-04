import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import Popup from '@/Components/Popup';
import  axios   from 'axios';
import React from 'react'
import { useState } from 'react'

export default function SayThanks({payment_id}) {

   const [close,setClose] = useState();
   const [message,setMessage] = useState();
   const [loading,setloading] = useState(false);
   const { successAlert, errorAlert, errorsHandling } = useAlerts();

   const saythankyou = () => { 
         setloading(true);
         axios.post(`say-thankyou/${payment_id}`, {
            "messages":message
         }).then(resp => {
           if(resp.data.success){
               successAlert(resp.data.message);
               setClose(false);
               setTimeout(()=>{
                  setClose();
               },1000);
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
         <Popup modalclassName="pinkmodal"
               space="4" size="md" action={close} 
               classes={`btn-pink sm px-2 my-2 w-100`}
               text={`Thanks`} >

               <h2 className="text-uppercase font-GillSans pb-4 font-large">Say Thanks</h2>


               <div className="form-field mb-4">
                  <label className="d-block text-start mb-2">Message..</label>
                  <textarea
                     placeholder="Say Something..."
                     className="form-input w-100 rounded"
                     onChange={(e) => setMessage(e.target.value)}
                     type="text"
                  />
               </div>
               <LoaderButton onClick={saythankyou}
                  disabled={loading}
                  className="flex w-100  btn-pink lg mx-auto"
                  spinnerClassName="fill-red-600" >
                     {loading ? "Sending..." : "Send"}
               </LoaderButton>
         </Popup>
      </>
   )
}

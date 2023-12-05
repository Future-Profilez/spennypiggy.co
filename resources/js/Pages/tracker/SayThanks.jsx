import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
 
import  axios   from 'axios';
import React from 'react'
import { useState } from 'react'

export default function SayThanks(props) {

   const { name, payment_id } = props;
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
         <div className="form-field mb-4 border-top pt-4 mt-4">
            <h2 className='heading'  >Send a thankyou note to {name} :</h2>
            <textarea rows={5} placeholder="Say Something..."
               className="form-input w-100 rounded"
               onChange={(e) => setMessage(e.target.value)} type="text"
            />
         </div>
         <LoaderButton onClick={saythankyou}
            disabled={loading}
            className="flex px-4  mb-3 btn-pink sm mx-auto"
            spinnerClassName="fill-red-600" >
               {loading ? "Sending..." : "Say Thanks"}
         </LoaderButton>
      </>
   )
}

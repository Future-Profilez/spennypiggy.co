import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
export default function PinWish({text, id, fetchingcats}){
   
   const { successAlert, errorAlert } = useAlerts();

   const pin = (e) => {
      if(!id){ 
         return false;
      }
      axios.get(`/pin-item/${id}`).then((resp) => {
         if(resp.data.status){
            successAlert(resp.data.msg);
            fetchingcats && fetchingcats("all")
         }else{
            errorAlert(resp.data.msg)
         }
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button onClick={pin} >{text}</button>
}
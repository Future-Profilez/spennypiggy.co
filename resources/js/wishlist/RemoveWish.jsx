import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
export default function RemoveWish({text, uuid, fetchingcats}){
   
   const { successAlert, errorAlert } = useAlerts();

   const pin = (e) => {
      if(!uuid){ 
         return false;
      }
      axios.get(`/delete-wish-item/${uuid}`).then((resp) => {
         if(resp.data.status){
            successAlert(resp.data.msg);
            fetchingcats && fetchingcats()
         }else{
            errorAlert(resp.data.msg)
         }
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button onClick={pin} >{text}</button>
}
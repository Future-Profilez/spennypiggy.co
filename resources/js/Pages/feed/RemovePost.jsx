import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
export default function RemovePost({text, uuid, updateItems, classes}){
   
   const { successAlert, errorAlert } = useAlerts();
   const pin = (e) => {
      if(!uuid){ 
         return false;
      }
      axios.get(`/post/delete/${uuid}`).then((resp) => {
         if(resp.data.status){
            successAlert(resp.data.msg);
            updateItems && updateItems(new Date())
         }else{
            errorAlert(resp.data.msg)
         }
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button className={classes} onClick={pin} >{text}</button>
}
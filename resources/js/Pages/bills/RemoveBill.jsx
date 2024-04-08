import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
export default function RemoveBill({text, uuid, updateItems, classes}){
   
   const { successAlert, errorAlert } = useAlerts();
   const remove = (e) => {
      if(!uuid){ 
         return false;
      }
      axios.get(`/bill/remove/${uuid}`).then((resp) => {
         if(resp.data.status){
            successAlert(resp.data.msg);
            updateItems && updateItems()
         }else{
            errorAlert(resp.data.msg)
         }
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button className={classes} onClick={remove} >{text}</button>
}
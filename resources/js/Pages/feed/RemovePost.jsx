import { useAlerts } from '@/Components/Alerts';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
export default function RemovePost({text, uuid, updateItems, classes}){
   
   const { successAlert, errorAlert } = useAlerts();
   const { auth } = usePage().props;
   const pin = (e) => {
      if(!uuid){ 
         return false;
      }
      axios.get(`/post/delete/${uuid}`).then((resp) => {
         if(resp.data.status){
            successAlert(resp.data.msg);
            router.visit(route('user.show', { username: auth.user.username, page: 'feed' }), {
               preserveState: true,
               preserveScroll: true,
            });
         }else{
            errorAlert(resp.data.msg)
         }
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button className={classes} onClick={pin} >{text}</button>
}
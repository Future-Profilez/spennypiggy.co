import { useAlerts } from '@/Components/Alerts';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
export default function RemoveWish({text, uuid }){
   
   const { successAlert, errorAlert } = useAlerts();
   const { auth } = usePage().props;

   const pin = (e) => {
      if(!uuid){ 
         return false;
      }
      axios.get(`/delete-wish-item/${uuid}`).then((resp) => {
         if(resp.data.status){
            router.visit(route('user.show', {
                'username': auth?.user?.username || '',
                'page': 'wishes',
            }), {
               method: 'get',
            });
         } else{
            errorAlert(resp.data.msg)
         }
      }).catch((_err) => {
         console.error("error", _err);
      });
   };

   return <button onClick={pin} >{text}</button>
}
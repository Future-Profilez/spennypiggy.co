import { useAlerts } from '@/Components/Alerts';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
export default function RemoveBill({text, uuid,   classes}){

   const { successAlert, errorAlert } = useAlerts();
   const { auth } = usePage().props;
   const remove = (e) => {
      if(!uuid){
         return false;
      }
      axios.get(`/bill/remove/${uuid}`).then((resp) => {
         if(resp.data.status){
            successAlert(resp.data.msg);
            router.visit(route('user.show',
               {
                  username: auth.user.username,
                  page: 'bills',
               }),{
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

   return <button className={classes} onClick={remove} >{text}</button>
}

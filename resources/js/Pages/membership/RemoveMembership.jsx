import { useState } from 'react';
import { useAlerts } from '@/Components/Alerts';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import ConfirmDestructive from '@/Components/ConfirmDestructive';

export default function RemoveMembership({ text, uuid, classes }) {
   const { auth } = usePage().props;
   const { successAlert, errorAlert } = useAlerts();
   const [confirming, setConfirming] = useState(false);
   const [processing, setProcessing] = useState(false);

   const remove = () => {
      if (!uuid || processing) {
         return false;
      }

      setProcessing(true);

      axios.get(`/membership/remove/${uuid}`).then((resp) => {
         if (resp.data.status) {
            successAlert(resp.data.msg);
            setConfirming(false);
            router.visit(route('user.show', { username: auth?.user?.username, page: 'memberships' }), {
               preserveState: true,
               preserveScroll: true,
            });
         } else {
            errorAlert(resp.data.msg);
         }
         setProcessing(false);
      }).catch((_err) => {
         setProcessing(false);
         errorAlert(_err?.response?.data?.msg || "Could not remove this right now. Please try again.");
      });
   };

   return (
      <>
         <button type="button" className={classes} onClick={() => setConfirming(true)}>{text}</button>

         <ConfirmDestructive
            show={confirming}
            title="Remove this membership tier?"
            body="This cancels it for every member currently subscribed and removes it from your profile. This cannot be undone."
            confirmLabel="Remove it"
            processing={processing}
            onConfirm={remove}
            onClose={() => !processing && setConfirming(false)}
         />
      </>
   );
}

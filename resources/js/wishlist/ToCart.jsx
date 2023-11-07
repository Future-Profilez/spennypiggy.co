import { useAlerts } from '@/Components/Alerts';
import { router } from '@inertiajs/react'

export default function ToCart({uuid, text, classes}){

    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const addtocart = (e) => {
        router.post('/add-to-cart/', { "uuid": uuid }, {
            preserveScroll: true,
            onSuccess: (resp) => {
                console.table("resp", resp);
                if (resp.props.flash?.success) {
                    successAlert(resp.props.flash?.success || "Added");
                }
                if (resp.props.flash?.error) {
                    errorAlert(resp.props.flash?.error);
                }
            },
            onError: (_err) => {
                console.table("error", _err);
            }
        });
    };

  return <>
    <button className={classes} onClick={addtocart} >{text}</button>
  </>
}

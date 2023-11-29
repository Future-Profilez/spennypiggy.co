import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Popup from "@/Components/Popup";
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import ToCart from "./ToCart";

export default function SendSurprise({auth, owner}) {
   
   const { format } = PriceFormat();
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const [close, setClose] = useState();
   const { data, setData, post, processing, errors, reset } = useForm({
      amount:  '',
      message: ''
   });
 
   function ItemAdded () {
      setClose(false);
      setTimeout(()=>{
         setClose();
      });
   }
   const sendSurprize = (e) => {
      e.preventDefault();
      if(!data.amount){
         errorAlert("Choose a valid amount.");
         return false;
      }
      post(route(`send-surprize`, {
         "owner_id": owner && owner.id, 
         "amount":data.amount, 
         "message":data.message}), {
            preserveScroll: true,
            onSuccess: (resp) => {
               ItemAdded();
               reset();
               if (resp.props.flash?.success) {
                  successAlert(resp.props.flash?.success || "Added");
            }
            if (resp.props.flash?.error) {
                  errorAlert(resp.props.flash?.error);
            }
            },
            onError: (_err) => {
               console.error(_err);
            }
      });
   };

   

   console.log("surprise owner", auth)

    return (
        <Popup
            modalclassName="pinkmodal sendSurprize-modal"
            space="4" size="md"
            action={close} classes={`btn-pink lg px-4 my-2 w-100`}
            text={`Send Surprise`} >
            <h2 className="text-uppercase font-GillSans pb-4 font-large">
                Send a Surprise Gift
            </h2>
            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2">Amount</label>
                  <input
                     className="form-input w-100 rounded"
                     onChange={(e) => setData('amount', e.target.value)}
                     type="number"
                     placeholder="Enter amount.. "
                  />
                  <p className="mt-1">
                     The amount is set to {format(data.amount)} GBP in the wisher's
                     currency
                  </p>
            </div>
            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2">Suggested use (optional)</label>
                  <textarea
                     placeholder="Message..."
                     className="form-input w-100 rounded"
                     onChange={(e) => setData('message',e.target.value)}
                     type="text"
                  />
            </div>

            <LoaderButton onClick={sendSurprize}
               disabled={processing}
               type='submit'
                  className="flex w-100 btn-pink lg mx-auto"
                  spinnerClassName="fill-red-600" >
                  {processing ? "Proccessing" : auth && auth.name ? "Add to cart" : "Send Gift"}
            </LoaderButton>
            
        </Popup>
    );
}

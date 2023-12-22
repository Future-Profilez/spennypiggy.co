import { useAlerts } from "@/Components/Alerts";
import React from "react";
import  LoaderButton from "@/Components/LoaderButton";
const Popup = React.lazy(() => import('@/Components/Popup'));
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";
import { useForm } from "@inertiajs/react";

export default function AddGoal({auth, owner}) {
   
   const { formatMultiPrice } = PriceFormat();
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const [close, setClose] = useState();
   const { data, setData, post, processing, errors, reset } = useForm({
      amount:  '',
      message: ''
   });

   const sendSurprize = (e) => {
      e.preventDefault();
      post(route(`send-surprize`, {
         "owner_id": owner && owner.id, 
         "message":data.message}), {
            preserveScroll: true,
            onSuccess: (resp) => {
               reset();
               if (resp.props.flash?.success) {
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

    return (
        <Popup
            modalclassName="pinkmodal sendSurprize-modal"
            space="4" size="md"
            action={close} classes={`btn-pink lg px-4 my-2 w-100`}
            text={`Add Goal`} >
            <h2 className="text-uppercase font-GillSans pb-4 font-large">
                Add Goal
            </h2>



            <div className="form-field mb-4">
               <label className="d-block text-start mb-2">Goal Title</label>
               <input
                  className="form-input w-100 rounded"
                  onChange={(e) => setData('title', e.target.value)}
                  type="text" placeholder="Enter title.. "
               />
            </div>


            <div className="form-field mb-4">
               <label className="d-block text-start mb-2">Target Amount</label>
               <input className="form-input w-100 rounded"
                  onChange={(e) => setData('amount', e.target.value)}
                  type="number" placeholder="Enter amount.. "
               />
            </div>
            
            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2">Description</label>
                  <textarea placeholder="Message..."
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
                  {processing ? "Processing" : auth && auth.name ? "Add to cart" : "Send Gift"}
            </LoaderButton>

        </Popup>
    );
}

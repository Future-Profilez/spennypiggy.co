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
      name: '',
      target: '',
      default_price: '',
      description: ''
   }); 

   const addgoal = (e) => {
      e.preventDefault();
      post(route(`add-goal`, data ), {
            preserveScroll: true,
            onSuccess: (resp) => {
               // reset();
               if (resp.props.flash?.success) {
                  successAlert(resp.props.flash?.success);
                  setClose(false);
                  setTimeout(()=>{
                     setClose();
                  },100);
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
            modalclassName="pinkmodal sendSurprize-modal shadow-pink"
            space="4" size="md"
            action={close} classes={`btn-pink mt-3 lg px-4 my-2 w-100`}
            text={`Add Goal`} >
            <h2 className="text-uppercase font-GillSans pb-4 font-large">
                Add Goal
            </h2>

            <div className="form-field mb-4">
               <label className="d-block text-start mb-2">Goal Title</label>
               <input
                  className="form-input w-100 rounded"
                  onChange={(e) => setData('name', e.target.value)}
                  type="text" placeholder="Enter title.. "
               />
            </div>


            <div className="form-field mb-4">
               <label className="d-block text-start mb-2">Target Amount</label>
               <input className="form-input w-100 rounded"
                  onChange={(e) => setData('target', e.target.value)}
                  type="number" placeholder="Enter amount.. "
               />
            </div>

            <div className="form-field mb-4">
               <label className="d-block text-start mb-2">Minimum amount to pay</label>
               <input className="form-input w-100 rounded"
                  onChange={(e) => setData('default_price', e.target.value)}
                  type="number" placeholder="Enter amount.. "
               />
            </div>
            
            <div className="form-field mb-4">
                  <label className="d-block text-start mb-2">Goal Description</label>
                  <textarea placeholder="Description..."
                  className="form-input w-100 rounded"
                  onChange={(e) => setData('description',e.target.value)}
                  type="text" />
            </div>

            <LoaderButton onClick={addgoal}
               disabled={processing}
               type='submit'
                  className="flex w-100 btn-pink lg mx-auto"
                  spinnerClassName="fill-red-600" >
                  {processing ? "Processing" : "Add Goal"}
            </LoaderButton>

        </Popup>
    );
}

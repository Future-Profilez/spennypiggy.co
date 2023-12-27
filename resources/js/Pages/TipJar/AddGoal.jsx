import { useAlerts } from "@/Components/Alerts";
import React, { useEffect } from "react";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm, usePage } from "@inertiajs/react";
const Popup = React.lazy(() => import('@/Components/Popup'));
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";
import ProgressBar from 'react-bootstrap/ProgressBar';

export default function AddGoal({activegoal, fetch_goal}) {
   
   const { global_currency } = usePage().props;
   useEffect(()=>{
      setGoal(activegoal);
   },[activegoal]);

   const [goal, setGoal] = useState();
   const [close, setClose] = useState();
   const [duration, setDuration] = useState(0);
   const { formatMultiPrice } = PriceFormat();
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const { data, setData, post, processing, errors, reset } = useForm({
      name: '',
      target: '',
      default_price: '',
      description: '',
      duration: 0
   }); 

   const addDuration = (event) => {
     const { value } = event.target;
     setDuration(+value);
     setData('duration', +value);
   };

   const addgoal = (e) => {
      e.preventDefault();
      post(route(`add-goal`, data ), {
            preserveScroll: true,
            onSuccess: (resp) => {
               if (resp.props.flash?.success) {
                  successAlert(resp.props.flash?.success);
                  setClose(false);
                  setTimeout(()=>{
                     setClose();
                  },100);
                  fetch_goal && fetch_goal();
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

   const getPercentage = (actual, paid) => {
      const r = (paid/actual)*100;
      return r.toFixed(1);
   }

   const markcomplete = (e) => { 
      e.preventDefault();
      post(route(`mark-goal`, {uuid:goal.uuid}), {
         preserveScroll:true,
         onSuccess: (resp) => {
            if (resp.props.flash?.success) {
               successAlert(resp.props.flash?.success || "Goal marked as completed.");
               setGoal(null);
            }
            if (resp.props.flash?.error) {
               errorAlert(resp.props.flash?.error || "Something went wrong.")
            }
         },
         onError: (_err) => {
            console.error("error", _err);
            setLoading(false);
         }
      });
   } 

    return (
        <Popup
            modalclassName="pinkmodal sendSurprize-modal shadow-pink"
            space="4" size="md"
            action={close} classes={`btn-pink mt-3 lg px-4 my-2 w-100`}
            text={`Add Goal`} >
            {goal ? 
               <div className="updategoal py-2" >
                <div className="activegoal text-center" >
                  <h2 className='text-large font-semibold mb-2'>{goal?.name}</h2>
                  <p className='mb-3 '>{goal?.description || ''}</p>
                  {goal?.days ? <p className='mb-3 text-voilet '>{goal?.days > 1 ? `${goal?.days} Days` : `${goal?.days} Day`} left to goal ends.</p> : ''}
                  <ProgressBar now={goal?.fullfilled} max={goal?.target} />
                  <p className='text-muted mt-2' >{getPercentage(goal?.target, goal?.fullfilled)}% of {formatMultiPrice(goal?.target, goal?.currency)} goal.</p>
                  <LoaderButton 
                  onClick={markcomplete} 
                  disabled={processing}
                     type='submit' className="flex w-100 btn-pink sm mx-auto mt-3 "
                     spinnerClassName="fill-red-600" >
                     {processing ? "Processing" : "Mark as completed"}
                  </LoaderButton>
                </div>
               </div> 
               : 
               <div className="addgoal" >
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
                     <div className="position-relative  currency-wrapper" >
                        <span className="currency-tag">{global_currency || 'GBP'}</span>
                        <input className="form-input w-100 rounded"
                           onChange={(e) => setData('target', e.target.value)}
                           type="number" placeholder="Enter amount.. " />
                     </div>
                  </div>
                  <div className="form-field mb-4">
                     <label className="d-block text-start mb-2">Minimum amount to pay</label>
                     <div className="position-relative currency-wrapper " >
                        <span className="currency-tag">{global_currency || 'GBP'}</span>
                        <input className="form-input w-100 rounded"
                           onChange={(e) => setData('default_price', e.target.value)}
                           type="number" placeholder="Enter minimum amount to pay.. "
                        />
                     </div>
                  </div>
                  <div className="form-field mb-4">
                        <label className="d-block text-start mb-2">Goal Description</label>
                        <textarea placeholder="Description..."
                        className="form-input w-100 rounded"
                        onChange={(e) => setData('description',e.target.value)}
                        type="text" />
                  </div>
                  <p className="font-bold mb-2 " >Goal Duration</p>
                  <div className="time-periods mb-4 ">
                     <div className="repeatpurchase mb-2 text-start">
                        <label className="cursor-pointer text-capitalize" htmlFor={'time-0'}>
                           <input className="cursor-pointer" checked={duration == 0} type="radio" id={"time-0"} value={0} name="category" onChange={addDuration} />
                           Open until achieved
                        </label>
                     </div>
                     <div className="repeatpurchase mb-2 text-start">
                        <label className="cursor-pointer text-capitalize" htmlFor={'time-1'}>
                           <input className="cursor-pointer" checked={duration == 1} type="radio" id={"time-1"} value={1} name="category" onChange={addDuration} />
                           For 30 days
                        </label>
                     </div>
                     <div className="repeatpurchase mb-2 text-start">
                        <label className="cursor-pointer text-capitalize" htmlFor={'time-2'}>
                           <input className="cursor-pointer" checked={duration == 2} type="radio" id={"time-2"} value={2} name="category" onChange={addDuration} />
                           Until mark as compeleted
                        </label>
                     </div>
                  </div>
                  <LoaderButton onClick={addgoal} disabled={processing}
                     type='submit' className="flex w-100 btn-pink lg mx-auto"
                     spinnerClassName="fill-red-600" >
                     {processing ? "Processing" : "Add Goal"}
                  </LoaderButton>
               </div> 
            }
        </Popup>
    );
}

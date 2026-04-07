import { useAlerts } from "@/Components/Alerts";
import { useEffect, lazy } from "react";
import  LoaderButton from "@/Components/LoaderButton";
import { useForm, usePage } from "@inertiajs/react";
const Popup = lazy(() => import('@/Components/Popup'));
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";
import CustomProgressBar from '@/Components/CustomProgressBar';

export default function AddGoal({activegoal, fetch_goal, stripe_enabled}) {
   
   const { global_currency, auth } = usePage().props;
   const defaultCurrency = (auth && auth.user && auth.user.default_currency) || "GBP";

   const [goal, setGoal] = useState();
   const [close, setClose] = useState();
   const [duration, setDuration] = useState(0);
   const { formatMultiPrice } = PriceFormat();
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const { data, setData, post,get, processing, errors, reset } = useForm({
      name: 'My Piggy Bank',
      target: '',
      description: '',
   }); 

   const [aprice, setaprice] = useState('');
   useEffect(()=>{
      setData("target", aprice );
   },[aprice]);

   useEffect(()=>{
      setGoal(activegoal);
   },[activegoal]);
   
   const addDuration = (event) => {
     const { value } = event.target;
     setDuration(+value);
     setData('duration', +value);
   };

   const addgoal = (e) => {
      e.preventDefault();
      if(stripe_enabled == 1){
      } else {
         errorAlert("You can not add goal without adding your stripe account.");
         return false;
      }

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
      return r.toFixed(2);
   }

   const markcomplete = (e) => { 
      e.preventDefault();
      get(route(`mark-goal`, {uuid:goal.uuid}), {
         preserveScroll:true,
         onSuccess: (resp) => {
            if (resp.props.flash?.success) {
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
            modalclass="pinkmodal sendSurprize-modal shadow-pink"
            space="4" size="md"
            action={close} classes={`btn-pink  text-xs lg px-4 my-2 w-full`}
            text={goal ? `My Goal` : `Add Goal`} >
            {goal ? 
               <div className="updategoal py-2" >
                <div className="activegoal text-center" >
                  <h2 className='text-lg font-semibold mb-2'>{goal?.name}</h2>
                  <p className='mb-3 '>{goal?.description || ''}</p>
                  {goal?.days ? <p className='mb-3 text-violet-600 '>{goal?.days > 1 ? `${goal?.days} Days` : `${goal?.days} Day`} left to goal ends.</p> : ''}
                  <CustomProgressBar now={goal?.fullfilled} max={goal?.target} />
                  <p className='text-gray-500 mt-2' >{getPercentage(goal?.target, goal?.fullfilled)}% of {formatMultiPrice(goal?.target, goal?.currency)} goal.</p>
                  <LoaderButton 
                  onClick={markcomplete} 
                  disabled={processing}
                     type='submit' className="p w-full "
                     spinnerclass="fill-red-600" >
                     {processing ? "Processing" : "Mark as completed"}
                  </LoaderButton>
                </div>
               </div> 
               : 
               <div className="addgoal" >
                  <h2 className="uppercase font-GillSans pb-4 text-lg">
                  Add Piggy Bank Goal
                  </h2>
                  <div className="mb-4">
                     <label className="block text-left mb-2">Target Amount ({defaultCurrency})</label>
                     <div className="relative  currency-wrapper" >
                        <span className="currency-tag">{defaultCurrency || 'GBP'}</span>
                        <input className="w-full border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-[30px]  shadow-sm"
                           onChange={(e)=>setaprice(e.target.value)}
                           type="number" placeholder="Enter amount.. " />
                     </div>
                     {defaultCurrency !== global_currency && aprice > 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                           ≈ {formatMultiPrice(aprice, defaultCurrency)} ({global_currency})
                        </p>
                     )}
                  </div>
                 
                  <div className="mb-4">
                        <label className="block text-left mb-2">Goal Description</label>
                        <textarea placeholder="Description..."
                        className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                        onChange={(e) => setData('description',e.target.value)}
                        type="text" />
                  </div>
                  
                  <LoaderButton onClick={addgoal} disabled={processing}
                     type='submit' className="p w-full"
                     spinnerclass="fill-red-600" >
                     {processing ? "Processing" : "Add Goal"}
                  </LoaderButton>
               </div> 
            }
        </Popup>
    );
}

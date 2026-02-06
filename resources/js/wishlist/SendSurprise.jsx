import { useAlerts } from "@/Components/Alerts";
import  LoaderButton from "@/Components/LoaderButton";
const Popup = lazy(() => import('@/Components/Popup'));
import PriceFormat from "@/includes/PriceFormat";
import { useState, lazy } from "react";
import { useForm, usePage } from "@inertiajs/react";
import DeviceID from "@/includes/DeviceID";
import { useDispatch, useSelector } from "react-redux";
import { add_to_cart } from "../Pages/redux/UserSlice";

export default function SendSurprise({auth, owner}) {
   
   const { global_currency } = usePage().props;
   const defaultCurrency = (auth && auth.user && auth.user.default_currency) || "GBP";

   const deviceID  = DeviceID();
   const { formatMultiPrice } = PriceFormat();
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const [close, setClose] = useState();
   const { data, setData, post, processing, errors, reset } = useForm({
      amount:  '',
      message: ''
   });
 
    
   const dispatch = useDispatch();
   const cart = useSelector(state => state.data.cart.cart);

   const sendSurprize = (e) => {
      e.preventDefault();
      if(data.amount < 5){
         errorAlert(`Please tip at least ${formatMultiPrice(5)}.`);
         return false;
      }
      if(!data.amount){
         errorAlert("Choose a valid amount.");
         return false;
      }
      if(!data.message){
         errorAlert("Message can not be empty.");
         return false;
      }
      post(route(`send-surprize`, {
         "owner_id": owner && owner.id, 
         "device_id": deviceID, 
         "amount":data.amount, 
         "message":data.message}), {
            preserveScroll: true,
            onSuccess: (resp) => {
               reset();
               if (resp.props.flash?.success) {
                  successAlert(resp.props.flash?.success || "Added");
                  dispatch(add_to_cart(cart+1));
               }
               setClose(false);
               setTimeout(()=>{
                  setClose();
               },1000);
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
            action={close} classes={`btn-pink sm lg px-4  `}
            text={`Support with 3 gold coins`} >
            <h2 className="uppercase font-GillSans pb-4 text-lg">Send a Surprise Gift</h2>
            <div className="mb-4">
                  <label className="block text-left mb-2">Amount</label>
                  <input
                     className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-md"
                     onChange={(e) => setData('amount', e.target.value)}
                     type="number"
                     placeholder="Enter amount.. "
                  />
                  <p className="mt-1">The Minimum amount is set to {formatMultiPrice(owner && owner.min_surprise_amount, defaultCurrency)} in the wisher’s currency.</p>
            </div>
            <div className="mb-4">
                  <label className="block text-left mb-2">Suggested use (Required)</label>
                  <textarea
                     placeholder="Message..."
                     className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-md"
                     onChange={(e) => setData('message',e.target.value)}
                     type="text"
                  />
            </div>
            <LoaderButton onClick={sendSurprize}
               disabled={processing} 
               type='submit' 
               className="p w-full" 
               spinnerClassName="fill-red-600" >
               {processing ? "Processing" : auth && auth.name ? "Add to cart" : "Send Gift"}
            </LoaderButton>
        </Popup>
    );
}

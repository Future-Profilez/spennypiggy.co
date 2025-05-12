import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { isSupported, WebPushClient } from '@magicbell/webpush';
import toast from "react-hot-toast";
import { RiNotificationBadgeFill } from "react-icons/ri";
import axios from "axios";

export default function OldSubscribe() {

   const [open, setOpen] = useState(false);
   const [subscribing, setSubscribing] = useState(false);
   const { auth } = usePage().props;
   const [client, setClient] = useState(null);

   useEffect(() => {
      const isSubscribed = localStorage.getItem('isSubscribed');
      if(window && window.matchMedia('(display-mode: standalone)').matches && auth?.user?.email && isSubscribed !== "true"){
      // if( auth?.user?.email && isSubscribed !== "true"){
         setOpen(true);
      }
   }, [auth?.user?.email]);

   const ReceivePushNotification  = () =>{
      axios.get(`push-notification-switch/1`).then((resp) => {
         console.log("resp", resp);
      }).catch((_err) => {
         console.error("error", _err);
      });
   }

    const subscribe = async () => {
      setSubscribing(true);
      const pushClient = new WebPushClient({
            apiKey: '515ceed31a4ba4c745b165a12e3a523dc9e93db4',
            userEmail: auth && auth.user && auth.user.email,
            serviceWorkerPath: '/service-worker.js',
      });
      setSubscribing(true);
      if (pushClient) {
         try {
            const authToken = await pushClient.getAuthToken();
            const data = await pushClient.subscribe();
            const subscribed = await pushClient.isSubscribed();
            toast.success(subscribed ? "You have been subscribed for push notifications." : "Unfortunately, you are not subscribed for push notifications.");
            setOpen(false);
            localStorage.setItem('isSubscribed', "true");
            ReceivePushNotification();
            if(subscribed){
               setTimeout(() => {
                  axios.get(`/test-push?email=${auth && auth.user && auth.user.email}&title=Welcome%20to%20SpennyPiggy&content=You%20have%20been%20subscribed%20for%20push%20notifications.`).then((resp) => {
                  }).catch((error) => {
                    console.error("error", error);
                  });
               }, 70000);
            }
         } catch (error) {
            toast.error("Unable to subscribe for push notifications. Please try again after some time.", error);
            console.error("Subscription failed:", error);
            localStorage.setItem('isSubscribed', "true");
            setOpen(false);
         }
      }
      setSubscribing(false);
    };

    return (
        <>
         {open &&
         <div className=" w-screen h-screen flex justify-center items-center z-[6000] bg-[#0009] fixed top-0 left-0">
               <div id="toast-interactive" className="relative w-full max-w-xs p-4 text-gray-500 bg-white rounded-[40px] shadow" role="alert">
                  <div className="block">
                     <div className=" m-auto table items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg mb-4">
                           <RiNotificationBadgeFill />
                     </div>
                     <div className="ms-3 text-sm font-normal text-center">
                           <span className="mb-1 text-sm font-semibold mt-6 text-center w-full text-gray-900">Push Notifications</span>
                           <div className="mb-2 text-sm font-normal mb-4 text-center w-full">Get notifications direct to your phone.</div>
                           <div className="flex justify-center">
                              <div>
                              <button
                                 onClick={() => {
                                    if (!subscribing) {
                                       setSubscribing(true);
                                       subscribe();
                                    }
                                 }}
                                 disabled={subscribing}
                                 className={`inline-flex justify-center w-full px-4 py-1.5 font-medium text-center text-white ${
                                    subscribing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                                 } rounded-lg`}
                              >
                                 {subscribing ? "Processing" : "Allow"}
                              </button>
                              </div>
                              {/* <div>
                                 <button onClick={unsub} className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">Deny</button>
                              </div> */}
                           </div>
                     </div>
                     
                  </div>
               </div>
         </div>
         }
        </>
    );
}

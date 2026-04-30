import Popup from '@/Components/Popup'
import { useState } from 'react';
import axios from 'axios';
import { useAlerts } from "@/Components/Alerts";
import { usePage } from '@inertiajs/react';

export default function OrderDetail({classes, text, item, date}) {

   const [close, setClose] = useState(false);
   const [status, setStatus] = useState(item.status || 'pending');
   const [tracking, setTracking] = useState(item.tracking_id || '');
   const [courier, setCourier] = useState(item.courier_name || '');
   const { successAlert, errorAlert } = useAlerts();
   const [loading, setLoading] = useState(false);
   const { auth } = usePage().props;

   const isCreator = auth?.user?.user_type === 'creator';
   const isPhysical = item?.shop?.type === 'physical';

   const updateFulfillment = async () => {
       setLoading(true);
       try {
           const res = await axios.post(`/shop/fulfillment/${item.uuid}`, {
               status,
               tracking_id: tracking,
               courier_name: courier
           });
           if (res.data.status) {
               successAlert(res.data.message);
           }
       } catch (err) {
           errorAlert(err?.response?.data?.message || 'Failed to update');
       }
       setLoading(false);
   };

  return (
      <Popup modalclass='order-detail-modal full' space="4" size='md' action={close}
         text={text || 'open'}
         classes={`${classes ? classes : "px-3 py-2"}`} >
            <div className='p-0' >
               <h2 className='mb-2 pe-5 font-bold text-xl'>{item.name} claimed {item.shop.name}.</h2>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Shop Item</strong>
                  <p>{item.shop.name}</p>
               </div>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Email</strong>
                  <p>{item.email}</p>
               </div>
               {isPhysical && item.shipping_info && (
                  <div className=' border-t pt-2 mt-3'>
                     <strong>Shipping Info</strong>
                     <p className='whitespace-pre-wrap'>{item.shipping_info}</p>
                  </div>
               )}
               <div className=' border-t pt-2 mt-3'>
                  <strong>Order Date</strong>
                  <p>{date}</p>
               </div>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Quantity</strong>
                  <p>{item.quantity || 1}</p>
               </div>
               {!isPhysical && item.shop.reward_file_url && (
                  <div className=' border-t pt-2 mt-3'>
                     <strong>Digital File</strong>
                     <p>
                        <a 
                           href={item.shop.reward_file_url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-pink-600 hover:underline"
                        >
                           Download / View
                        </a>
                     </p>
                  </div>
               )}
               {item.shop.ask_question ? <div className=' border-t pt-2 mt-3'>
                  <strong>Question</strong>
                  <p>{item.shop.ask_question || ""} ?</p>
                  {item.answer ? <p className='text-sm'>Reply : {item.answer || ""}</p> : ''}
                  {item.message ? <p className='text-sm mt-1'>Message : {item.message || ""}</p> : ''}
               </div> : ''}

               {isPhysical && isCreator && (
                   <div className='border-t pt-4 mt-4'>
                       <h3 className='font-bold mb-3'>Fulfillment</h3>
                       <div className='grid gap-3'>
                           <div>
                               <label className='block text-sm mb-1'>Status</label>
                               <select 
                                   value={status} 
                                   onChange={e => setStatus(e.target.value)}
                                   className='w-full rounded-[15px] border-gray-300'
                               >
                                   <option value="pending">Pending</option>
                                   <option value="processing">Processing</option>
                                   <option value="shipped">Shipped</option>
                                   <option value="delivered">Delivered</option>
                               </select>
                           </div>
                           <div>
                               <label className='block text-sm mb-1'>Tracking ID</label>
                               <input 
                                   type="text" 
                                   value={tracking}
                                   onChange={e => setTracking(e.target.value)}
                                   className='w-full rounded-[15px] border-gray-300'
                                   placeholder="e.g. 1Z9999999999999999"
                               />
                           </div>
                           <div>
                               <label className='block text-sm mb-1'>Courier Name</label>
                               <input 
                                   type="text" 
                                   value={courier}
                                   onChange={e => setCourier(e.target.value)}
                                   className='w-full rounded-[15px] border-gray-300'
                                   placeholder="e.g. UPS, FedEx, Royal Mail"
                               />
                           </div>
                           <button 
                               onClick={updateFulfillment}
                               disabled={loading}
                               className='btn-pink w-full mt-2'
                           >
                               {loading ? 'Saving...' : 'Update Fulfillment'}
                           </button>
                       </div>
                   </div>
               )}

               {isPhysical && !isCreator && (
                   <div className='border-t pt-4 mt-4'>
                       <h3 className='font-bold mb-2'>Tracking Information</h3>
                       <div className='bg-gray-50 p-3 rounded-[15px]'>
                           <p><strong>Status:</strong> <span className='capitalize'>{item.status || 'Pending'}</span></p>
                           {item.courier_name && <p><strong>Courier:</strong> {item.courier_name}</p>}
                           {item.tracking_id && <p><strong>Tracking ID:</strong> {item.tracking_id}</p>}
                       </div>
                   </div>
               )}
            </div>
      </Popup>
  )
}

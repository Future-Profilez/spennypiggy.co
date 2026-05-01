import Popup from '@/Components/Popup'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAlerts } from "@/Components/Alerts";
import { usePage } from '@inertiajs/react';

export default function OrderDetail({classes, text, item, date, onSuccess}) {

   const [close, setClose] = useState(false);
   const [status, setStatus] = useState(item.status || 'pending');
   const [tracking, setTracking] = useState(item.tracking_id || '');
   const [courier, setCourier] = useState(item.courier_name || '');
   const [expectedDelivery, setExpectedDelivery] = useState(item.expected_delivery_date || '');
   const [answerText, setAnswerText] = useState('');
   const [submittedAnswer, setSubmittedAnswer] = useState(item.answer || '');
   const { successAlert, errorAlert } = useAlerts();
   const [loading, setLoading] = useState(false);
   const [answerLoading, setAnswerLoading] = useState(false);
   const { auth } = usePage().props;

   useEffect(() => {
       setStatus(item.status || 'pending');
       setTracking(item.tracking_id || '');
       setCourier(item.courier_name || '');
       setExpectedDelivery(item.expected_delivery_date ? item.expected_delivery_date.split('T')[0] : '');
       setSubmittedAnswer(item.answer || '');
   }, [item]);

   const isCreator = auth?.user?.role == 1;
   const isPhysical = item?.shop?.type === 'physical';

   const updateFulfillment = async () => {
       setLoading(true);
       try {
           const res = await axios.post(`/shop/fulfillment/${item.uuid}`, {
               status,
               tracking_id: tracking,
               courier_name: courier,
               expected_delivery_date: expectedDelivery
           });
           if (res.data.status) {
               successAlert(res.data.message);
               setClose(true);
               setTimeout(() => {
                   setClose(false);
                   if (onSuccess) onSuccess();
               }, 100);
           }
       } catch (err) {
           errorAlert(err?.response?.data?.message || 'Failed to update');
       }
       setLoading(false);
   };

   const submitAnswer = async () => {
       if (!answerText.trim()) return;
       setAnswerLoading(true);
       try {
           const res = await axios.post(`/shop/answer-to-payment/${item.id}`, {
               answer: answerText
           });
           if (res.data.status) {
               successAlert(res.data.message);
               setSubmittedAnswer(res.data.answer);
           } else {
               errorAlert(res.data.message);
           }
       } catch (err) {
           errorAlert(err?.response?.data?.message || 'Failed to submit answer');
       }
       setAnswerLoading(false);
   };

  return (
      <Popup modalclass='order-detail-modal full' space="4" size='md' action={close}
         text={text || 'open'}
         classes={`${classes ? classes : "px-3 py-2"}`} >
            <div className='p-0' >
               <div className='flex justify-between items-start mb-4'>
                   <h2 className='mb-2 pe-5 font-bold text-xl'>{item.name} claimed {item.shop.name}.</h2>
                   {isPhysical && (
                       <div className="text-right">
                           {item.status === 'delivered' ? (
                               <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">Completed</span>
                           ) : item.is_delayed ? (
                               <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">Delayed</span>
                           ) : (
                               <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">Funds Reserved</span>
                           )}
                           {isCreator && item.status !== 'delivered' && (
                               <p className="text-[10px] text-gray-500 mt-1 max-w-[150px]">Funds will be added to your payout once marked as delivered.</p>
                           )}
                       </div>
                   )}
               </div>
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
               {isPhysical && item.expected_delivery_date && (
                  <div className=' border-t pt-2 mt-3'>
                     <strong>Expected Delivery Date</strong>
                     <p className='whitespace-pre-wrap'>{item.expected_delivery_date.split('T')[0]}</p>
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
                  
                  {submittedAnswer ? (
                     <p className='text-sm mt-2'>Reply : {submittedAnswer}</p>
                  ) : !isCreator ? (
                     <div className="mt-3">
                         <textarea
                             value={answerText}
                             onChange={(e) => setAnswerText(e.target.value)}
                             placeholder="Write your reply here..."
                             className="w-full rounded-[15px] border-gray-300 text-sm mb-2"
                             rows="3"
                         />
                         <button 
                             onClick={submitAnswer}
                             disabled={answerLoading || !answerText.trim()}
                             className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                         >
                             {answerLoading ? 'Submitting...' : 'Submit Reply'}
                         </button>
                     </div>
                  ) : (
                     <p className='text-sm mt-2 italic text-gray-500'>Waiting for user to reply...</p>
                  )}
                  
                  {item.message ? <p className='text-sm mt-2'>Message : {item.message || ""}</p> : ''}
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
                           <div>
                               <label className='block text-sm mb-1'>Expected Delivery Date</label>
                               <input 
                                   type="date" 
                                   value={expectedDelivery}
                                   onChange={e => setExpectedDelivery(e.target.value)}
                                   className='w-full rounded-[15px] border-gray-300'
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

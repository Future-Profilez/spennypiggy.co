import Popup from '@/Components/Popup'
import { useState } from 'react';
export default function OrderDetail({classes, text, item,date}) {

   const [close, setClose] = useState(false);

  return (
      <Popup modalclassName='order-detail-modal full' space="4" size='md' action={close}
         text={text || 'open'}
         classes={`${classes ? classes : "px-3 py-2"}`} >
            <div className='p-0' >
               <h2 className='mb-2 pe-5 font-bold text-xl'>{item.shop.user.name} claimed {item.shop.name}.</h2>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Shop Item</strong>
                  <p>{item.shop.name}</p>
               </div>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Email</strong>
                  <p>{item.shop.user.email}</p>
               </div>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Order Date</strong>
                  <p>{date}</p>
               </div>
               <div className=' border-t pt-2 mt-3'>
                  <strong>Quantity</strong>
                  <p>1</p>
               </div>
               {item.shop.ask_question ? <div className=' border-t pt-2 mt-3'>
                  <strong>Question</strong>
                  <p>{item.shop.ask_question || ""} ?</p>
                  {item.answer ? <p className='text-sm'>Reply : {item.answer || ""}</p> : ''}
               </div> : ''}
            </div>
      </Popup>
  )
}

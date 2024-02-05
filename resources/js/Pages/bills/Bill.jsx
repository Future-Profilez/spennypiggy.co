import React from 'react';
import { useState } from 'react';
import uploadedimg from '../../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from "@inertiajs/react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddBills from './AddBills';

export default function Bill(props) {
   
  const { format, formatMultiPrice } = PriceFormat();
  const { currency, itm, itemid, auth, IsloggedIn, fetchingcats, categories, setuped, classes, showall, key } = props;

  const { attributes, listeners, isDragging, index, over, setNodeRef, transform, transition } = useSortable({ id: itm && itm.id });
  const style = { 
    transform: CSS.Translate.toString(transform)
  };
  const stylenone = { 
    transform: '',
  };

  const [itemUID, setItemUID] = useState(itemid);
  const [open, setOpen] = useState();
  const openAddtocart = () => {
    setOpen(true);
    setTimeout(()=>{
      setOpen();
    },1000);
  }

  useEffect(()=>{
    if(itemUID == itm.uuid){
      setOpen(true);
    }
  },[itemUID]);

  const getPercentage = (actual, paid) => {
    const r = (paid/actual)*100;
    return r.toFixed(1);
  }

  return <div key={key} style={IsloggedIn ? style : stylenone}  className={`billbox wish-item-box ${classes} ${isDragging ? 'dragging' : ''}`}> 
      <div  className='wishlistcntbox  mb-3 mb-sm-4 whbg relative'>
        <div onClick={openAddtocart} className='wishlistimg cursor-pointer'>
          <LazyLoadImage
          alt={"image"} useIntersectionObserver={true} effect="blur"
          height={193}
          src={itm?.perma_link ? itm?.perma_link : uploadedimg} className=''
          width={243} />
        </div>

        <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
          <div>
            <h4 className={`fon-bold text-dark el2`} >{itm.name}</h4>
            <h5 className='font-CeraGRBold text-dark titleprice'>{formatMultiPrice(itm.price, itm?.currency || 'GBP')}
                <button className='tooltipbtn' >?<p>*just not including service fee.</p></button>
            </h5>
          </div>
          <div className='subscribletag' > Subscribable </div>  
        </div>
        {IsloggedIn ?
        <>
          {/* <div className='movesvg' ref={setNodeRef} {...listeners} {...attributes} >
            <svg fill="#000000" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="m15.46 7-3.2-2.19-.71 1 2.29 1.57H8.62V2.16l1.57 2.29 1-.71L9 .54a1.25 1.25 0 0 0-2 0l-2.22 3.2 1 .71 1.59-2.29v5.22H2.16l2.29-1.57-.71-1L.54 7a1.25 1.25 0 0 0 0 2l3.2 2.19.71-1-2.29-1.57h5.21v5.22l-1.56-2.29-1 .71L7 15.46a1.25 1.25 0 0 0 2.06 0l2.19-3.2-1-.71-1.63 2.29V8.62h5.22l-2.29 1.57.71 1L15.46 9a1.25 1.25 0 0 0 0-2z"></path></g></svg>
          </div>
         <Wishlist currency={currency} setuped={setuped} openPop={open} item={itm} editpop={true} fetchingcats={fetchingcats} categories={categories} />
         */}
         {/* <div className='p-sm-4 p-3 pt-0' >
            <AddBills classes="btn-pink px-2 w-100 sm" text="Update Bill"
            item={itm} isEdit={true} />
          </div> */}
        </>
          : 
          <div className='p-sm-4 p-3 pt-0' >
             <Link method='get'
                href={route('bill.checkout',{uuid: itm.uuid})}
                className='btn-pink sm text-center' >Pay Bill</Link>
          </div>
        } 
        {/* <div className='p-sm-4 p-3 pt-0' >
             <Link method='get'
                href={route('membership.checkout',{uuid: itm.uuid})}
                className='btn-pink sm text-center' >Pay Bill</Link>
          </div> */}
      </div>
    </div>
}

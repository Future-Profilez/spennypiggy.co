import React from 'react';
import { useState } from 'react';
import uploadedimg from '../../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from "@inertiajs/react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const AddBills = React.lazy(() => import('./AddBills'));

export default function Bill(props) {
   
  const { format, formatMultiPrice } = PriceFormat();
  const { itm, itemid, IsloggedIn, classes, key  } = props;
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

  return <>
    <div key={key} style={IsloggedIn ? style : stylenone}  className={` position-relative billbox wish-item-box ${classes} ${isDragging ? 'dragging' : ''}`}> 
      
      
      <div  className='wishlistcntbox  mb-3 mb-sm-4 whbg relative'>
    {IsloggedIn && itm && itm.approved === 0 ?  <div className='approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2 ' >Bill item waiting for approval. Currently only you can see this bill.</div> : ''}
        <div onClick={openAddtocart} className='wishlistimg cursor-pointer'>
          <LazyLoadImage
          alt={"image"} useIntersectionObserver={true} effect="blur"
          height={193}
          src={itm?.perma_link ? itm?.perma_link : uploadedimg} className=''
          width={243} />
        </div>

        <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
          <div>
            <h4 className={`fon-bold text-dark el1 `} >{itm.name}</h4>
            <h5 className='font-CeraGRBold text-dark titleprice'>{formatMultiPrice(itm.price, itm?.currency || 'GBP')}
                <button className='tooltipbtn' >?<p>*just not including service fee.</p></button>
            </h5>
          </div>
          <div className='subscribletag text-capitalize text-small' >  {itm && itm.period || "Monthly"} Subscribable  </div>  
        <p className='text-start text-small mt-3' >Pay bill and gain access to member only posts</p>
        </div>

        <div className='p-sm-3 p-3 pt-0 pt-sm-0' >
            {IsloggedIn ?
                <AddBills fetchBills={props.fetchBills} classes="button  px-2 w-100 sm" text="Update Bill"
                item={itm} isEdit={true} />
              :
            <Link method='get' 
              href={route('bill.checkout',{uuid: itm.uuid})}
              className='btn-pink sm text-center' >Pay Bill</Link>
            } 
          </div>
        
      </div>
    </div>
  </>
}

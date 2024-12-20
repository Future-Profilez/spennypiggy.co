import React from 'react';
import { useState } from 'react';
import uploadedimg from '../../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link, router, usePage } from "@inertiajs/react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const AddBills = React.lazy(() => import('./AddBills'));
import DropdownButton from 'react-bootstrap/DropdownButton';
import RemoveBill from './RemoveBill';

export default function Bill(props) {
  
  const {auth} = usePage().props;
  const { format, formatMultiPrice } = PriceFormat();
  const { itm, itemid, IsloggedIn, classes, key, fetchBills  } = props;
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

  const gotologin = () => { 
    router.visit(`/login?redirect=${`/bill/checkout/${itm.uuid}`}`);
  }

  return <>
    <div key={key} style={IsloggedIn ? style : stylenone}  className={` position-relative billbox wish-item-box ${classes} ${isDragging ? 'dragging' : ''}`}> 
      <div  className='wishlistcntbox  mb-3 mb-sm-4 whbg relative'>
            {IsloggedIn && itm && itm.approved === 0 ?  
              <div className='approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2 ' >
                Bill item waiting for approval. Currently only you can see this bill.</div> 
            : ''}
              
            <div onClick={openAddtocart} className='wishlistimg cursor-pointer'>
              <LazyLoadImage
              alt={"image"} useIntersectionObserver={true} effect="blur"
              height={193}
              src={itm?.perma_link ? itm?.perma_link : uploadedimg} className=''
              width={243} />

              {IsloggedIn ? 
                <DropdownButton
                className='edit-post pe-0 absolute top-5 m-1 right-3 z-1 ' id="dropdown-basic-button"
                title={
                <div className='dots' >
                <span className='bg-dark' ></span>
                <span className='bg-dark' ></span>
                <span className='bg-dark' ></span>
                </div>}>
                        <RemoveBill classes={`px-[18px] py-2 text-start w-full`} updateItems={fetchBills} uuid={itm.uuid} text="Remove Bill" />
                </DropdownButton> 
              : ''} 

            </div>

            <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
              <div>
                <h4 className={`fon-bold text-dark el1 `} >{itm.name}</h4>
                <h5 className='font-CeraGRBold text-dark titleprice'>{formatMultiPrice(itm.price, itm?.currency || 'GBP')}
                    <button className='tooltipbtn' >?<p>*just not including service fee.</p></button>
                </h5>
              </div>
              <div className='subscribletag text-capitalize text-small' >  {itm && itm.period || "Monthly"} Subscribable  </div>  
            <p className='text-start text-xs mt-3' >Pay bill and gain access to member only posts</p>
            </div>

            <div className='p-sm-3 p-3 pt-0 pt-sm-0' >
              {IsloggedIn ?
                  <AddBills fetchBills={props.fetchBills} classes="btn-pink px-2 sm text-center w-100" text="Update Bill"
                  item={itm} isEdit={true} />
                :
                <>
                {
                  auth && auth.user !== null ?
                  <Link method='get' 
                    href={route('bill.checkout',{uuid: itm.uuid})}
                    className='btn-pink px-2 sm text-center' >Pay Bill</Link>
                  :
                  <button  
                     onClick={gotologin}
                    className='btn-pink px-2 sm text-center w-full' >Pay Bill</button>

                }
                </>
              } 
            </div>
        
      </div>
    </div>
  </>
}

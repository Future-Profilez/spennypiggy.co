  import axios   from 'axios';
  import React from 'react'
  import { useState } from 'react';
  import { useEffect } from 'react';
  import { usePage, Link } from '@inertiajs/react';
  import LoadingScreen from '@/includes/LoadingScreen';
  import Nocontent from '@/includes/Nocontent';
import PriceFormat from '@/includes/PriceFormat';
import Membership from './../membership/Membership';

  export default function MembershipLists({username}) {

    const [handleTab, setHandleTab] = useState('memberships');
    const { user, auth } = usePage().props;
    const { formatMultiPrice } = PriceFormat();

    const ITEM = ({itm}) => { 
      return <>
          <div className=' position-relative membership-box shadow-voilet p-0 box overflow-hidden rounded-lg' >
            <div className='membership-head p-0' >
              

              <div className='m-imag rounded-lg ' >
                { handleTab == 'memberships' ?  
                  <img src={itm?.membership?.perma_link || '' } alt='image' className='img-fluid w-100' />
                  : 
                  <img src={itm?.wish_item?.perma_link || '' } alt='image' className='img-fluid w-100' />
                }
              </div>


            </div>
            <div className='p-4' >
              <Link href={`${itm?.owner?.username || ''}`} className="flex items-center w-auto" >
                  <img className="author-img h-[50px] w-[50px] rounded-lg me-2 border border-grey" src={`${itm?.owner?.avatar || ''}`} />
                <div>
                  <p className="authors text-dark mb-0"> <b> {itm?.owner?.name || ''} </b> </p>
                  <p className="authors text-muted text-small">@{itm?.owner?.username || ''}</p>
                </div>
              </Link>
                <p className='pb-1 pt-3 flex justify-between' >
                { handleTab == 'memberships' ? <strong className='text-capitalize' >{itm.membership?.level || ''} Membership</strong> 
                  : 
                  <strong className='text-capitalize'  >{itm.wish_item?.name || ''}</strong>
                }
               </p>
              <ul className='mt-3' >
                <li className='border-top pt-2 pb-2 flex justify-between' ><span>Price</span> <strong>{formatMultiPrice(parseInt((itm && itm.amount)+(itm && itm.tax)), itm && itm.currency)}</strong> </li>
                <li className='border-top pt-2 pb-2 flex justify-between' ><span>Duration</span> <strong>Monthly</strong> </li>
              </ul>
            </div>
          </div>
      </>
    }

    const CATITEM = ({type}) => { 
        const [loading, setLoading] = useState(false);
        const [subs, setsubs] = useState([]);

        const fetch = (signal) => {
          setLoading(true);
          axios.get(`/gifter-${type}/${username}`, {signal}).then((resp) => {
            if(type == 'memberships'){
              setsubs(resp.data.membership || []);
            } else { 
              setsubs(resp.data.subscriptions || []);
            }
            setLoading(false);
          }).catch((_err) => {
            console.error(`${type} error`, _err);
            setLoading(false);
          });
        };

        useEffect(()=>{
          const controller = new AbortController();
          const { signal } = controller;
            fetch(signal);
          return () => controller.abort();
        },[]);

        return <>
          {loading ? <LoadingScreen /> :
          <div className='row pt-8 '>
            {subs && subs.length ? subs.map((item, i)=>{ 
              return <div className='col-xl-3 col-lg-4 col-sm-6 mb-4' >
                <ITEM key={`memberships-${i}`} itm={item} />
              </div> 
            }) : <Nocontent text="Nothing to see" /> }
          </div> }
        </>
    }


    return (
      <>
          <div className='m-auto'>
          <div className='flex justify-content-start items-center' >
            <button onClick={()=>setHandleTab(`memberships`)} className={`${handleTab !== 'memberships' ? 'bg-gray-500 opacity-[0.6]' : 'opacity-[1]' } button  rounded-[20px] mx-1 px-3 text-[11px] text-uppercase `} >Memberships</button>
            <button onClick={()=>setHandleTab('subscriptions')} className={`${handleTab !== 'subscriptions' ? 'bg-gray-500 opacity-[0.6]' : 'opacity-[1]' } button  rounded-[20px] mx-1 px-3 text-[11px] text-uppercase `} >Subscriptions</button>
          </div>
            {handleTab == 'memberships' ? <CATITEM type={handleTab} /> : <CATITEM type={handleTab} /> }
          </div>
      </>
    )
  }
  
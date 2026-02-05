import axios from 'axios';
import { useState, useEffect } from 'react';
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
          <div className=' relative membership-box shadow-violet p-0 box overflow-hidden rounded-lg' >
            <div className='membership-head p-0' >
              

              <div className='m-imag rounded-lg ' >
                { handleTab == 'memberships' ?  
                  <img src={itm?.membership?.perma_link || '' } alt='image' className='max-w-full h-auto w-full' />
                  : 
                  <img src={itm?.wish_item?.perma_link || '' } alt='image' className='max-w-full h-auto w-full' />
                }
              </div>


            </div>
            <div className='p-4' >
              <Link href={`${itm?.owner?.username || ''}`} className="flex items-center w-auto" >
                  <img className="author-img h-[50px] w-[50px] rounded-lg mr-2 border border-gray-200" src={`${itm?.owner?.avatar || ''}`} />
                <div>
                  <p className="authors text-gray-900 mb-0"> <b> {itm?.owner?.name || ''} </b> </p>
                  <p className="authors text-gray-500 text-sm">@{itm?.owner?.username || ''}</p>
                </div>
              </Link>
                <p className='pb-1 pt-3 flex justify-between' >
                { handleTab == 'memberships' ? <strong className='capitalize' >{itm.membership?.level || ''} Membership</strong> 
                  : 
                  <strong className='capitalize'  >{itm.wish_item?.name || ''}</strong>
                }
               </p>
              <ul className='mt-3' >
                <li className='border-t pt-2 pb-2 flex justify-between' ><span>Price</span> <strong>{formatMultiPrice(parseInt((itm && itm.amount)+(itm && itm.tax)), itm && itm.currency)}</strong> </li>
                <li className='border-t pt-2 pb-2 flex justify-between' ><span>Duration</span> <strong>Monthly</strong> </li>
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
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-8 '>
            {subs && subs.length ? subs.map((item, i)=>{ 
              return <div className='mb-4' >
                <ITEM key={`memberships-${i}`} itm={item} />
              </div> 
            }) : <Nocontent text="Nothing to see" /> }
          </div> }
        </>
    }


    return (
      <>
          <div className='m-auto'>
          <div className='flex justify-start items-center' >
            <button onClick={()=>setHandleTab(`memberships`)} className={`${handleTab !== 'memberships' ? 'bg-gray-500 opacity-[0.6]' : 'opacity-[1]' } button  rounded-[20px] mx-1 px-3 text-[11px] uppercase `} >Memberships</button>
            <button onClick={()=>setHandleTab('subscriptions')} className={`${handleTab !== 'subscriptions' ? 'bg-gray-500 opacity-[0.6]' : 'opacity-[1]' } button  rounded-[20px] mx-1 px-3 text-[11px] uppercase `} >Subscriptions</button>
          </div>
            {handleTab == 'memberships' ? <CATITEM type={handleTab} /> : <CATITEM type={handleTab} /> }
          </div>
      </>
    )
  }
  
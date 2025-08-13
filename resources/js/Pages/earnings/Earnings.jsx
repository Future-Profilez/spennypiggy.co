import { Head, usePage  } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import SubcriptionEarnings from './SubcriptionEarnings';
import axios from 'axios';
import { useState } from 'react';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import TopEarnWishes from './TopEarnWishes';
import TopEarnBills from './TopEarnBills';
import TopSupporters from './TopSupporters';
import MonthlyRevenue from './MonthlyRevenue';

export default function Earnings(props) {

  const colors = [ '#F94F96', 'var(--mint)', 'var(--voilet)','var(--yellow)', '#0005', 'var(--mint)',  ]
  const { formatMultiPrice } = PriceFormat();
  const { auth } = usePage().props;

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  const [earnType, setEarnType] = useState('month')
  const handleEarnings = (e) => { 
    setEarnType(e.target.value)
  }

  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/all-data/${earnType}`).then((resp) => {
        setLists(resp.data.earnings);
        setLoading(false);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };


  useEffect(()=>{ 
    fetchingStats();
  },[earnType]);

  const EARNER = ({data, i}) => {
    return  <article className="flex flex-col p-3  bg-white rounded-3xl shadow">
    <header className="flex ">
      <div>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="28" fill={`${colors[i+0]}`}/>
          <path d="M27.5003 16.8333L24.167 22.6666H16.667L20.8337 28.4999L16.667 34.3333H24.167L27.5003 40.1666L30.8337 34.3333H38.3337L34.167 28.4999L38.3337 22.6666H30.8337L27.5003 16.8333Z" fill="white"/>
        </svg>
      </div>
      <div className="flex flex-col text-center flex-1 justify-center self-start">
        <div className="text-sm tracking-tighter capitalize text-neutral-500">
          {earnType} 
        </div>
        <div className="flex  justify-center py-1.5 text-lg font-bold tracking-tight text-emerald-500 uppercase whitespace-nowrap">
          <div className="my-auto">{data.percent}%</div>
        </div>
      </div>
    </header>
    <h2 className="mt-2 text-xs md:text-base tracking-tight uppercase font-bold text-stone-900">{data.title}</h2>
    <p className="mt-1 text-lg md:text-3xl font-bold tracking-tight text-stone-900">{formatMultiPrice((data && data.amount), (auth && auth.user && auth.user.currency || 'gbp'))} </p>
  </article>
  }

  return (
    <Authenticated auth={auth?.user || ''} >
        <Head title={"Seek & Search"} />
        <div className='py-10 md:py-20 bg-black'>
            <div className='containerbox'>
                <div className='flex flex-wrap justify-between items-center' >
                  <div className='max-w-[500px] pe-3' >
                    <h2 className='text-yellow text-uppercase font-GillSans text-[30px] pe-2' >Explore Earnings 💰</h2>
                    <p className='text-white' >This is the earnings section where you can dive into the detail of everything from wishes, bills, subscriptions, memberships, shop sales and the Piggy Bank 🏦.</p>
                  </div>
                  <div>
                    <select className='type-changer mt-4' onChange={handleEarnings} >
                      <option value="month" >Month</option>
                      <option value="week" >Week</option>
                      <option value="today" >Today</option>
                    </select>
                  </div>
                </div> 
            </div>   
        </div>
        <div className='pt-20 howitmain whbg '>
            <div className='containerbox'>
                <div className='md:-mt-[180px] pb-4 md:pb-8 md:pt-12 earnings-grid grid gap-3 
                xl:grid-cols-3 md:grid-cols-3 grid-cols-2' >
                  {lists && lists.map((e, i)=>{
                    return <div  key={`earn-stat-${i}`}>
                      <EARNER data={e} i={i} />
                    </div> 
                  })}
                </div>
              <div className='row' >
                <div className=' col-xl-8 col-lg-12 mb-4' > <MonthlyRevenue /> </div>
                <div className=' col-xl-4 col-lg-6 mb-4' > <TopEarnWishes /> </div>
                <div className=' col-xl-4 col-lg-6 mb-4' > <SubcriptionEarnings /></div>
                <div className=' col-xl-4 col-lg-6 mb-4' > <TopEarnBills /> </div>
                <div className=' col-xl-4 col-lg-6 mb-4' > <TopSupporters /> </div>
              </div>
            </div>  
        </div>
    </Authenticated>
  )
}
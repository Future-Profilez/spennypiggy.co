import { Head, usePage  } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import SubscriptionEarnings from './SubscriptionEarnings';
import axios from 'axios';
import { useState } from 'react';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import TopEarnWishes from './TopEarnWishes';
import TopEarnBills from './TopEarnBills';
import TopSupporters from './TopSupporters';
import MonthlyRevenue from './MonthlyRevenue';
import PaidTask from './PaidTask';
import ReserveWidget from '@/Components/Creator/ReserveWidget';

export default function Earnings(props) {
  const colors = [ '#FF007F', '#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444' ];
  const { formatMultiPrice } = PriceFormat();
  const { auth, global_currency } = usePage().props;

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isChanging, setIsChanging] = useState(false);
  const [earnType, setEarnType] = useState('all');

  const handleEarnings = (type) => { 
    if (type === earnType) return;
    setIsChanging(true);
    setEarnType(type);
  }

  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/all-data/${earnType}`).then((resp) => {
        setLists(resp.data.earnings);
        setLoading(false);
        setTimeout(() => setIsChanging(false), 300);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
        setIsChanging(false);
    });
  };

  useEffect(()=>{ 
    fetchingStats();
  },[earnType]);

  const EARNER = ({data, i}) => {
    const color = colors[i % colors.length];
    
    if (loading || isChanging) {
      return (
        <article className="p-5 bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between h-[120px] animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
            <div className="w-12 h-5 rounded-full bg-gray-50"></div>
          </div>
          <div>
            <div className="w-20 h-2 bg-gray-100 rounded mb-2"></div>
            <div className="w-28 h-6 bg-gray-100 rounded"></div>
          </div>
        </article>
      );
    }

    return <article className="relative overflow-hidden p-5 bg-white rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group flex flex-col justify-between ">
    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-28 h-28 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full pointer-events-none" style={{ backgroundColor: color }}></div>
    
    <header className="flex items-center justify-between mb-2">
      <div className="p-2.5 rounded-xl shadow-sm" style={{ backgroundColor: `${color}15` }}>
        <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="28" fill={color}/>
          <path d="M27.5003 16.8333L24.167 22.6666H16.667L20.8337 28.4999L16.667 34.3333H24.167L27.5003 40.1666L30.8337 34.3333H38.3337L34.167 28.4999L38.3337 22.6666H30.8337L27.5003 16.8333Z" fill="white"/>
        </svg>
      </div>
      {data.percent > 0 && (
        <div className="text-[14px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50 shadow-sm">
          {data.percent}%
        </div>
      )}
    </header>
    <div className="relative z-10">
      <h2 className="text-lg md:text-xl font-bold text-gray-400 uppercase tracking-wider mb-0.5">{data.title}</h2>
      <p className="text-3xl lg:text-3xl font-black text-gray-900 tabular-nums tracking-tight">
        {formatMultiPrice((data && data.amount), (global_currency || 'gbp'))}
      </p>
    </div>
  </article>
  }

  const grossTotal = Array.isArray(lists) ? lists.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) : 0;

  return (
    <Authenticated auth={auth?.user || ''} >
        <Head title="Earnings Dashboard" />
        
        <div className='bg-black pt-10 pb-20 relative border-b border-white/5'>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brandPink/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-brandYellow/5 rounded-full blur-[100px]"></div>
            </div>
            
            <div className='containerbox relative z-10'>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4 backdrop-blur-md">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brandYellow opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brandYellow"></span>
                            </span>
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Live Dashboard</span>
                        </div>
                        <h1 className='text-white font-black text-4xl md:text-5xl tracking-tight mb-2' >
                            Your <span className="text-brandYellow">Earnings</span>
                        </h1>
                        <p className='text-gray-400 text-sm md:text-base' >
                            Track your revenue and celebrate your success across all channels.
                        </p>
                        <div className="mt-4">
                            <a href="/financial/dashboard" className="inline-flex items-center gap-2 text-brandYellow hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider">
                                View Financial Dashboard 
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5l7 7-7 7"></path>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <div className="bg-[#111] p-1 rounded-full border border-white/10 flex items-center shadow-inner">
                            {['today', 'week', 'month', 'all'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleEarnings(type)}
                                    disabled={loading || isChanging}
                                    className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex-1 whitespace-nowrap ${
                                        earnType === type 
                                        ? 'bg-brandYellow text-black shadow-md' 
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {type === 'all' ? 'All Time' : type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Total Earnings Banner */}
                <div className={`relative group transition-all duration-500 ${isChanging ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                    {/* Decorative Background Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-brandPink/20 to-brandYellow/20 rounded-[32px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    
                    <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[28px] p-6 md:p-8 shadow-[4px_4px_0px_0px_#FF007F]xl overflow-hidden">
                        {/* Abstract Background Pattern */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brandYellow/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-brandPink/5 rounded-full blur-3xl"></div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-8 w-full md:w-auto">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brandPink blur-xl opacity-20 animate-pulse"></div>
                                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-brandPink/20 to-brandPink/5 flex items-center justify-center border border-brandPink/30 shadow-inner">
                                        <svg className="w-10 h-10 text-brandPink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em] mb-2">Total Earnings</p>
                                    <div className="flex items-center gap-4">
                                        {loading || isChanging ? (
                                            <div className="h-14 w-64 bg-white/5 rounded-2xl animate-pulse"></div>
                                        ) : (
                                            <h2 className="text-white mt-3 text-3xl md:text-4xl font-black tabular-nums font-poppins tracking-tighter bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent leading-none">
                                                {formatMultiPrice(grossTotal, (global_currency || 'gbp'))}
                                            </h2>
                                        )}
                                        {!loading && !isChanging && (
                                            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-wider">Growth</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Stat Info */}
                            <div className="hidden xl:flex items-center gap-12 pr-4">
                                <div className="h-12 w-px bg-white/10"></div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Streams</p>
                                    <p className="text-white text-2xl font-black tracking-tight">{lists?.length || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Currency</p>
                                    <p className="text-brandYellow text-2xl font-black tracking-tight uppercase">{(global_currency || auth?.user?.default_currency || 'GBP')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>   
        </div>

        <div className='pb-24 bg-[#FAFAFA] min-h-screen pt-10'>
            <div className='containerbox'>
                
                <div className='grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10' >
                  {lists && lists.map((e, i)=>{
                    return <div key={`earn-stat-${i}`}>
                      <EARNER data={e} i={i} />
                    </div> 
                  })}
                </div>
                 <div className='pb-12' >
                        <ReserveWidget />
                    </div>

                <div className='space-y-10' >
                      <div className={`transition-opacity duration-300 ${isChanging ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                          <MonthlyRevenue /> 
                      </div>
                   

                  <div className="relative">
                    <div className="flex items-center gap-4 mb-10">
                      <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight    ">Performance Breakdown</h2>
                      <div className="flex-grow h-[1px] bg-gray-200"></div>
                    </div>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 transition-opacity duration-300 ${isChanging ? 'opacity-50 blur-sm' : 'opacity-100'}`} >
                      <TopEarnWishes currency={props?.global_currency || 'gbp'} earnType={earnType}  />
                      <SubscriptionEarnings auth={auth} earnType={earnType} />
                      <PaidTask auth={auth} earnType={earnType}  />
                      <TopEarnBills earnType={earnType} />
                      <TopSupporters earnType={earnType} />
                    </div>
                  </div>
                </div>
            </div>  
        </div>
    </Authenticated>
  )
}

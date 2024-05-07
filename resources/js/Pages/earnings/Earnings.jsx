import React from 'react'
import { Head  } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import SubcriptionEarnings from './SubcriptionEarnings';
// const JoinUs = React.lazy(() => import('@/Components/JoinUs'));

export default function Earnings(props) {
  const {auth} = props;


  const EARNER = () => {
    return  <article className="flex flex-col px-6 py-7 bg-white rounded-3xl shadow-2xl leading-[150%] max-w-[248px]">
    <header className="flex gap-5">
      <div>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="28" fill="#F94F96"/>
          <path d="M27.5003 16.8333L24.167 22.6666H16.667L20.8337 28.4999L16.667 34.3333H24.167L27.5003 40.1666L30.8337 34.3333H38.3337L34.167 28.4999L38.3337 22.6666H30.8337L27.5003 16.8333Z" fill="white"/>
        </svg>
      </div>
      <div className="flex flex-col flex-1 justify-center self-start">
        <div className="text-sm tracking-tighter text-neutral-500">
          This week
        </div>
        <div className="flex gap-2 py-1.5 text-lg font-bold tracking-tight text-emerald-500 uppercase whitespace-nowrap">
          <div className="my-auto">23%</div>
        </div>
      </div>
    </header>
    <h2 className="mt-2 text-base tracking-tight uppercase font-bold text-stone-900">
      Wishes
    </h2>
    <p className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
      £455.00
    </p>
  </article>
  }
  return (
    <Authenticated auth={auth?.user || ''} >
        <Head title={"Seek & Search"} />
        <div className='py-20 bg-black'>
            <div className='containerbox'>
                <div className='flex justify-between items-center' >
                  <div className='max-w-[500px]' >
                    <h2 className='text-yellow text-uppercase font-GillSans text-[30px]' >Explore Earnings 💰</h2>
                    <p className='text-white' >This is earning section where you can explore all the earning from Wishes, Bills, Membership and Piggy Bank</p>
                  </div>
                  <div><p className='text-white' >Monthly</p></div>
                </div> 
                <div className='-mb-[180px] pt-12 earnings-grid grid gap-3 grid-cols-5' >
                  <EARNER />
                  <EARNER />
                  <EARNER />
                  <EARNER />
                  <EARNER />
                </div>
                 
            </div>  
        </div>
        <div className='pt-20 howitmain whbg pt-[120px]'>
            <div className='containerbox'>

              <div className='row' >
                <div className='col-md-8' > <SubcriptionEarnings /></div>
                <div className='col-md-4' > <SubcriptionEarnings /></div>
                <div className='col-md-4' > <SubcriptionEarnings /></div>
                <div className='col-md-4' > <SubcriptionEarnings /></div>
                <div className='col-md-4' > <SubcriptionEarnings /></div>
              </div>
               
                 
            </div>  
        </div>
    </Authenticated>
  )
}
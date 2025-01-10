import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Collapse from "react-bootstrap/Collapse";
import PriceFormat from '@/includes/PriceFormat';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Nocontent from '@/includes/Nocontent';

export default function TipTracker({auth}) {

   const { formatMultiPrice } = PriceFormat();
   const [goals, setGoals] = useState([]);

   const fetchgoals = () => {
      axios.get(`all-goals`).then(resp => {
         setGoals(resp.data.goals);
      }).catch(_err => {
         console.error("error", _err);
      });
   }

   useEffect(()=>{
      fetchgoals();
   },[]);

   const getPercentage = (actual, paid) => {
      const r = (paid/actual)*100;
      return r.toFixed(2);
   }

   const GoalItem = ({g}) => {
      const [open, setOpen] = useState(false);
      const openState = () => { setOpen(!open) }
      return <>
         <div onClick={openState} className='box shadow-pink rounded-lg mb-4 p-3' >
            <div  aria-controls="example-collapse-text "
            aria-expanded={open} className="cursor-pointer trackbar " >
                  <div className='d-flex tip align-items-center justify-content-between' >
                     <h2 className='text-large mb-2' >{g && g.name}</h2>
                     <div className="angle-icon w-auto">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <g id="SVGRepo_bgCarrier" stroke-width="0"></g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" ></g> <g id="SVGRepo_iconCarrier">{" "}
                              <path d="M12 14.5C11.9015 14.5005 11.8038 14.4813 11.7128 14.4435C11.6218 14.4057 11.5392 14.3501 11.47 14.28L8 10.78C7.90861 10.6391 7.86719 10.4715 7.88238 10.3042C7.89756 10.1369 7.96848 9.97954 8.08376 9.85735C8.19904 9.73515 8.352 9.65519 8.51814 9.63029C8.68428 9.6054 8.85396 9.63699 9 9.72003L12 12.72L15 9.72003C15.146 9.63699 15.3157 9.6054 15.4819 9.63029C15.648 9.65519 15.801 9.73515 15.9162 9.85735C16.0315 9.97954 16.1024 10.1369 16.1176 10.3042C16.1328 10.4715 16.0914 10.6391 16 10.78L12.5 14.28C12.3675 14.4144 12.1886 14.4931 12 14.5Z" fill="#000000" ></path>{" "}
                        </g></svg>
                     </div>
                  </div>
               <div className='goal-stats  d-flex align-items-center justify-content-between' >
                     <h2 className='' >Goal Target : {formatMultiPrice(g && g.target, g.currency)}</h2>
                     {g && g.completed == 1 ?
                        <span className='badge bg-success mt-2 ' >Completed</span>
                     :
                        <p className='text-success mt-2 text-mint font-bold' >{ getPercentage(g.target, g.fullfilled)}% fullfilled</p>
                     }

               </div>
            </div>
            <Collapse in={open} >
                  <div id="example-collapse-text" className=''>
                     <div className='mt-3 pt-3 border-top'>
                     <ProgressBar now={g?.fullfilled} max={g?.target} />
                     <p className='text-muted text-small mt-1 mb-4' >{getPercentage(g?.target, g?.fullfilled)}% of {formatMultiPrice(g?.target, g?.currency)} goal.</p>

                     <div  className='d-flex justify-content-between border-top pt-3 mt-3' >
                        <p className='text-muted  ' >Goal target amount</p>
                        <p className='mb-0' >{formatMultiPrice(g && g.target, g.currency)}</p>
                     </div>

                     <div  className='d-flex justify-content-between border-top pt-3 mt-3' >
                        <p className='text-muted  ' >Minimum price to pay</p>
                        <p className='mb-0' >{formatMultiPrice(g && g.default_price, g.currency)}</p>
                     </div>

                     <div  className='d-flex justify-content-between border-top pt-3 mt-3' >
                        <p className='text-muted ' >Total paid</p>
                        <p className='mb-0' >{formatMultiPrice(g && g.fullfilled, g.currency)}</p>
                     </div>

                     <div  className='d-flex justify-content-between border-top pt-3 mt-3' >
                        <p className='text-muted ' >Goal End</p>
                        <p className='mb-0' >{g?.status == 0 ? "Open Until Acheived" : g?.status == 1 ? `30 Days Period` : "Until marked as completed" }</p>
                     </div>
                     {g && g.complete_at ? <div  className='d-flex justify-content-between border-top pt-3 mt-3' >
                        <p className='text-muted ' >Completed On</p>
                        <p className='mb-0' >{g && g.complete_at}</p>
                     </div> : ''}
                     <p className='text-muted mb-1 mt-3 border-top pt-3 text-small' >Description</p>
                     <p className='mb-2' >{g && g.description}</p>
                     </div>
                  </div>
            </Collapse>
         </div>
      </>
   }
   return (
      <div className='tips mt-4'>
         {goals && goals.map((g, i)=>{
            return <GoalItem g={g} />
         })}
          {goals && goals.length < 1 ?<Nocontent text="nothing to see" /> : ''}
      </div>
  )
}

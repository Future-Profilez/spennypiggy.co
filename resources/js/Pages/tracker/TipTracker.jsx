import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Collapse from "react-bootstrap/Collapse";

export default function TipTracker({auth}) {


   const [goals, setGoals] = useState();
   const fetchgoals = () => {
      axios.get(`all-goals`).then(resp => {
            console.log("resp",resp);
            setGoals(resp.data.goal);
      }).catch(_err => {
            console.error("error", _err);
      });
   }
   useEffect(()=>{
      fetchgoals();
   },[]);


   const [open, setOpen] = useState(false);
   const openState = () => { setOpen(!open) }
   
  return (
    <>

    {goals && goals.map((g, i)=>{
      return <div className='box shadow-pink rounded-lg p-3 ' >
            <div onClick={openState} aria-controls="example-collapse-text"  aria-expanded={open} className="cursor-pointer trackbar " >
               <h2 className='text-large mb-2' >{goals && goals.name}</h2>
            </div>
            <Collapse in={open} >
                  <div id="example-collapse-text">
                  <p className='text-muted mb-1 mt-2 ' >Description</p>
                  <p className='mb-2' >{goals && goals.name}</p> 
                  </div>
            </Collapse>
         </div>
    })}
      
    </>
  )
}

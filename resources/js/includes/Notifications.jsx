import axios from 'axios';
import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import userphoto from "../../assets/img/userphoto.png";
import { TimeFormat } from './TimeFormat';
import { Link } from '@inertiajs/react';

export default function Notifications() {

  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);

  const getNotifications = (e) => {
    axios.get(`/get-notification`).then((resp) => {
        setLists(resp.data && resp.data.notifications);
    }).catch((_err) => {
      console.error("error", _err);
    });
  };

  useEffect(()=>{
    getNotifications();
  },[]);

  

  return (
    <>
    <style>{`
        #toast-notification{position:absolute;width:100% !important;right:0;min-width:410px;}
    `}</style>

    <div className='relative notifications'>
        <div className="relative " >
          <span onClick={()=>setOpen(!open)} className="site-counter text-center d-block m-1 font-normal">
              10
          </span>
          <div onClick={()=>setOpen(!open)} className="p-2 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-mint w-7 h-7"
            viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"
            /></svg>
          </div>
        </div>

        {open ? <div id="toast-notification" className="w-full p-4 text-gray-900 bg-white rounded-xl shadow " role="alert">
            <div className="flex items-center mb-3">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">New notification</span>
                <button type="button" onClick={()=>setOpen(false)} className="ms-auto -mx-1.5 -my-1.5 bg-white justify-center items-center flex-shrink-0 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-notification" aria-label="Close">
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                </button>

               

            </div>

            <div className='notifications-lists' >
              {lists && lists.length ? lists.map((n, i)=>{
                return  <div className={`flex items-start ${n.is_read ? 'read' : 'unread' } my-2 ${ i == lists.length-1 ? '' : "border-gray-200 border-b" } py-3  `}>
                    <div className="relative inline-block shrink-0">
                      <Link href={n.user.username || '/'} >
                        <img className="w-14 h-14 rounded-4 object-cover" src={n?.user?.avatar_url || userphoto } alt="spenny piggy user"/>
                      </Link>
                    </div>
                    <div className="ms-3 text-sm font-normal">
                        <div className="text-md font-semibold text-gray-900 dark:text-white">{n?.user.name || ""}</div>
                        <div className="text-sm font-normal">{n && n.notification}</div> 
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-500"> <TimeFormat dateString={n.created_at} /> </span>   
                    </div>
                </div>
              }) : <p className='text-center text-gray-500' >No New Notifications </p>}
            </div>


        </div> : ""}
    </div>
    </>
  )
}

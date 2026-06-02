import axios from 'axios';
import { useEffect } from 'react';
import { useState } from 'react'
import userphoto from "../../assets/siteicon.png";
import { TimeFormat } from './TimeFormat';
import { Link, usePage } from '@inertiajs/react';
import { useRef } from 'react';

export default function Notifications() {


  const {  notification_count } = usePage().props;
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(notification_count);
  const [loading, setLoading] = useState(false);

  // useEffect(()=>{
  //   if(open){
  //     document.body.classList.add('overflow-hidden');
  //   } else {
  //     document.body.classList.remove('overflow-hidden');
  //   }
  // },[open]);

  const wrapperRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [hasMore, setHasMore] = useState(true);
  const [lists, setLists] = useState([]);
  const [page, setPage] = useState(1);

  const getNotifications = (e) => {
    axios.get(`/get-notification`).then((resp) => {
        setLists(resp.data && resp.data.notifications);
        if((resp.data && resp.data.current_page ) == (resp.data && resp.data.last_page)){
          setHasMore(false);
        }
    }).catch((_err) => {
      console.error("error", _err);
    });
  };

  const loadMore = (e) => {
    setLoading(true);
    axios.get(`/get-notification?page=${page+1}`).then((resp) => {
        setLists((prev=>[...prev , ...resp.data && resp.data.notifications]));
        setPage(page+1);
        if((resp.data && resp.data.current_page ) == (resp.data && resp.data.last_page)){
          setHasMore(false);
        }
        setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setLoading(false);
    });
  };

  useEffect(()=>{
    getNotifications();
  },[]);

  const readAll = (e) => {
    axios.get(`/mark-as-read`).then((resp) => {
      getNotifications();
      setCount(0);
    }).catch((_err) => {
      console.error("error", _err);
    });
  };

  const deleteAll = (e) => {
    if (confirm("Are you sure you want to delete all notifications?")) {
      axios.get(`/delete-all-notifications`).then((resp) => {
        getNotifications();
        setCount(0);
      }).catch((_err) => {
        console.error("error", _err);
      });
    }
  };


  return (
    <>
    <style>{`
        #toast-notification{position:absolute;width:100% !important;right:0;min-width:410px;}
    `}</style>

    <div className='relative notifications' ref={wrapperRef} >
        <div className="relative " >
          {count ?
            <span onClick={()=>setOpen(!open)} className="site-counter text-center block m-1 font-normal">
                {count}
            </span>
          : ''}
          <div onClick={()=>setOpen(!open)} className="bg-[#FF007F] cursor-pointer rounded-full w-10 h-10 md:w-12 md:h-12 me-2 md:me-3  flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-white w-5 h-5 md:w-5 md:h-5"
            viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"
            /></svg>
          </div>
        </div>

        {open ? <div id="toast-notification" className="w-full p-4 text-gray-900 bg-white rounded-[30px]   shadow " role="alert">

            <div className='md:hidden flex justify-between mb-3' >
                <button onClick={()=>setOpen(false)} className="items-center flex text-gray-400 hover:text-gray-900 mb-2 " >
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.12069 11.243C5.98936 11.2431 5.85929 11.2173 5.73796 11.167C5.61663 11.1168 5.50643 11.043 5.41369 10.95L1.17169 6.707C0.984222 6.51947 0.878906 6.26516 0.878906 6C0.878906 5.73483 0.984222 5.48053 1.17169 5.293L5.41369 1.05C5.60229 0.867841 5.8549 0.767046 6.11709 0.769325C6.37929 0.771603 6.6301 0.876773 6.81551 1.06218C7.00092 1.24759 7.10609 1.4984 7.10837 1.7606C7.11065 2.02279 7.00985 2.2754 6.82769 2.464L3.29269 6L6.82769 9.536C6.9675 9.67585 7.06271 9.85401 7.10128 10.048C7.13984 10.2419 7.12004 10.443 7.04437 10.6257C6.9687 10.8084 6.84056 10.9645 6.67615 11.0744C6.51174 11.1843 6.31844 11.243 6.12069 11.243Z" fill="#808080"/>
                  </svg> &nbsp; Back
                </button>
                <button onClick={readAll} className="items-center flex text-gray-500 hover:text-gray-900 mb-2 " >
                    Mark all as read
                </button>
                <button onClick={deleteAll} className="items-center flex text-red-500 hover:text-red-700 mb-2 " >
                    Delete all
                </button>
            </div>
            <div className="flex items-center noti-title justify-between ">
                <p className="text-lg font-semibold text-black-900   mb-2">Notifications</p>
                <div className='flex gap-4'>
                    <button onClick={readAll} className="items-center flex text-gray-600 hover:text-gray-900 " >
                        Mark all as read
                    </button>
                    <button onClick={deleteAll} className="items-center flex text-red-500 hover:text-red-700 " >
                        Delete all
                    </button>
                </div>
            </div>

            <div className='notifications-lists' >
              {lists && lists.length ? lists.map((n, i)=>{
                return  <>
                <div className={`flex items-start justify-between ${n && n.is_read ? 'read' : 'unread' } my-2 ${ i == lists.length-1 ? '' : "border-gray-200 border-b" } py-3  `}>
                    <div className='flex' >
                      {n && n.is_read ? "" :
                        <div className="w-2 h-2 bg-indigo-700 rounded-[50%] min-w-2 mt-2 me-2">
                        </div>
                      }
                      <div className="me-3 text-sm font-normal">
                          <div className={` capitalize text-[16px] font-normal ${n && n.is_read ? "text-gray-500" : "text-gray-900" }`}>{n && n.notification}</div>
                          <span className="text-xs font-medium text-blue-600"> <TimeFormat dateString={n && n.created_at} /> </span>
                      </div>
                    </div>
                    <div className="relative inline-block shrink-0">
                      <Link href={n && n.user && n.user.username || '/'} >
                        <img className="w-12 h-12 rounded-[30px]   object-cover" src={ n && n?.user && n?.user?.avatar_url || userphoto } alt="spenny piggy user"/>
                      </Link>
                    </div>
                </div>
                </>
              }) : <p className='text-center text-gray-500' >No new alerts </p>}
             {loading ?  <p className="mx-auto block text-gray-400 hover:text-gray-900 mb-2 " >Loading...</p> :
              <>
                {hasMore ?
                <>
                {lists && lists.length > 0 ? <button onClick={loadMore} className="mx-auto block text-gray-600 hover:text-gray-900 mb-2 " >View More</button> : ''}
                </>
                 : ''}
              </>
             }

            </div>

        </div> : ""}
    </div>
    </>
  )
}

import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopEarnWishes({currency, earnType}) {

  const { formatMultiPrice } = PriceFormat();
  const { auth } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([])
  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/top-wishes/${earnType}`).then((resp) => {
        setLists(resp.data.data);
        setLoading(false);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{
    fetchingStats();
  },[earnType]);

  function WishItem({ item, currency }) {
    return (
      <div className="flex gap-4 justify-between items-center py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 px-2 -mx-2 rounded-xl transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img 
              src={item.media || userphoto} 
              alt={item.title} 
              className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:shadow transition-shadow" 
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
              {item.title}
              {item.has_dispute ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">Disputed</span>
              ) : item.has_hold ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">Hold</span>
              ) : null}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-sm font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl">
          {formatMultiPrice((item && item.amount), (currency || 'gbp'))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden h-full">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Top Wishes</h2>
        <span className="bg-yellow-50 text-yellow-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
          Popular
        </span>
      </div>

      <div className="p-6 pt-2">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl" />)}
          </div>
        ) : lists && lists.length ? (
          lists.map((item, index) => (
            <WishItem key={index} item={item} currency={currency} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
               <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
               </svg>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No wishes found</p>
          </div>
        )}
      </div>
    </section>
  );
}

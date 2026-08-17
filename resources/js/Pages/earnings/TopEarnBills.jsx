import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopEarnBills({earnType}) {


  const { formatMultiPrice } = PriceFormat();
  const { auth, global_currency } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([])
  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/top-bill/${earnType}`).then((resp) => {
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

  function BillItem({ item }) {
    return (
      <div className="flex gap-4 justify-between items-center py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50 px-2.5 -mx-2.5 rounded-box-sm transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 border border-gray-100 rounded-box-sm overflow-hidden w-11 h-11 bg-gray-50 flex items-center justify-center">
            <img 
              src={item.media || userphoto} 
              alt={item.title} 
              className="w-full h-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]" 
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <h3 className="text-sm font-bold text-black/80 flex items-center gap-2 min-w-0">
              <span className="truncate" title={item.title}>{item.title}</span>
              {item.has_dispute ? (
                <span className="shrink-0 text-[12px] font-extrabold uppercase tracking-wider bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100/50">Disputed</span>
              ) : item.has_hold ? (
                <span className="shrink-0 text-[12px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full border border-amber-100/50">Hold</span>
              ) : null}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-sm font-extrabold text-black bg-gray-50 px-3 py-1.5 rounded-box-sm whitespace-nowrap border border-gray-100 tabular-nums">
          {formatMultiPrice((item && item.amount), (global_currency || 'gbp'))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-box p-5 md:p-6 border-[3px] border-black overflow-hidden h-full flex flex-col">
      <div className="pb-4 mb-4 flex items-center justify-between gap-3 border-b-2 border-black/10">
        <h2 className="font-gulfs uppercase tracking-[0.1em] text-[13px] text-black">Top Bills</h2>
        <span className="border-2 border-black rounded-box-xs px-2.5 py-1 font-gulfs uppercase tracking-[0.08em] text-[11px] leading-none text-black">
          Essential
        </span>
      </div>

      <div className="flex-grow">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-box-sm border border-gray-100" />)}
          </div>
        ) : lists && lists.length ? (
          lists.map((item, index) => (
            <BillItem key={index} item={item} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-black text-black/60 uppercase tracking-widest">No bills found</p>
          </div>
        )}
      </div>
    </section>
  );
}
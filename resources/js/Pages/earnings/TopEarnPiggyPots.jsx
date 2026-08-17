import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopEarnPiggyPots({currency, earnType}) {

  const { formatMultiPrice } = PriceFormat();
  const { auth } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([])
  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/top-piggy-bank/${earnType}`).then((resp) => {
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

  function PiggyPotItem({ item, currency }) {
    return (
      <div className="flex gap-4 justify-between items-center py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50 px-2.5 -mx-2.5 rounded-box-sm transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 border border-gray-100 rounded-box-sm overflow-hidden w-11 h-11 bg-emerald-50 flex items-center justify-center text-xl">
            <img 
              src={item.media || userphoto} 
              alt={item.name} 
              className="w-full h-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]" 
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <h3 className="text-sm font-bold text-black/80 flex items-center gap-2 min-w-0">
              <span className="truncate" title={item.name}>{item.name}</span>
              {item.has_dispute ? (
                <span className="shrink-0 text-[12px] font-extrabold uppercase tracking-wider bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100/50">Disputed</span>
              ) : item.has_hold ? (
                <span className="shrink-0 text-[12px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full border border-amber-100/50">Hold</span>
              ) : null}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-sm font-extrabold text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-box-sm whitespace-nowrap border border-emerald-100/55 tabular-nums">
          {formatMultiPrice((item && item.amount), (currency || 'gbp'))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-box p-5 md:p-6 border-[3px] border-black overflow-hidden h-full flex flex-col">
      <div className="pb-4 mb-4 flex items-center justify-between gap-3 border-b-2 border-black/10">
        <h2 className="font-gulfs uppercase tracking-[0.1em] text-[13px] text-black">Top Piggy Pots</h2>
        <span className="border-2 border-black rounded-box-xs px-2.5 py-1 font-gulfs uppercase tracking-[0.08em] text-[11px] leading-none text-black">
          Funding
        </span>
      </div>

      <div className="flex-grow">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-box-sm border border-gray-100" />)}
          </div>
        ) : lists && lists.length ? (
          lists.map((item, index) => (
            <PiggyPotItem key={index} item={item} currency={currency} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
               🐷
            </div>
            <p className="text-xs font-black text-black/60 uppercase tracking-widest">No piggy pots found</p>
          </div>
        )}
      </div>
    </section>
  );
}

import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopEarnMemberships({currency, earnType}) {

  const { formatMultiPrice } = PriceFormat();
  const { auth } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([])
  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/top-memberships/${earnType}`).then((resp) => {
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

  function MembershipItem({ item, currency }) {
    return (
      <div className="flex gap-4 justify-between items-center py-3 border-b-2 border-black last:border-0 group hover:bg-gray-100 px-2 -mx-2 rounded-[16px] transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 border-2 border-black rounded-[8px] overflow-hidden w-10 h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-purple-100 flex items-center justify-center text-xl">
            👑
          </div>
          <div className="min-w-0 flex flex-col">
            <h3 className="text-sm font-black text-black truncate flex items-center gap-2 uppercase">
              {item.title}
              {item.has_dispute ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Disputed</span>
              ) : item.has_hold ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Hold</span>
              ) : null}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-sm font-black text-black bg-white px-3 py-1.5 rounded-[12px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {formatMultiPrice((item && item.amount), (currency || 'gbp'))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-[30px]  p-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
      <div className="pb-4 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-black">Top Memberships</h2>
        <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          Recurring
        </span>
      </div>

      <div className="flex-grow">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl border-2 border-gray-300" />)}
          </div>
        ) : lists && lists.length ? (
          lists.map((item, index) => (
            <MembershipItem key={index} item={item} currency={currency} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-4 text-2xl">
               👑
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">No memberships found</p>
          </div>
        )}
      </div>
    </section>
  );
}

import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopSupporters({earnType}) {

  const { formatMultiPrice } = PriceFormat();
  const { auth } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([])
  const fetchingStats = () => {
    setLoading(true); 
    axios.get(`/earnings/top-supporters/${earnType}`).then((resp) => {
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

  function SupporterItem({ item }) {
    return (
      <div className="flex gap-4 justify-between items-center py-3 border-b-2 border-black last:border-0 group hover:bg-gray-100 px-2 -mx-2 rounded-[16px] transition-colors">
        <Link href={`/${item.username}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0 border-2 border-black rounded-full overflow-hidden w-10 h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-voilet/10">
            <img 
              src={item.media || userphoto} 
              alt={item.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <h3 className="text-sm font-black text-black truncate flex items-center gap-2">
              {item.name}
              {item.has_dispute ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Disputed</span>
              ) : item.has_hold ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Hold</span>
              ) : null}
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">@{item.username}</p>
          </div>
        </Link>
        <div className="shrink-0 text-sm font-black text-black bg-white px-3 py-1.5 rounded-[12px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {formatMultiPrice((item && item.amount), (auth && auth?.user && auth?.user?.default_currency || 'gbp'))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-[30px] p-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
      <div className="pb-4 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-black">Top Supporters</h2>
        <span className="bg-voilet/10 text-voilet-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          VIP
        </span>
      </div>

      <div className="flex-grow" >
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl border-2 border-gray-300" />)}
          </div>
        ) : lists && lists.length ? (
          lists.map((item, index) => (
            <SupporterItem key={index} item={item} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-4 text-2xl">
              ⭐
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">No supporters found</p>
          </div>
        )}
      </div>
    </section>
  );
}
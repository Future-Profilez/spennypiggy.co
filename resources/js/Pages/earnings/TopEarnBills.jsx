import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopEarnBills() {


  const { formatMultiPrice } = PriceFormat();
  const { auth } = usePage().props;

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([])
  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/top-bill`).then((resp) => {
        setLists(resp.data.data);
        setLoading(false);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{ 
    fetchingStats();
  },[]);

  function WishItem({ item }) {
    return (
      <div className="flex gap-5 justify-between py-3  max-w-full border-b border-gray-150 ">
        <div className="flex">
          <div className="image-w pe-3" >
            <img src={item.media || userphoto} alt={`Image of ${item.title}`} className="shrink-0 w-12 h-12 rounded-[50%] object-cover aspect-square min-w-12" />
          </div>
          <div className="flex-auto my-auto">{item.title}</div>
        </div>
        <div className="my-auto font-bold"> {formatMultiPrice((item && item.amount), (auth && auth.user && auth.user.currency || 'gbp'))}</div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl shadow lg:min-h-[510px]">
      <h2 className="w-full uppercase p-4 border-b border-gray-200 font-bold">Top Bills </h2>
      <div className="p-4 pt-2" >
        {lists && lists.length ? lists.map((item, index) => <>
          <WishItem key={index} item={item} />
        </>
        ) : <Nocontent mode="clean" classes={'bg-white'} text='Nothing to see' /> }
      </div>
    </section>
  );
}
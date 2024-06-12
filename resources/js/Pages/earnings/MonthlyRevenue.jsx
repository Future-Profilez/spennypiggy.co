import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonthlyRevenue() {

  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState([]);
  const fetchingStats = () => {
    setLoading(true);
    axios.get(`/earnings/graph-data`).then((resp) => {
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


  const data = [
    {
      name: 'Page A',
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: 'Page B',
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: 'Page C',
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: 'Page D',
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: 'Page E',
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: 'Page F',
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: 'Page G',
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];
  
      const [opacity, setOpacity] = React.useState({
      uv: 1,
      pv: 1,
    });
  
    const handleMouseEnter = (o) => {
      const { dataKey } = o;
  
      setOpacity((op) => ({ ...op, [dataKey]: 0.5 }));
    };
  
    const handleMouseLeave = (o) => {
      const { dataKey } = o;
      setOpacity((op) => ({ ...op, [dataKey]: 1 }));
    };


  return (
    <section className="bg-white rounded-3xl shadow lg:min-h-[510px]">
      <h2 className="w-full uppercase p-4 border-b border-gray-200 font-bold">Top Monthly Revenue </h2>

      <div style={{ width: '100%' }} className="p-3 mt-12 flex item-center justify-center ">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            width={500}
            height={300}
            data={lists}
            margin={{
              top: 5,
              right: 30,
              left: 0,
              bottom: 5,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />
            <Line type="monotone" dataKey="Bills"  stroke="var(--mint)" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Memberships"  stroke="var(--voilet)" />
            <Line type="monotone" dataKey="Wishes"  stroke="#bec50f" />
            <Line type="monotone" dataKey="Subscriptions"  stroke="#000000" />
            <Line type="monotone" dataKey="PiggyBank"  stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
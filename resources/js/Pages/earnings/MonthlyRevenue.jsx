import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function MonthlyRevenue() {
    const [loading, setLoading] = useState(false);
    const [lists, setLists] = useState([]);
    const fetchingStats = () => {
        setLoading(true);
        axios
            .get(`/earnings/graph-data`)
            .then((resp) => {
                setLists(resp.data);
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchingStats();
    }, []);

    // console.log("lists:", lists.currency);

    const data = [
        {
            name: "Page A",
            uv: 4000,
            pv: 2400,
            amt: 2400,
        },
        {
            name: "Page B",
            uv: 3000,
            pv: 1398,
            amt: 2210,
        },
        {
            name: "Page C",
            uv: 2000,
            pv: 9800,
            amt: 2290,
        },
        {
            name: "Page D",
            uv: 2780,
            pv: 3908,
            amt: 2000,
        },
        {
            name: "Page E",
            uv: 1890,
            pv: 4800,
            amt: 2181,
        },
        {
            name: "Page F",
            uv: 2390,
            pv: 3800,
            amt: 2500,
        },
        {
            name: "Page G",
            uv: 3490,
            pv: 4300,
            amt: 2100,
        },
    ];

    const [opacity, setOpacity] = useState({
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
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                        Monthly Revenue
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                        Performance Overview ({lists.currency_symbol} {lists.currency?.toUpperCase()})
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['Bills', 'Memberships', 'Wishes', 'PaidTask', 'Piggy_Bank'].map((key) => (
                        <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 
                                key === 'Bills' ? 'var(--mint)' : 
                                key === 'Memberships' ? 'var(--voilet)' : 
                                key === 'Wishes' ? '#bec50f' : 
                                key === 'PaidTask' ? '#000000' : '#82ca9d' 
                            }} />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{key.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 pt-12">
                {loading ? (
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-[24px] animate-pulse">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Analytics...</p>
                    </div>
                ) : (
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={lists?.data}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: -20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Bills"
                                    stroke="var(--mint)"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Memberships"
                                    stroke="var(--voilet)"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Wishes"
                                    stroke="#bec50f"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="PaidTask"
                                    stroke="#000000"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Piggy_Bank"
                                    stroke="#82ca9d"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
}

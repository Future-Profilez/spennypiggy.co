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

/**
 * The income streams this chart draws, and their colours — ONE definition read
 * by both the legend and the lines.
 *
 * 🚨 THREE OF THE EIGHT SERIES THE SERVER RETURNS WERE NEVER DRAWN.
 * `LeaderBoardController::graphData()` answers with Wishes · PaidTask ·
 * Piggy_Bank · Piggy_Pots · Memberships · Bills · Shops · Subscriptions; this
 * chart plotted five of them, so a creator whose income is Piggy Pots, Shop
 * sales or wish subscriptions read a flat chart and reasonably concluded they
 * had earned nothing that month. Any key added to that endpoint's `$labelKey`
 * match must be added here too.
 *
 * ⚠️ The legend used to map its own colours inline with a chain of ternaries
 * while each `<Line>` repeated the hex — two lists that could disagree about
 * which colour meant which product, on the one screen where that matters.
 */
const SERIES = [
    { key: "Bills", label: "Bills", color: "#05EFB8" },
    { key: "Memberships", label: "Memberships", color: "#8C52FF" },
    // ⚠️ Brand yellow #E6EA7B is a 1.4:1 line against white — invisible as a
    // stroke. This is the darker olive the chart already used for it.
    { key: "Wishes", label: "Wishes", color: "#BEC50F" },
    { key: "PaidTask", label: "Paid tasks", color: "#000000" },
    { key: "Piggy_Bank", label: "Piggy bank", color: "#82CA9D" },
    { key: "Piggy_Pots", label: "Piggy pots", color: "#FF007F" },
    { key: "Shops", label: "Shop", color: "#7C838D" },
    { key: "Subscriptions", label: "Subscriptions", color: "#B0764A" },
];

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
        <section className="bg-white rounded-box border-[3px] border-black overflow-hidden">
            <div className="p-5 md:p-6 border-b-[3px] border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="font-gulfs uppercase tracking-tight text-[18px] md:text-[22px] leading-[0.95]">
                        Monthly revenue
                    </h2>
                    <p className="mt-1 text-[12px] text-black/55">
                        {lists.currency_symbol} {lists.currency?.toUpperCase()}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {SERIES.map((s) => (
                        <div key={s.key} className="flex items-center gap-1.5 rounded-box-xs border-2 border-black px-2 py-1">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="font-gulfs uppercase tracking-[0.08em] text-[11px] leading-none">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-5 md:p-6 pt-10">
                {loading ? (
                    <div className="h-[300px] flex items-center justify-center bg-black/[0.04] rounded-box-sm animate-pulse">
                        <p className="font-gulfs uppercase tracking-[0.12em] text-[11px] text-black/50">Loading…</p>
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
                                        
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}
                                />
                                {SERIES.map((s) => (
                                    <Line
                                        key={s.key}
                                        type="monotone"
                                        dataKey={s.key}
                                        stroke={s.color}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
}

// resources/js/Pages/billing/BillChart.jsx
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

export default function BillChart({ data = [], currency = "£" }) {
    const defaultData = [
        { month: "Jan", amount: 0 },
        { month: "Feb", amount: 0 },
        { month: "Mar", amount: 0 },
        { month: "Apr", amount: 0 },
        { month: "May", amount: 0 },
        { month: "Jun", amount: 0 },
    ];

    const chartData = data && data.length > 0 ? data : defaultData;

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => `${currency}${value.toLocaleString()}`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            backgroundColor: '#fff',
                        }}
                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                        formatter={(value) => [`${currency}${value.toLocaleString()}`, 'Bill Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        activeDot={{ r: 6, fill: "rgb(59, 130, 246)", stroke: "#fff", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

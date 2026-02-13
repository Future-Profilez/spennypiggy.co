import { useState, useEffect, useRef } from "react";
import axios from "axios";
import{LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer,Customized,Cross,} from 'recharts';


export default function ChartDashboard() {

    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchdata = () => {
        setLoading(true);
        axios.get(`/membership/graph`)
        .then((res) => {
            setContent(res.data.data);
            setLoading(false);
        })
        .catch((err) => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchdata();
    }, []);

    return (
        <>
            {content && content.length ? 
                <div className="box rounded-[40px]   mb-3 border p-3">
                    <h2 className="text-large font-bold mb-4 pt-2" >Earnings</h2>
                    <ResponsiveContainer width="100%" height={500}>
                    <LineChart
                        width={500}
                        height={300}
                        data={content}
                        margin={{top: 5, right: 5, left: 5, bottom: 5}} >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Amount" stroke="#8884d8" />
                        <Line type="monotone" dataKey="Time" stroke="#82ca9d" />
                    </LineChart>
                    </ResponsiveContainer>
                </div> 
            : ''}
        </>
    );
}

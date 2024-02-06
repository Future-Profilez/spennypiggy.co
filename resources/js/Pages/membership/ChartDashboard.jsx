import { useState, useEffect, useRef } from "react";
import axios from "axios";
// import { Chart } from "chart.js/auto";

export default function ChartDashboard() {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchdata = () => {
        setLoading(true);
        axios
            .get(`/membership/graph`)
            .then((res) => {
                console.log("graph", res);
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

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (content.length > 0) {
            const chartCanvas = chartRef.current.getContext("2d");
            const combinedLabels = content.map((item) => `${item.date} `);
            const totalPayment = content.map((item) => item.sum);
            const maxDataValue = Math.max(...totalPayment);
            const stepSize =
                maxDataValue > 0 ? Math.ceil(maxDataValue / 10) : 2;
            // chartInstance.current = new Chart(chartCanvas, {
            //     type: "line",
            //     data: {
            //         labels: combinedLabels,
            //         datasets: [
            //             {
            //                 label: "Payment",
            //                 data: totalPayment,
            //                 fill: false,
            //                 backgroundColor: "white",
            //                 borderColor: "rgba(34, 79, 255, 0.60)",
            //                 borderWidth: 1,
            //                 showLine: true,
            //             },
            //         ],
            //     },
            //     options: {
            //         scales: {
            //             y: {
            //                 beginAtZero: false,
            //                 min: 0,
            //                 max: maxDataValue,
            //                 stepSize: stepSize,
            //             },
            //         },
            //     },
            // });
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [content]);

    return (
        <>
            <canvas ref={chartRef} style={{ width: "", height: "100px" }} />
        </>
    );
}

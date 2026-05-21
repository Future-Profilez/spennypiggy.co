// resources/js/Pages/billing/BillChart.jsx
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function BillChart({ data = [], currency = "£" }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");

        const chartData = {
            labels: data.map((item) => item.month) || [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
            ],
            datasets: [
                {
                    label: "Bill Revenue",
                    data: data.map((item) => item.amount) || [0, 0, 0, 0, 0, 0],
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "rgb(59, 130, 246)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        };

        chartInstance.current = new Chart(ctx, {
            type: "line",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: "#94a3b8",
                            font: { size: 12 },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${currency}${context.raw.toLocaleString()}`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255, 255, 255, 0.1)" },
                        ticks: {
                            color: "#94a3b8",
                            callback: function (value) {
                                return currency + value.toLocaleString();
                            },
                        },
                    },
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.1)" },
                        ticks: { color: "#94a3b8" },
                    },
                },
            },
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, currency]);

    return (
        <div className="w-full h-[300px]">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}

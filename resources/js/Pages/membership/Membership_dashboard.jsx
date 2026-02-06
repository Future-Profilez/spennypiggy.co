import { Head } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import ChartDashboard from "./ChartDashboard";

export default function Membership_dashboard(props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const fetchdata = () => {
        setLoading(true);
        axios
            .get(`/membership/dashboard`)
            .then((res) => {
                setData(res.data.data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
            });
    };
    useEffect(() => {
        fetchdata();
    }, []);

    const { auth } = props;
    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={"How it works"} />
            {loading ? (
                <>
                    <LoadingScreen />
                </>
            ) : (
                <div className="container mx-auto px-4">
                    <div className="membershipdashboard pb-4">
                        <h2 className="heading text-white mb-4 mt-4">
                            Membership Dashboard
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-black">
                            <div className="w-full">
                                <div className="box dash-stat-block bg-white border border-gray-100 shadow-sm rounded-lg relative w-full ">
                                    <div className="text-lg font-bold text-gray-900 tw-font-cr-medium text-[30px] leading-[40px] membership-animate-number flex items-center justify-center">
                                        {data.members}
                                    </div>
                                    <div className="justify-center text-center text-gray-500 tw-font-cr-regular text-base leading-[25px] mt-4 flex items-center gap-2 m-2">
                                        <svg
                                            className="mr-4 align-sub"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http:www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M10.9498 3.70835C10.5385 2.52035 9.40982 1.66702 8.08182 1.66702C6.40649 1.66035 5.04249 3.01235 5.03516 4.68768V4.70102V6.13235"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M10.622 14.001H5.528C4.132 14.001 3 12.869 3 11.4723V8.61363C3 7.21696 4.132 6.08496 5.528 6.08496H10.622C12.018 6.08496 13.15 7.21696 13.15 8.61363V11.4723C13.15 12.869 12.018 14.001 10.622 14.001Z"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                            <path
                                                d="M8.07552 9.30176V10.7831"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                        </svg>
                                        Member
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="box dash-stat-block bg-gray-50 border border-gray-100 shadow-sm rounded-lg relative w-full">
                                    <div className="text-lg font-bold  text-gray-900 tw-font-cr-medium text-[30px] leading-[40px] flex items-center justify-center">
                                        <span className="tw-font-cr-bold">
                                            £
                                        </span>
                                        <span className="membership-animate-number">
                                            {data.per_month}
                                        </span>
                                    </div>
                                    <div className="justify-center text-center text-gray-500 tw-font-cr-regular text-base leading-[25px] mt-4 flex items-center gap-2 m-2">
                                        <svg
                                            className="mr-4 align-sub"
                                            width="14"
                                            height="16"
                                            viewBox="0 0 14 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M6.51986 12.5C6.60327 12.5 6.65888 12.446 6.65888 12.3523V12.0057C7.45962 11.9574 8.03516 11.5227 8.03516 10.804C8.03516 10.1818 7.63757 9.86932 6.87575 9.69318L6.65888 9.64489V8.64489C6.9258 8.68182 7.10096 8.82102 7.20939 9.05398C7.29836 9.21875 7.41792 9.30114 7.5903 9.30114C7.80161 9.30114 7.94062 9.17898 7.94062 8.99148C7.94062 8.93182 7.9295 8.875 7.91282 8.81818C7.77936 8.38068 7.32061 8.0483 6.65888 8.00284V7.64773C6.65888 7.55398 6.60327 7.5 6.51986 7.5C6.43645 7.5 6.38085 7.55398 6.38085 7.64773V8.00284C5.60513 8.04261 5.04906 8.4858 5.04906 9.17045C5.04906 9.78409 5.44665 10.1165 6.1751 10.2841L6.38085 10.3324V11.3665C6.03052 11.3352 5.85536 11.1733 5.76639 10.9517C5.68854 10.7869 5.57176 10.696 5.39938 10.696C5.17139 10.696 5.03516 10.8352 5.03516 11.0398C5.03516 11.0938 5.04628 11.1534 5.06852 11.2188C5.20476 11.6335 5.6663 11.9716 6.38085 12.0057V12.3523C6.38085 12.446 6.43645 12.5 6.51986 12.5ZM5.82756 9.09659C5.82756 8.86648 6.01662 8.67614 6.38085 8.64205V9.57955C5.9916 9.47727 5.82756 9.3267 5.82756 9.09659ZM7.25944 10.892C7.25944 11.1534 7.05925 11.3352 6.65888 11.3665V10.3977C7.10374 10.5114 7.25944 10.6392 7.25944 10.892Z"
                                                fill="#717171"
                                            ></path>
                                            <path
                                                d="M0.597656 6.26931H12.4803"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                            <path
                                                d="M9.23068 1.33301V3.52686"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                            <path
                                                d="M3.84591 1.33301V3.52686"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M9.36067 2.38574H3.7158C1.75801 2.38574 0.535156 3.47636 0.535156 5.48109V11.5142C0.535156 13.5504 1.75801 14.6663 3.7158 14.6663H9.35449C11.3185 14.6663 12.5351 13.5694 12.5351 11.5646V5.48109C12.5413 3.47636 11.3246 2.38574 9.36067 2.38574Z"
                                                stroke="#717171"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            ></path>
                                        </svg>
                                        Per month
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="box dash-stat-block bg-gray-50 border border-gray-100 shadow-sm rounded-lg relative w-full ">
                                    <div className="text-lg font-bold text-gray-900 tw-font-cr-medium text-[30px] leading-[40px] flex items-center justify-center">
                                        <span className="tw-font-cr-bold">
                                            £
                                        </span>
                                        <span className="membership-animate-number">
                                            {data.all_time}
                                        </span>
                                    </div>
                                    <div className="justify-center text-center text-gray-500 tw-font-cr-regular text-base leading-[25px] mt-4 flex items-center gap-2 m-2">
                                        <svg
                                            className="mr-4 align-sub"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 13 13"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M6.48471 9.5C6.56812 9.5 6.62373 9.43523 6.62373 9.32273V8.90682C7.42447 8.84886 8 8.32727 8 7.46477C8 6.71818 7.60241 6.34318 6.84059 6.13182L6.62373 6.07386V4.87386C6.89064 4.91818 7.0658 5.08523 7.17424 5.36477C7.26321 5.5625 7.38276 5.66136 7.55514 5.66136C7.76645 5.66136 7.90547 5.51477 7.90547 5.28977C7.90547 5.21818 7.89435 5.15 7.87766 5.08182C7.74421 4.55682 7.28545 4.15795 6.62373 4.10341V3.67727C6.62373 3.56477 6.56812 3.5 6.48471 3.5C6.4013 3.5 6.34569 3.56477 6.34569 3.67727V4.10341C5.56997 4.15114 5.0139 4.68295 5.0139 5.50455C5.0139 6.24091 5.41149 6.63977 6.13994 6.84091L6.34569 6.89886V8.13977C5.99537 8.10227 5.8202 7.90795 5.73123 7.64205C5.65338 7.44432 5.53661 7.33523 5.36423 7.33523C5.13624 7.33523 5 7.50227 5 7.74773C5 7.8125 5.01112 7.88409 5.03336 7.9625C5.1696 8.46023 5.63114 8.86591 6.34569 8.90682V9.32273C6.34569 9.43523 6.4013 9.5 6.48471 9.5ZM5.7924 5.41591C5.7924 5.13977 5.98146 4.91136 6.34569 4.87045V5.99545C5.95644 5.87273 5.7924 5.69205 5.7924 5.41591ZM7.22428 7.57045C7.22428 7.88409 7.0241 8.10227 6.62373 8.13977V6.97727C7.06858 7.11364 7.22428 7.26705 7.22428 7.57045Z"
                                                fill="#717171"
                                            ></path>
                                            <circle
                                                cx="6.5"
                                                cy="6.5"
                                                r="5.5"
                                                stroke="#717171"
                                            ></circle>
                                        </svg>{" "}
                                        All-time
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ChartDashboard />
                    </div>
                </div>
            )}
        </Authenticated>
    );
}

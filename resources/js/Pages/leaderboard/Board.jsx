import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
// import userphoto from "../../../assets/siteicon.png";
import userphoto from "../../../assets/siteicon.png";
import Avatar from "@/includes/Avatar";
import axios from "axios";
import { useState, useMemo } from "react";
import { crown } from "@/includes/Icons";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import LeaderboardStars from "./LeaderboardStars";
import RecentSupporters from "./RecentSupporters";
import DeviceID from "@/includes/DeviceID";
import TopSupporters from "./TopSupporters";
import CategoryLeaders from "./CategoryLeaders";
import VipSupporters from "./VipSupporters";
import { trackSearchClick } from "@/includes/Analytics";

export default function Board(props) {
    const { auth, data, is_daily } = props;
    const [positions, setPositions] = useState([]);
    const [ranks, setRanks] = useState([]);

    const filterPositions = (d) => {
        const newData = [...d];
        const positionsData = newData.slice(0, 3);
        const ranksData = newData.slice(3);
        setPositions(positionsData);
        setRanks(ranksData);
    };

    useMemo(() => {
        filterPositions(data);
    }, [data]);

    const [period, setPeriod] = useState("all");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const switchTime = (e) => {
        setPeriod(e);
        setLoading(true);
        setError(null);
        axios
            .get(`leaderboard/${e}`)
            .then((resp) => {
                filterPositions(resp.data.data);
            })
            .catch((_err) => {
                console.error("error", _err);
                setError(`Failed to load ${e} leaderboard. Please try again.`);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const Rank = ({ r }) => {
        return (
            <div className="fading rank py-3 border-b flex items-center justify-between">
            <div className="flex items-center justify-between">
                <div className="sno mr-2 md:mr-4 pl-2">
                    <p className="font-gulfs">#{r && r.rank}</p>
                </div>
                <div className="wisher">
                        <Avatar
                            role={r && r.role}
                            profile_status_lock={r && r.profile_status_lock === 2 ? true : false}
                            name={(r && r.name) || "Anonymous"}
                            link={(r && r.username) || ""}
                            subhead={`@${(r && r.username) || null}`}
                            username={(r && r.username) || null}
                            src={(r && r.avatar) || userphoto}
                            onClick={() => trackSearchClick(r?.id, r?.username)}
                        />
                    </div>
                </div>
                <div className="rank-stats">
                <p className="toppercentage md:pr-4">{r && r.top}%</p>
                {/* Display engagement metrics if available */}
                {r?.supporters > 0 ? (
                    <p className="text-xs text-gray-500 md:pr-4">
                        👥 {r.supporters} Supporters
                    </p>
                ):''}
            </div>
            </div>
        );
    };

    const Position = ({ p, position }) => {
        return (
            <> 
                {p && p.username ? (
                    <Link
                        href={`/${p.username}`}
                        onClick={() => trackSearchClick(p?.id, p?.username)}
                        className={` position-${position} position text-center rounded-[30px]  md:rounded-[30px]   
                              border-[#F94F97] !shadow-none shadow-pink bg-white m-0`}
                    > {p.id}
                        <div className="profile p-2 sm:p-3 pb-0">
                            <div className="relative">
                                {position == 1 ? (
                                    <div
                                        className="crown-wings"
                                        dangerouslySetInnerHTML={{
                                            __html: crown,
                                        }}
                                    />
                                ) : (
                                    ""
                                )}
                                <div className="profile-image ">
                                    <img
                                        src={(p && p.avatar) || userphoto}
                                        className="max-w-full h-auto"
                                        alt="image"
                                    />
                                </div>
                            </div>
                            <div className="profile-content">
                                <h2 className="!text-sm sm:!text-lg font-bold pt-2 capitalize  justify-center">
                                    {(p && p.name) || "Anonymous"}  
                                    {p?.role == 1 && p?.profile_status_lock === 2 ? 
                                        <RiVerifiedBadgeFill  size={'1.2rem'} className="ml-1 inline-block text-pink" />
                                        : ''}
                                </h2>
                                <h2 className="!text-[10px] sm:!text-sm capitalize text-gray-500 mb-3 flex justify-center">
                                    @{p && p.username} 
                                </h2>
                                <p className="toppercentage text-center font-gulfs">
                                    {p && p.top}%{" "}
                                </p>
                                {/* Display engagement metrics if available */}
                                { p?.supporters > 0 ? (
                                    <p className="text-xs text-gray-600 text-center mt-1">
                                        👥 {p.supporters} supporters
                                    </p>
                                ) : null}
                            </div>
                            {position === 1 ? 
                                <div className={`fading rank-position p-1  `}>
                                    <h2 className="font-gulfs !text-[80px] md:!text-[95px] xl:!text-[130px]">{position}</h2>
                                </div>
                                : ''
                            }
                            {position === 2 ? 
                                <div className={`fading rank-position p-1`}>
                                    <h2 className="font-gulfs  !text-[45px] md:!text-[60px] xl:!text-[80px]">{position}</h2>
                                </div>
                                : ''
                            }
                            {position === 3 ? 
                                <div className={`fading rank-position p-1  `}>
                                    <h2 className="font-gulfs  !text-[30px] md:!text-[35px] xl:!text-[50px]">{position}</h2>
                                </div>
                                : ''
                            }
                        </div>
                    </Link>
                ) : (
                    <div
                        className={`position-${position} position text-center rounded-[30px]   shadow-pink bg-white`}
                    >
                        <div className="profile p-3 pb-0">
                            <div className=" relative">
                                {position == 1 ? (
                                    <div className="crown-wings" dangerouslySetInnerHTML={{__html: crown}} />
                                ) : (
                                    ""
                                )}
                                <div className="profile-image ">
                                    <img
                                        src={(p && p.avatar) || userphoto}
                                        className="max-w-full h-auto"
                                        alt="image"
                                    />
                                </div>
                            </div>
                            <div className="profile-content">
                                <h2 className="font-bold text-large pt-2">
                                    {(p && p.name) || "Anonymous"}
                                </h2>
                                <p className="toppercentage text-center">
                                    {p && p.top}%
                                </p>
                            </div>
                            <div className={`rank-position `}>
                                <h2 className="font-GillSans">{position}</h2>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <Authenticated auth={auth && auth.user}>
            <Head title={"Leaderboard"} />
            <div className="bg-white pt-4">
                <div className="containerbox pb-5 pt-2 ">
                    <h1 className="text-bl font-GillSans text-center xl:!text-left text-3xl lg:text-4xl my-6 uppercase text-black ">
                    Leaderboard
                </h1>
                <div className="flex flex-wrap -mx-4">
                    <div className="w-full xl:w-2/3 px-4 mb-4">
                        <div className=" ">
                            <div className="p-2  md:!p-6 pinkbg rounded-[30px]  mb-6">
                                <div className="pt-4 md:pt-0  mt-6   mb-4 pb-4">
                                    <h1 className="btn-shadow text-center font-GillSans  text-2xl md:text-3xl  mb-3 uppercase text-white ">
                                        Top Creators Getting <br></br> the Most Love
                                    </h1>
                                        <p className="text-center text-white text-sm opacity-90 mb-4">
                                            Ranked by community support and engagement
                                        </p>
                                        <div className="changePeriod w-full">
                                            <button className={` !text-sm md:!text-[18px] ${period == "all" ? "active text-white":""}`}
                                            onClick={() => switchTime("all")}
                                            > All Time </button>
                                            <button className={` !text-sm md:!text-[18px] ${period == "monthly" ? "active text-white":""}`}
                                            onClick={() => switchTime("monthly")}
                                            > Monthly </button>
                                            <button className={` !text-sm md:!text-[18px] ${period == "weekly" ? "active text-white":""}`}
                                            onClick={() => switchTime("weekly")}
                                            > Weekly </button>
                                            {is_daily == 1 ? ( <button className={` !text-sm md:!text-[18px] ${period == "daily" ? "active text-white":""}`}
                                            onClick={() => switchTime("daily")}
                                            > Daily </button> ):( "" )}

                                        </div>
                                        {error && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-4 mb-3" role="alert">
                                            <div className="flex justify-between items-center">
                                                <span>{error}</span>
                                                <button 
                                                    className="ml-2 font-bold" 
                                                    onClick={() => setError(null)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                    <div
                                        className={`${
                                            loading ? "opacity-50 pointer-events-none" : ""
                                        }  postions grid grid-cols-3 !gap-2 md:!gap-4 pt-[10px] md:pt-[50px] `}
                                    >
                                        {positions && positions[1] ? (
                                            <Position
                                                position={2}
                                                p={positions && positions[1]}
                                            />
                                        ) : (
                                            ""
                                        )}
                                        {positions && positions[0] ? (
                                            <Position
                                                position={1}
                                                p={positions && positions[0]}
                                            />
                                        ) : (
                                            ""
                                        )}
                                        {positions && positions[2] ? (
                                            <Position
                                                position={3}
                                                p={positions && positions[2]}
                                            />
                                        ) : (
                                            ""
                                        )}
                                    </div>
                                </div>

                                {ranks && ranks.length ? (
                                    <div
                                    className={`${
                                        loading ? "opacity-50 pointer-events-none" : ""
                                        }  rank_lists bg-gray-100 p-3 md:p-4  rounded-[30px]  `}
                                        >
                                        <h2 className=" font-GillSans text-left text-2xl uppercase text-gray-900 ">🔥 Rising Creators</h2>
                                        <p className="mb-6">New creators gaining support fast</p>
                                        {ranks.map((r, i) => {
                                            return <Rank r={r} key={i} />;
                                        })}
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                            <CategoryLeaders />
                    </div>
                    <div className="w-full xl:w-1/3 px-4">
                        <RecentSupporters />
                        <VipSupporters />
                        {/* <TopSupporters /> */}
                        <LeaderboardStars />
                    </div>
                </div>
                    
                    
                </div>
            </div>
        </Authenticated>
    );
}

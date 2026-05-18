import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import userphoto from "../../../assets/siteicon.png";
import Avatar from "@/includes/Avatar";
import axios from "axios";
import { useState, useMemo, useRef, useEffect } from "react";
import { crown } from "@/includes/Icons";
import { CircleCheckIcon } from "@animateicons/react/lucide";
import { BadgeCheckIcon } from "lucide-react";
import LeaderboardStars from "./LeaderboardStars";
import RecentSupporters from "./RecentSupporters";
import DeviceID from "@/includes/DeviceID";
import TopSupporters from "./TopSupporters";
import CategoryLeaders from "./CategoryLeaders";
import VipSupporters from "./VipSupporters";
import GrowthTrends from "./GrowthTrends";
import PlatformAnalytics from "./PlatformAnalytics";
import { trackSearchClick } from "@/includes/Analytics";
import { Share2Icon, SearchIcon } from "lucide-react";
import confetti from 'canvas-confetti';

export default function Board(props) {
    const { auth, data, is_daily } = props;
    const [positions, setPositions] = useState([]);
    const [ranks, setRanks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const formatSupporters = (count) => {
        const safeCount = Number(count) || 0;
        return `👥 ${safeCount} ${safeCount === 1 ? "supporter" : "supporters"}`;
    };

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

    const myRankData = useMemo(() => {
        if (!auth?.user) return null;
        const inPositions = positions.find(p => p?.username === auth.user.username);
        if (inPositions) return inPositions;
        const inRanks = ranks.find(r => r?.username === auth.user.username);
        return inRanks || null;
    }, [positions, ranks, auth]);

    const handleShare = () => {
        if (!myRankData) return;
        
        // Trigger confetti on share
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF007F', '#8b5cf6', '#3b82f6', '#eab308']
        });

        const periodText = period === 'all' ? 'All-Time' : period;
        const text = `I'm ranked #${myRankData.rank} on SpennyPiggy's ${periodText} Leaderboard! 🚀 Check it out:`;
        
        // Link to the user's actual profile page (spennypiggy.co/username)
        const url = `${window.location.origin}/${auth.user.username}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My SpennyPiggy Rank',
                text: text,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(`${text}\n${url}`);
            alert("Share text copied to clipboard!");
        }
    };

    const [period, setPeriod] = useState("all");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fire confetti once if user loads the page and is in top 10
    useEffect(() => {
        if (myRankData && myRankData.rank <= 10 && !loading) {
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.3 },
                    colors: ['#FF007F', '#8b5cf6', '#eab308']
                });
            }, 500);
        }
    }, [myRankData?.rank, loading]);

    const filteredRanks = useMemo(() => {
        if (!searchQuery.trim()) return ranks;
        const q = searchQuery.toLowerCase();
        return ranks.filter(r => 
            (r.name && r.name.toLowerCase().includes(q)) || 
            (r.username && r.username.toLowerCase().includes(q))
        );
    }, [ranks, searchQuery]);

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
                            name={
                                <div className="flex items-center flex-wrap gap-1">
                                    <span>{(r && r.name) || "Anonymous"}</span>
                                    {r && r.rank <= 10 && (
                                        <span className="text-[10px] sm:text-xs font-bold text-[#FF007F] bg-pink-50 px-1.5 py-0.5 rounded-full whitespace-nowrap ml-1 flex items-center">
                                            🌟 Rising Star
                                        </span>
                                    )}
                                </div>
                            }
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
                        {formatSupporters(r.supporters)}
                    </p>
                ):''}
            </div>
            </div>
        );
    };

    const Position = ({ p, position }) => {
        const iconRef = useRef(null);

        useEffect(() => {
            if (p?.role == 1 && p?.profile_status_lock === 2) {
                const startLoop = () => {
                    iconRef.current?.startAnimation?.();
                    const nextDelay = 3000 + Math.random() * 2000;
                    return setTimeout(startLoop, nextDelay);
                };
                const initialDelay = Math.random() * 3000;
                const initialTimeout = setTimeout(startLoop, initialDelay);
                return () => clearTimeout(initialTimeout);
            }
        }, [p?.id]);

        return (
            <> 
                {p && p.username ? (
                    <Link
                        href={`/${p.username}`}
                        onClick={() => trackSearchClick(p?.id, p?.username)}
                        onMouseEnter={() => iconRef.current?.startAnimation?.()}
                        className={` position-${position} position text-center rounded-[30px]  md:rounded-[30px]   
                              border-[#FF007F] !shadow-none shadow-[4px_4px_0px_0px_#FF007F]ink bg-white m-0`}
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
                                <h2 className="!text-[12px] sm:!text-lg font-bold pt-2 capitalize flex items-center justify-center group/name">
                                    {(p && p.name) || "Anonymous"}  
                                    {p?.role == 1 && p?.profile_status_lock === 2 ? 
                                        <CircleCheckIcon 
                                            ref={iconRef}
                                            size={'1.2rem'} 
                                            duration={1.2}
                                            className="ml-1 inline-block text-pink" 
                                        />
                                        : ''}
                                </h2>
                                <h2 className="!text-[10px] sm:!text-sm capitalize text-gray-500 mb-3 flex justify-center">
                                    @{p && p.username} 
                                </h2>
                                <p className="toppercentage !text-[12px] sm:!text-lg text-center font-gulfs">
                                    {p && p.top}%{" "}
                                </p>
                                {/* Display engagement metrics if available */}
                                { p?.supporters > 0 ? (
                                    <p className="!text-[12px] md:!text-xs text-gray-600 text-center mt-1">
                                        {formatSupporters(p.supporters)}
                                    </p>
                                ) : null}
                            </div>
                            {position === 1 ? 
                                <div className={`fading rank-position  `}>
                                    <h2 className="font-gulfs !text-[50px] md:!text-[95px] xl:!text-[130px]">{position}</h2>
                                </div>
                                : ''
                            }
                            {position === 2 ? 
                                <div className={`fading rank-position p-1`}>
                                    <h2 className="font-gulfs  !text-[35px] md:!text-[60px] xl:!text-[80px]">{position}</h2>
                                </div>
                                : ''
                            }
                            {position === 3 ? 
                                <div className={`fading rank-position p-1  `}>
                                    <h2 className="font-gulfs  !text-[20px] md:!text-[35px] xl:!text-[50px]">{position}</h2>
                                </div>
                                : ''
                            }
                        </div>
                    </Link>
                ) : (
                    <div
                        className={`position-${position} position text-center rounded-[30px]   shadow-[4px_4px_0px_0px_#FF007F]ink bg-white`}
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
            <div className="bg-white pt-4 min-h-screen">
                <div className="containerbox pb-5 pt-2">
                    <h1 className="text-bl font-GillSans text-center xl:!text-left text-3xl lg:text-4xl my-6 uppercase text-black ">
                    Leaderboard
                </h1>
                    <div className="flex flex-wrap items-start -mx-4">
                        <div className="w-full xl:w-2/3 px-4 mb-4">
                            {myRankData && (
                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-[30px] p-4 mb-6 flex items-center justify-between shadow-md text-white">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-3xl">🎉</div>
                                        <div>
                                            <h3 className="font-bold text-lg">You are ranked #{myRankData.rank}!</h3>
                                            <p className="text-sm opacity-90">Top {myRankData.top}% of creators ({period === 'all' ? 'All-Time' : period})</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleShare}
                                        className="flex items-center space-x-2 bg-white text-[#FF007F] px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        <Share2Icon size={16} />
                                        <span>Share Status</span>
                                    </button>
                                </div>
                            )}
                            <div className="p-2 md:!p-6 pinkbg rounded-[30px] mb-6">
                                <div className="pt-4 md:pt-0 mt-6 mb-4 pb-4">
                                    <h1 className="btn-shadow text-center font-GillSans text-2xl md:text-3xl mb-3 uppercase text-white ">
                                        Top Creators Getting <br></br> the Most Love
                                    </h1>
                                    <p className="text-center text-white text-sm opacity-90 mb-4">
                                        Ranked by community support and engagement
                                    </p>
                                    <div className="changePeriod w-full">
                                        <button
                                            className={` !text-sm md:!text-[18px] ${period == "all" ? "active text-white" : ""}`}
                                            onClick={() => switchTime("all")}
                                        >
                                            All Time
                                        </button>
                                        <button
                                            className={` !text-sm md:!text-[18px] ${period == "monthly" ? "active text-white" : ""}`}
                                            onClick={() => switchTime("monthly")}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            className={` !text-sm md:!text-[18px] ${period == "weekly" ? "active text-white" : ""}`}
                                            onClick={() => switchTime("weekly")}
                                        >
                                            Weekly
                                        </button>
                                        {is_daily == 1 ? (
                                            <button
                                                className={` !text-sm md:!text-[18px] ${period == "daily" ? "active text-white" : ""}`}
                                                onClick={() => switchTime("daily")}
                                            >
                                                Daily
                                            </button>
                                        ) : (
                                            ""
                                        )}
                                    </div>
                                    {error && (
                                        <div
                                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-4 mb-3"
                                            role="alert"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{error}</span>
                                                <button className="ml-2 font-bold" onClick={() => setError(null)}>
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={`${
                                        loading ? "opacity-50 pointer-events-none" : ""
                                    }  postions grid grid-cols-3 !gap-1 md:!gap-4 pt-[10px] md:pt-[50px] `}
                                >
                                    {positions && positions[1] ? <Position position={2} p={positions && positions[1]} /> : ""}
                                    {positions && positions[0] ? <Position position={1} p={positions && positions[0]} /> : ""}
                                    {positions && positions[2] ? <Position position={3} p={positions && positions[2]} /> : ""}
                                </div>
                            </div>
                                {ranks && ranks.length ? (
                                    <div
                                        className={`${
                                            loading ? "opacity-50 pointer-events-none" : ""
                                        }  rank_lists bg-gray-100 p-3 md:p-4  rounded-[30px] mb-6 `}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                                            <div>
                                                <h2 className=" font-GillSans text-left text-2xl uppercase text-gray-900 ">🔥 Rising Creators</h2>
                                                <p className="text-gray-600 text-sm">New creators gaining support fast</p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <SearchIcon size={16} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Find a creator..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full w-full sm:w-64 focus:outline-none focus:border-[#FF007F] focus:ring-0 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        {filteredRanks.length > 0 ? (
                                            filteredRanks.map((r, i) => {
                                                return <Rank r={r} key={i} />;
                                            })
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No creators found matching "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    ""
                                )}
                            <CategoryLeaders />
                            <GrowthTrends />
                            <PlatformAnalytics />
                        </div>
                        <div className="w-full xl:w-1/3 px-4 xl:self-start">
                            <div className="xl:sticky xl:top-24 z-10">
                                <RecentSupporters />
                                <VipSupporters />
                                <LeaderboardStars />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

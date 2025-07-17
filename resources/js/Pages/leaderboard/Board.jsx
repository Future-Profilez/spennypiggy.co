import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
// import userphoto from "../../../assets/siteicon.png";
import userphoto from "../../../assets/siteicon.png";
import Avatar from "@/includes/Avatar";
import axios from "axios";
import React, { useState, useMemo } from "react";
import { crown } from "@/includes/Icons";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import LeaderboardStars from "./LeaderboardStars";
import RecentGifters from "./RecentGifters";
import DeviceID from "@/includes/DeviceID";

export default function Board(props) {
    const { auth, data, is_daily } = props;

    console.log("data", data);
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
    const switchTime = (e) => {
        setPeriod(e);
        setLoading(true);
        axios
            .get(`leaderboard/${e}`)
            .then((resp) => {
                filterPositions(resp.data.data);
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    };

    const Rank = ({ r }) => {
        return (
            <div className="rank py-3 border-bottom flex items-center justify-between">
                <div className="flex items-center justify-between">
                    <div className="sno me-2 me-md-4 ps-2">
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
                        />
                    </div>
                </div>
                <div className="rank-stats">
                    <p className="toppercentage pe-4">{r && r.top}</p>
                </div>
            </div>
        );
    };

    const Position = ({ p, position }) => {
        return (
            <>
                {p && p.username ? (
                    <Link
                        href={p && p.username}
                        className={`position-${position} position text-center rounded-[20px] md:rounded-[40px] border-2 
                            md:border-4 border-[#F94F97] !shadow-none shadow-pinks bg-white`}
                    >
                        <div className="profile p-3 pb-0">
                            <div className="position-relative">
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
                                        className="img-fluid"
                                        alt="image"
                                    />
                                </div>
                            </div>
                            <div className="profile-content">
                                <h2 className=" text-large pt-2 capitalize flex justify-center">
                                    {(p && p.name) || "Anonymous"}  
                                    {p?.role == 1 && p?.profile_status_lock === 2 ? 
                                        <RiVerifiedBadgeFill  size={'1.2rem'} className="ms-1 mt-1 text-pink" />
                                        : ''}
                                </h2>
                                <p className="toppercentage text-center font-gulfs">
                                    {p && p.top}%{" "}
                                </p>
                            </div>
                            {position === 1 ? 
                                <div className={`rank-position  `}>
                                    <h2 className="font-gulfs !text-[80px] md:!text-[95px] xl:!text-[130px]">{position}</h2>
                                </div>
                                : ''
                            }
                            {position === 2 ? 
                                <div className={`rank-position  `}>
                                    <h2 className="font-gulfs  !text-[45px] md:!text-[60px] xl:!text-[80px]">{position}</h2>
                                </div>
                                : ''
                            }
                            {position === 3 ? 
                                <div className={`rank-position  `}>
                                    <h2 className="font-gulfs  !text-[30px] md:!text-[35px] xl:!text-[50px]">{position}</h2>
                                </div>
                                : ''
                            }
                        </div>
                    </Link>
                ) : (
                    <div
                        className={`position-${position} position text-center rounded-lg shadow-pink bg-white`}
                    >
                        <div className="profile p-3 pb-0">
                            <div className=" position-relative">
                                {position == 1 ? (
                                    <div className="crown-wings" dangerouslySetInnerHTML={{__html: crown}} />
                                ) : (
                                    ""
                                )}
                                <div className="profile-image ">
                                    <img
                                        src={(p && p.avatar) || userphoto}
                                        className="img-fluid"
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
                    <h1 className="text-bl font-GillSans text-start text-4xl my-6 uppercase text-black ">
                        Leaderboard
                    </h1>
                    <div className="row">
                        <div className="col-xl-8 mb-4">
                            <div className="pe-md-4">
                                <div className="p-2 md:p-4 pinkbg rounded-[30px] mb-6">
                                    <div className="pt-4 pt-md-0  mt-6   mb-4 pb-4">
                                        <h1 className="text-bl btn-shadow text-center font-GillSans  text-3xl mb-3 uppercase text-white ">
                                            Top Creators Getting <br></br> the Most Love
                                        </h1>
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
                                    </div>
                                    <div
                                        className={`${
                                            loading ? "loading-state" : ""
                                        }  postions pb-3 sm:pb-3 lg:pb-5 pt-5 mt-3`}
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
                                        loading ? "loading-state" : ""
                                        }  rank_lists bg-gray-100 p-4  rounded-[25px] `}
                                        >
                                        <h2 className="text-bl font-GillSans text-start text-2xl uppercase text-dark ">🔥 Rising Creators</h2>
                                        <p className="mb-6">New creators gaining support fast</p>
                                        {ranks.map((r, i) => {
                                            return <Rank r={r} key={i} />;
                                        })}
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                        <div className="col-xl-4">
                            <RecentGifters />
                            <LeaderboardStars />
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import userphoto from "../../../assets/img/userphoto.png";
import Avatar from "@/includes/Avatar";
import axios from "axios";
import React, { useState, useMemo } from "react";
import LargestGifts from "./LargestGifts";
import { crown } from "@/includes/Icons";

export default function Board(props) {
    const { auth, data } = props;

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

    const [period, setPeriod] = useState("monthly");
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
            <div className="rank py-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="sno me-2 me-md-4 ps-2">
                        <p>#{r && r.rank}</p>
                    </div>
                    <div className="wisher">
                        <Avatar
                            name={(r && r.name) || "Anonymous"}
                            link={(r && r.username) || ""}
                            subhead={(r && r.username) || null}
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
                    <Link href={p && p.username} className={`position-${position} position text-center rounded-lg shadow-pink bg-white`} >
                        <div className="profile p-3 pb-0">
                            <div className="position-relative">
                                    {position == 1 ? <div className="crown-wings" dangerouslySetInnerHTML={{ __html: crown }} /> : ''}
                                <div className="profile-image ">
                                    <img src={(p && p.avatar) || userphoto} className="img-fluid" alt="image" />
                                </div>
                            </div>
                            <div className="profile-content">
                                <h2 className="font-bold text-large pt-2">{(p && p.name) || "Anonymous"}</h2>
                                <p className="toppercentage text-center">{p && p.top}% </p>
                            </div>
                            <div className={`rank-position `}>
                                <h2 className="font-GillSans">{position}</h2>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className={`position-${position} position text-center rounded-lg shadow-pink bg-white`} >
                        <div className="profile p-3 pb-0">
                            <div className=" position-relative">
                                    {position == 1 ? <div  className="crown-wings" dangerouslySetInnerHTML={{ __html: crown }} /> : ''}
                                    <div className="profile-image ">
                                        <img src={(p && p.avatar) || userphoto} className="img-fluid" alt="image" />
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
            <Head title={"Cart"} />
            <div className="blackbg">
                <div className="containerbox pb-5 ">
                    <div className="row">
                        <div className="col-lg-8 mb-4">
                            <div className="pe-md-4">
                                <div className="pt-4 pt-md-0 d-block d-md-flex align-items-center justify-content-between mb-4 pb-4">
                                    <h2 className="text-bl font-GillSans  text-start text-2xl uppercase text-white ">
                                        Leaderboard
                                    </h2>
                                    <div className="changePeriod">
                                        <button
                                            className={period == "monthly" ? "active":""}
                                            onClick={() => switchTime("monthly")} >
                                            Monthly
                                        </button>
                                        <button className={period == "weekly" ? "active":""} onClick={() => switchTime("weekly")}>
                                            Weekly
                                        </button>
                                        <button
                                            className={period == "daily"? "active": ""}
                                            onClick={() => switchTime("daily")}>
                                            Daily
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className={`${
                                        loading ? "loading-state" : ""
                                    }  postions pb-5 pt-5 mt-3`}
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
                                {ranks && ranks.length ? (
                                    <div
                                        className={`${
                                            loading ? "loading-state" : ""
                                        }  rank_lists bg-white py-3 px-3 rounded-lg`}
                                    >
                                        {ranks.map((r, i) => {
                                            return <Rank r={r} key={i} />;
                                        })}
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <LargestGifts />
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

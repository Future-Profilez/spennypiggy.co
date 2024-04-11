import { usePage } from "@inertiajs/react";
import React from "react";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
const Wishlistbox = React.lazy(() => import("@/wishlist/Wishlistbox"));
const LoadingScreen = React.lazy(() => import("@/includes/LoadingScreen"));
const Nocontent = React.lazy(() => import("@/includes/Nocontent"));

export default function Allwishes(props) {
    const { auth, global_currency } = usePage().props;
    const [order, setOrder] = useState("new");
    const [type, setType] = useState("all");
    const [price, setprice] = useState("all");
    const [tag, setTag] = useState("");
    const [loading, setLoading] = useState(false);
    const [wishes, setwishes] = useState();
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);

    const [lists, setLists] = useState([]);
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        const fetch_profile_tags = (p) => {
            axios.get(`/discover/creators/categories`, { signal })
            .then((resp) => {
                setLists(resp.data && resp.data.categories);
            }).catch((_err) => {
                console.error("error", _err);
            });
        };
        fetch_profile_tags();
    }, []);

    const fetch_wishes = (p, t) => {
        setTag(t);
        setLoading(true);
        axios.get(`discover/wishes/${order}/${type}/${price}?page=${p}&tag=${t.replace(" ", "-")}`)
        .then((resp) => {
            setwishes(resp.data && resp.data.wishes.data);
            setLoading(false);
            setPage(p);
            setData(resp.data);
        }).catch((_err) => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetch_wishes(page, tag);
    }, [price, type, order]);

    const Switch = () => {
        return (
            <div className="d-flex align-items-center toggleswitch mb-3 mb-sm-0">
                <button
                    onClick={() => setOrder("new")}
                    className={`${order == "new" ? "active" : ""}`}
                >
                    Newest
                </button>
                <button
                    onClick={() => setOrder("old")}
                    className={`${order == "old" ? "active" : ""}`}
                >
                    Oldest
                </button>
            </div>
        );
    };

    const Pagination = ({ number }) => {
        const [pageArray, setPageArray] = useState([]);
        useEffect(() => {
            const generateDigitArray = (n) => {
                const newArray = Array.from(
                    { length: n },
                    (_, index) => index + 1
                );
                setPageArray(newArray);
            };
            generateDigitArray(number);
        }, [number]);

        return (
            <>
                {pageArray && pageArray.length > 1 ? (
                    <ul className="mt-4 pagination d-flex flex-wrap justify-content-center">
                        {pageArray &&
                            pageArray.map((p, i) => {
                                return (
                                    <li className="pe-2 mb-2" key={`page-${i}`}>
                                        <button
                                            className={p == page ? "active" : ""}
                                            onClick={() => fetch_wishes(p, tag)}>
                                            {p}
                                        </button>
                                    </li>
                                );
                            })}
                    </ul>
                ) : (
                    ""
                )}
            </>
        );
    };

        return (
            <>
                <div className="filters d-block d-sm-flex align-items-center justify-content-between w-100 mb-4">
                    <Switch />
                    <div className="d-flex align-items-center">
                        <div className="filter-select-wrap">
                            <select
                                onChange={(e) => setType(e.target.value)}
                                id="types"
                                class=" filter-select bg-gray-50 border border-gray-300 text-gray-900
                        text-sm rounded-md focus:ring-blue-500 focus:border-blue-500
                        block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                        dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            >
                                <option selected value="all">
                                    All Wishes
                                </option>
                                <option value="subscription">Subscription</option>
                                {/* <option value="crowdfund">Crowdfunded</option> */}
                                <option value="sing le">Single</option>
                            </select>
                        </div>
                        <div className="filter-select-wrap ps-3">
                            <select
                                onChange={(e) => setprice(e.target.value)}
                                id="prices"
                                class="filter-select bg-gray-50 border border-gray-300 text-gray-900
                            text-sm rounded-md focus:ring-blue-500 focus:border-blue-500
                            block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                            dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            >
                                <option selected value="all">
                                    By Price
                                </option>
                                <option value="5to10">Price 5 - 10</option>
                                <option value="10to30">Price 10 - 30</option>
                                <option value="30to50">Price 30 - 50</option>
                                <option value="50to100">Price 50 - 100</option>
                                <option value="100plus">Price 100 +</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-3 mb-2 tagsfilterbar d-flex flex-wrap">
                    <button onClick={() => fetch_wishes(page, "")}
                        className={` me-2 mb-2  rounded-[12px] text-[14px] p-2 px-3 ${ tag == "" ? "bluebg text-white" : "bg-gray-300"}`}>All</button>
                    {lists &&
                        lists.map((l, i) => {
                            return (
                                <button
                                    onClick={() => fetch_wishes(page, l)}
                                    className={` me-2 mb-2  rounded-[12px] text-[14px] p-2 px-3 ${
                                        tag == l? "bluebg text-white": "bg-gray-300"}`} >
                                    {l}
                                </button>
                            );
                        })}
                </div>

                <div className="row">
                    {loading ? (
                        <div className="w-100 d-flex justify-content-center">
                            <LoadingScreen />
                        </div>
                    ) : (
                        <>
                            {wishes && wishes.length ? (
                                wishes.map((w, i) => {
                                    return (
                                        <Wishlistbox
                                            key={`wish-item-${i}`}
                                            classes="col-xl-3 col-lg-4 col-6"
                                            currency={global_currency}
                                            // fetchingcats={fetchingcats}
                                            // categories={categories}
                                            IsloggedIn={false}
                                            showall={true}
                                            auth={auth.user}
                                            setuped={
                                                auth &&
                                                auth.user &&
                                                auth.user
                                                    .stripe_details_submitted == 1
                                                    ? true
                                                    : false
                                            }
                                            itm={w}
                                        />
                                    );
                                })
                            ) : (
                                <div className="my-5">
                                    <Nocontent text={"No Result Found"} />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <Pagination number={data && data.last_page} />
            </>
        );
    }

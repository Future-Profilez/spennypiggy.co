import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import LoadingScreen from "@/includes/LoadingScreen";
import { piggy } from "@/includes/Icons";
import Popup from "@/Components/Popup";
import Nocontent from "@/includes/Nocontent";

export default function GifterItems(props) {
    const { IsloggedIn } = props;
    const { auth, user, username, itemid, min_surprise_amount } =
        usePage().props;
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetch_items = async (p, load) => {
        setLoading(true);
        axios
            .get(`/gifter-wish-items/${username}?page=${p}`)
            .then((resp) => {
                setLoading(false);
                const newd = resp.data.wishes;
                if (load) {
                    const result = data.concat(newd);
                    setData(result);
                } else {
                    setData(newd);
                }
                setPage(p);
                if (resp.data.last_page == resp.data.current_page) {
                    setHasMore(false);
                }
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetch_items(page);
    }, []);

    const MessageMedia = ({ w }) => {
        return (
            <>
                <Popup
                    modalclass="pinkmodal shadow-[4px_4px_0px_0px_#FF007F]ink"
                    space="0"
                    size="md"
                    action={false}
                    classes={`mt-3 text-pink`}
                    text={<>Adventure awaits 🌟🔍 tap here !! </>}
                >
                    <div className="video-payer-pop">
                        <img src={(w && w?.media_url) || ""} />
                    </div>
                </Popup>
            </>
        );
    };

    const Item = ({ w }) => {
        const Template = () => {
            const total_amount = +w.amount + +w.tax;
            const total_amount_with_vat = +w.vat_amount + total_amount;
            const uname = user && user.username;
            const amount = formatMultiPrice(
                total_amount_with_vat,
                w && w.currency,
            );
            const owner = w && w.owner && w.owner.name;
            const ownerUsername = w && w.owner && w.owner.username;
            const wishname = w && w.wish && w.wish.wishname;
            const s = w && w.wish && w.wish.subscription;
            return (
                <div className="box rounded-[30px]    px-3 py-3  ">
                    <div className="flex align-items-start ">
                        <div
                            className={`gift-icon mt-1 me-3 flex items-center justify-center w-12 h-12 min-w-[48px] rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]
                            ${
                                s == "0"
                                    ? "bg-[#B6FFD6]"
                                    : s == "1"
                                    ? "bg-pink-300"
                                    : s == "2"
                                        ? "bg-violet-300"
                                        : "bg-gray-300"
                            }`}
                        >
                            <div
                                className=" text-black [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-black"
                                dangerouslySetInnerHTML={{ __html: piggy }}
                            />
                        </div>

                        {s == "0" ? (
                            <p className=" ">
                                <span className="text-capitalize">{uname}</span>{" "}
                                granted a wish of {amount} to <b>{owner}</b> on
                                their wish <b>{wishname}</b>.
                                {/* <span className='text-small text-time text-capitalize' >14hrs ago</span> */}
                            </p>
                        ) : (
                            ""
                        )}

                        {s == "2" ? (
                            <p className=" ">
                                <span className="text-capitalize">{uname}</span>{" "}
                                unlocked <b>{owner}</b>'s exclusive content{" "}
                                {<b>{wishname}</b>} for {amount}.
                                {/* <span className='text-small text-time text-capitalize' >14hrs ago</span>  */}
                            </p>
                        ) : (
                            ""
                        )}

                        {w && w.is_surprise ? (
                            <p className="">
                                <span className="text-capitalize">{uname}</span>{" "}
                                send a treat of {amount} to{" "}
                                <b>{owner}</b>.
                                {/* <span className='text-small text-time text-capitalize' >14hrs ago</span> */}
                            </p>
                        ) : (
                            ""
                        )}
                    </div>
                    {IsloggedIn && w && w.media_url ? (
                        <MessageMedia w={w} />
                    ) : (
                        ""
                    )}
                    <div className="mt-3">
                        <Link
                            href={`/support/${ownerUsername || ""}/${uname || ""}`}
                            className="button rounded-[30px]  px-3 text-[11px] uppercase"
                        >
                            View Story
                        </Link>
                    </div>
                </div>
            );
        };
        return (
            <div className="wish-grant my-2">
                <Template />
            </div>
        );
    };

    return (
        <div className="mb-4">
            {loading ? (
                <LoadingScreen hideimage={true} />
            ) : (
                <>
                    {data && data.length > 0 ? (
                        <div className="box rounded-[30px]  p-4">
                            <h3 className="text-large text-dark title mb-3">
                                Wish Granted
                            </h3>

                            {data.map((d, i) => {
                                return (
                                    <div key={`wishes-items-${i}`}>
                                        <Item w={d} />
                                    </div>
                                );
                            })}

                            {!loading && hasMore ? (
                                <button
                                    onClick={() => fetch_items(page + 1, true)}
                                    className="loadmore-text"
                                >
                                    Show More
                                </button>
                            ) : (
                                ""
                            )}
                        </div>
                    ) : (
                        <Nocontent text="No Wishes Granted yet" />
                    )}
                </>
            )}
        </div>
    );
}

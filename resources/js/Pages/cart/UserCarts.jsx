import { useState } from "react";
import CartItem from "./CartItem";
import { Link, router } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import DeviceID from "@/includes/DeviceID";

export default function UserCarts(props) {
    const deviceid  = DeviceID();
    const { auth, removeFromCart } = props;
    const { format } = PriceFormat();
    const datas = props.data;
    const [isChecked, setIsChecked] = useState(false);
    const [message, setMessage] = useState(null);
    const [name, setName] = useState(null);
    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (auth && auth.id) {
            window.location.href = `/create-checkout-session/${datas?.user?.id || ''}?message=${message}&from=${name}&email=${email}`;
        } else {
            // setLoading(true);
            window.location.href =`/anonymous-create-checkout-session/${deviceid}?message=${message}&from=${name}&email=${email}`;
            // router.get(`/anonymous-create-checkout-session/${deviceid}?message=${message}&from=${name}&email=${email}`), {
            //     preserveScroll: true,
            //     onSuccess: (resp) => {
            //         console.log("resp", resp);
            //     },
            //     onError: (_err) => {
            //         console.error("cart",_err);
            //     }
            // };
        }
    };

    const subtotal = datas && datas?.items.reduce((total, item) => +total + +item.price, 0);
    const fee = 0.2 * subtotal;

    return (
        <div className="px-2">
            <div className="my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                <div className="cartMain">
                    <h2 className="pb-1 wishtitle">
                        Wish Basket for {datas?.user?.name || ""}{" "}
                        <Link className="text-voilet"
                        href={`/${datas?.user?.username || ""}`} >
                            @{datas?.user?.username || ""}
                        </Link>
                    </h2>

                    <p className="pb-4">
                        You are about to send a payout to{" "}
                        <strong>{datas?.user?.name || ""}</strong> to fund their
                        wishes.{" "}
                    </p>
                    <div className="CartItemBox">
                        {datas?.items &&
                            datas?.items.map((c, i) => {
                                return <CartItem data={c} key={i} />;
                            })}
                    </div>

                    <div className="cartTotal px-0 py-3">
                        <div className="cartSubTotal text-right mt-1">
                            <span>Platform Fee :</span>{" "}
                            <strong className="text-end">
                                {format(fee  || "")}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <span>Subtotal :</span>{" "}
                            <strong className="text-end">
                                {format(subtotal || "")}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <strong className="text-dark">Total :</strong>{" "}
                            <strong className="text-end">
                                {format(fee + subtotal || "")}
                            </strong>
                        </div>
                    </div>

                    <div className="addMessage">
                        <form onSubmit={handleSubmit}>
                            <ul className="row">
                                <li>
                                    <label>Add Message </label>
                                    <textarea
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        placeholder="Write message in under 800 Words..."
                                    ></textarea>
                                </li>
                                <li className="w-100 mt-3">
                                    <li className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="d-block text-start">
                                                From
                                            </label>
                                            <input
                                                className="form-input w-100 rounded"
                                                onChange={(e) =>
                                                    setName(e.target.value)
                                                }
                                                type="text"
                                                placeholder="Enter Your Name..."
                                            />
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="d-block text-start">Email </label>
                                            <input className="form-input w-100 rounded"
                                                onChange={(e) => setEmail(e.target.value)}
                                                type="email" placeholder="Enter Your email..."
                                            />
                                        </div>
                                    </li>
                                </li>
                                <li className="cheklistbox">
                                    <label
                                        for="agreeterm"
                                        className="text-start"
                                    >
                                        <input
                                            onChange={(e) =>
                                                setIsChecked(e.target.checked)
                                            }
                                            type="checkbox"
                                            id="agreeterm"
                                            name="agreeterm"
                                            className="me-2"
                                            value="agreeterm"
                                        ></input>
                                        I agree to the Terms of Service and
                                        Privacy Policy and the following
                                        statements:
                                    </label>
                                    <div className="tearmlist ps-3">
                                        <ul className="ps-0">
                                            <li>
                                                I am making a non-refundable
                                                cash gift donation.
                                            </li>
                                            <li>
                                                I expect no product or service
                                                in return from the gift
                                                recipient.
                                            </li>
                                            <li>
                                                This payment is a donation
                                                intended for the gift recipient.
                                            </li>
                                            <li>
                                                I have taken the necessary steps
                                                to confirm the wishlist owner is
                                                authentic and I understand that
                                                Spenny Piggy will not be held
                                                responsible for any issues
                                                arising from a catfishing
                                                situation.
                                            </li>
                                            <li>
                                                I understand that by violating
                                                these terms I may be subject to
                                                legal action or can fall a
                                                victim of scams.
                                            </li>
                                            <li>
                                                I understand that by checking
                                                the box above and then clicking
                                                "CHECKOUT", I will have created
                                                a legally binding e-signature to
                                                this agreement.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <button
                                type="submit"
                                className={`${isChecked ? "" : "disabled"
                                    }  btn-pink md mt-3 w-1/2 text-center m-auto`} >
                                Checkout
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import CartItem from "./CartItem";
import { Link, router } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import DeviceID from "@/includes/DeviceID";
import axios from "axios";
import { useEffect } from "react";

export default function UserCarts(props) {
    const deviceid = DeviceID();
    const { auth, removeFromCart } = props;
    const { format, formatMultiPrice } = PriceFormat();
    const datas = props.data;
    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [message, setMessage] = useState(null);
    const [name, setName] = useState(auth && auth.name || '');
    const [email, setEmail] = useState(auth && auth.email || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (auth && auth.id) {
            window.location.href = `/create-checkout-session/${datas?.user?.id || ''}?message=${message}&from=${name}&email=${email}&anonymous=${keepAnonmyous ? 1 : 0}`;
        } else {
            window.location.href = `/create-checkout-session/${deviceid}?message=${message}&from=${name}&email=${email}&anonymous=${keepAnonmyous ? 1 : 0}`;
        }
    };
    const [loading, setLoading] = useState(false);
    const [cartCleared, setCartCleared] = useState(false);
    const clearcart = (ownerid, index) => {
        setLoading(true);
        router.get(`/clear-cart/${deviceid}/${ownerid}`, {
            preserveScroll: true,
            onSuccess: (resp) => {
                setCartCleared(true);
                setLoading(false);
                if(index == 0){
                    window.location.reload = false;
                }
            },
            onError: (_err) => {
                console.error("error", _err);
                setLoading(false);
            }
        });
    }

    const [items, setItems] = useState(datas?.items);
    const removeCart = (id) => {
        router.get(`/remove-from-cart/${id}`, {
            preserveScroll: true,
            onSuccess: (resp) => {
                const updatedItems = items.filter(item => item.uuid !== id);
                setItems(updatedItems);
            },
            onError: (_err) => {
                console.error("error", _err);
            }
        }
        );

    };

    const [subtotal, setsubtotal] = useState();
    const [fee, setFee] = useState(0.2 * subtotal);

    function updateTotals(p) {
        const value = items && items.reduce((total, item) => +total + +item.price * (+item.quantity || 1), 0) + p;
        setsubtotal(value);
        const fees = items && items.reduce((total, item) => +total + +item.tax * (+item.quantity || 1), 0) + p;
        setFee(fees);
    } 

    const quantityUpdate = (type, amount, tax) => {
        if (type == 'add') {
            const updated = subtotal + amount;
            setsubtotal(updated);
            const totalfee = fee + tax
            setFee(totalfee);
        } else {
            const updated = subtotal - amount;
            setsubtotal(updated)
            const totalfee = fee - tax
            setFee(totalfee);
        }
    }

    useEffect(() => {
        updateTotals(0);
    }, [items]);

    return (
        <div className={`${cartCleared ? "d-none" : ''} px-2`}>
            <div className="my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                <div className="cartMain">
                    <h2 className="pb-1 wishtitle">
                        Wish Basket for {datas?.user?.name || ""}
                        <Link className="text-voilet"
                            href={`/${datas?.user?.username || ""}`} >
                             @{datas?.user?.username || ""}
                        </Link>
                    </h2>
                    <p className="pb-4">
                        You are about to send a payout to
                        <strong> {datas?.user?.name || ""} </strong> to fund their
                        wishes.
                    </p>
                    <div className="CartItemBox">
                        {items && items.map((c, i) => {
                            return <CartItem currency={datas?.user && datas?.user?.default_currency} quantityUpdate={quantityUpdate} 
                            removeCart={removeCart} data={c} key={i} />;
                        })}
                    </div>

                    <div className="cartTotal px-0 py-3">
                        <div className="cartSubTotal text-right mt-1">
                            <span>Platform Fee :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(fee || "", datas?.user && datas?.user?.default_currency)}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <span>Subtotal :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(subtotal || "", datas?.user && datas?.user?.default_currency)}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <strong className="text-dark">Total :</strong>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(fee + subtotal || "", datas?.user && datas?.user?.default_currency)}
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
                                        <div className="col-md-12 mb-4">
                                            <label className="d-block text-start">
                                                From
                                            </label>
                                            <input
                                                className="form-input w-100 rounded"
                                                onChange={(e) =>
                                                    setName(e.target.value)
                                                } value={name}
                                                type="text"
                                                placeholder="Enter Your Name..."
                                            />
                                        </div>
                                        <div className="col-md-12 mb-4">
                                            <label className="d-block text-start">Email </label>
                                            <p className="text-small text-muted mb-1">Your e-mail remains private. It is used for the creator to reply to your gift with a message via Spenny Piggy</p>
                                            <input required className={`${auth && auth.email ? 'disabled' : ''} form-input w-100 rounded`}
                                                value={auth && auth.email}
                                                disabled={auth && auth.email ? true : false}
                                                onChange={(e) => setEmail(e.target.value)}
                                                type="email" placeholder="Enter Your Email..."
                                            />
                                        </div>
                                    </li>
                                </li>
                                <li className="cheklistbox">
                                    <label
                                        htmlFor="anonymous"
                                        className="text-start" >
                                        <input
                                            onChange={(e) => setKeepAnonmyous(e.target.checked)}
                                            type="checkbox"
                                            id="anonymous"
                                            name="anonymous"
                                            className="me-2" 
                                            value="anonymous" ></input>
                                        Keep anonymous 
                                    </label>
                                    <p className="text-muted text-small mb-3" >Your personal email and name will be private.</p>

                                    <label
                                        htmlFor="agreeterm"
                                        className="text-start" >
                                        <input
                                            onChange={(e) => setIsChecked(e.target.checked)}
                                            type="checkbox"
                                            id="agreeterm"
                                            name="agreeterm"
                                            className="me-2"
                                            value="agreeterm" ></input>
                                        I agree to the <Link target='_blank' className="text-voilet" href={route("terms-and-conditions")} >Terms of Service</Link> and <a className="text-voilet" target='_blank' href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6" > Privacy Policy </a>  and the following statements:
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
                                            <li>
                                                By providing an e-mail, you confirm that you are happy to receive marketing updates. You can opt out at anytime.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <div className="mt-4 d-flex align-items-center justify-content-between" >
                                <button type="button" onClick={()=>clearcart(datas?.user?.id)} className={`btn-pink md mt-3 px-4 text-center`} > {loading ? "Wait.." : "Clear" } </button>
                                <button type="submit" className={`${isChecked ? "":"disabled"} btn-pink md mt-3 text-center`} >Checkout </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

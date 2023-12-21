import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import cartproductimg from '../../../assets/img/cartproductimg.png';

export default function SubCheckout(props) {

    const {auth, wish, reccure} = props;
    const { formatMultiPrice } = PriceFormat();
    const [name, setName] = useState(auth && auth.user && auth.user.name || '');
    const [email, setEmail] = useState(auth && auth.user && auth.user.email || '');

    const {data, setData, post, processing, errors} = useForm({
        name: name,
        email: email,
        message: '',
        agree: false
    });

    const [loading, setLoading] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route(`wish.subscribe.checkout`,{uuid:wish.uuid, reccure:reccure}), {
            preserveScroll:true
        });
    }

    const [subtotal, setsubtotal] = useState();
    // const [fee, setFee] = useState(0.2 * subtotal);


    return (
        <div className={`px-2`}>
            <div className="my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                <div className="cartMain">
                    <h2 className="pb-1 wishtitle">
                        Wish Basket for {wish?.user?.name || ""}
                        <Link className="text-voilet" target="_blank"
                            href={`/${wish?.user?.username || ""}`} >
                             @{wish?.user?.username || ""}
                        </Link>
                    </h2>
                    <p className="pb-4">
                        You are about to subscribe to
                        <strong> {wish?.user?.name || ""} </strong> to fund their
                        wishes.
                    </p>
                    <div className="CartItemBox">
                        <div className={`border cartlist flex flex-wrap justify-between items-center content-between items-center border-purple shadow-purple rounded-xl mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`}>
                            <div className='prodcartbox items-center'>
                                <div className='productimg'>
                                    <img src={wish.perma_link || cartproductimg} alt='img' />
                                </div>
                                <div>
                                    <div className='cartProdTitle ps-3'>{wish.wishname}</div>
                                    {data.message ? <div className='surprise-message ps-3'>Surprise Message : {data.message}</div> : ''}
                                    <div className="badge bg-info text-dark me-4 ms-3 ">
                                    Pay {reccure == 'onetime' ? `Onetime` : wish.subscription_period}
                                </div>
                                </div>
                            </div>
                            <div className='cartProRtbox mt-3 items-center'>
                               
                                <div className='cartPric pe-4'>
                                    {formatMultiPrice(wish.price)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cartTotal px-0 py-3">
                        <div className="cartSubTotal text-right mt-1">
                            <span>Platform Fee :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(wish.tax_amount || "")}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <span>Subtotal :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(wish.price || "")}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <strong className="text-dark">Total :</strong>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(wish.tax_amount + wish.price || "")}
                            </strong>
                        </div>
                    </div>

                    <div className="addMessage">
                        <form onSubmit={handleSubmit}>
                            <ul className="row">
                                <li>
                                    <label>Add Message </label>
                                    <textarea
                                        onKeyUp={(e) =>
                                            setData('message',e.target.value)
                                        }
                                        placeholder="Write message in under 800 Words..."
                                        defaultValue={data.message}
                                    ></textarea>
                                    <span className="text-xs text-red-600">{errors.message}</span>
                                </li>
                                <li className="w-100 mt-3">
                                    <div className="row">
                                        <div className="col-md-12 mb-4">
                                            <label className="d-block text-start">
                                                From
                                            </label>
                                            <input
                                                className="form-input w-100 rounded"
                                                onChange={(e) =>
                                                    setData('name',e.target.value)
                                                } value={data.name}
                                                type="text"
                                                placeholder="Enter Your Name..."
                                            />
                                            <span className="text-xs text-red-600">{errors.name}</span>
                                        </div>
                                        <div className="col-md-12 mb-4">
                                            <label className="d-block text-start">Email </label>
                                            <p className="text-small text-muted mb-1">Your e-mail remains private. It is used for the creator to reply to your gift with a message via Spenny Piggy</p>
                                            <input className={`${auth && auth.user && auth.user.email ? 'disabled' : ''} form-input w-100 rounded`}
                                                value={data.email}
                                                disabled={auth && auth.user && auth.user.email ? true : false}
                                                onChange={(e) => setData('email',e.target.value)}
                                                type="email" placeholder="Enter Your Email..."
                                            />
                                            <span className="text-xs text-red-600">{errors.email}</span>
                                        </div>
                                    </div>
                                </li>
                                <li className="cheklistbox">
                                    <label
                                        htmlFor="agreeterm"
                                        className="text-start" >
                                        <input
                                            onChange={(e) => setData('agree', e.target.checked)}
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
                            <div className="mt-4 d-flex align-items-center justify-content-center" >
                                <button type="submit"
                                    className={`${!data.agree || processing ? "disabled" : ""} btn-pink md px-4 mt-3 text-center`}
                                    disabled={!data.agree || processing}>
                                    {processing ? 'Processing...' : 'Subscribe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

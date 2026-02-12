import { useEffect, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import cartproductimg from '../../../assets/img/cartproductimg.png';
import { useAlerts } from "@/Components/Alerts";
import { Toaster } from "react-hot-toast";
import Authenticated from "@/Layouts/AuthenticatedLayout";

export default function SubCheckout(props) {
    const {auth, user, wish, reccure, vat_amount  } = props;
    const { formatMultiPrice } = PriceFormat();
    const [name, setName] = useState(auth && auth.user && auth.user.name || '');
    const [email, setEmail] = useState(auth && auth.user && auth.user.email || '');
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    const {data, setData, post, processing, errors} = useForm({
        name: name,
        email: email,
        message: '',
        agree: false,
        anonymous: 0,
    });

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    function checkanonymous(e){
        setKeepAnonmyous(e.target.checked);
        if(e.target.checked){
            setData("anonymous", 1)
        } else {
            setData("anonymous", 0)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route(`wish.subscribe.checkout`,{
            uuid:wish.uuid,
            reccure:reccure
        }),
        {
            preserveScroll:true
        });
    }

    const {flash}   = usePage().props;
    useEffect(() => {
        if(flash?.error){
            errorAlert(flash.error);
        }
        if(flash?.success){
            successAlert(flash.success);
        }
        if(flash?.warning){
            warningAlert(flash.warning);
        }
        if(flash?.info){
            infoAlert(flash.info);
        }
    },[flash]);

    return (
        <>
        <Authenticated auth={auth.user} user={user}>
            <Head title={`Subscribe -${wish?.wishname}`}/>
            <div className={`px-0 pb-3 lg:px-2`}>
                <div className="my-4 cartsub cartPage bg-white p-4 md:p-5 border-pink shadow-pink border-pink rounded-[40px]  ">
                    <div className="cartMain">
                        <h2 className="pb-1 wishtitle">
                            Wish Basket for {wish?.user?.name || " "}
                            <Link className="text-violet-600" target="_blank"
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
                            <div className={`border cartlist flex flex-wrap justify-between items-center content-between items-center border-voilet shadow-voilet rounded-[40px]  mb-3 md:mb-4 lg:mb-5 p-3 md:p-4`}>
                                <div className='prodcartbox items-center'>
                                    <div className='productimg'>
                                        <img src={wish.perma_link || cartproductimg} alt='img' />
                                    </div>
                                    <div>
                                        <div className='cartProdTitle pl-3'>{wish.wishname}</div>
                                        {/* {data.message ? <div className='surprise-message ps-3'>Surprise Message : {data.message}</div> : ''} */}
                                        <div className="inline-block px-2 py-1 bg-blue-100 text-gray-800 rounded mr-4 ml-3">
                                        Pay {reccure == 'onetime' ? `Onetime` : wish.subscription_period}
                                    </div>
                                    </div>
                                </div>
                                <div className='cartProRtbox mt-3 items-center'>

                                    <div className='cartPric pr-4'>
                                        {formatMultiPrice(wish.price, wish && wish.currency)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cartTotal px-0 py-3">
                            <div className="cartSubTotal text-right mt-1 !text-sm">
                                <span> Amount :</span>
                                <strong className="text-right">
                                    {formatMultiPrice(wish.price || "", wish && wish.currency)}
                                </strong>
                            </div>
                            <div className="cartSubTotal text-right mt-1 !text-sm">
                                <span>VAT Applicable : </span>
                                <strong className="text-right">
                                    {formatMultiPrice(vat_amount || "", wish && wish.currency)}
                                </strong>
                            </div>
                            {/* <div className="cartSubTotal text-right mt-1 !text-sm">
                                <span>Platform Fee :</span>
                                <strong className="text-right">
                                    {formatMultiPrice(wish.tax_amount || "", wish && wish.currency, 'adminFee')}
                                </strong>
                            </div> */}
                            <div className="cartSubTotal text-right mt-1">
                                <strong className="text-gray-900">Total :</strong>
                                <strong className="text-right text-black">
                                    {formatMultiPrice(wish.tax_amount + wish.price + vat_amount || "", wish && wish.currency, 'adminFee')}
                                </strong>
                            </div>
                        </div>

                        <div className="addMessage">
                            <form onSubmit={handleSubmit}>
                                <ul className="flex flex-wrap">
                                    <li>
                                        <label>Add Message </label>
                                        <textarea
                                            className="border-gray-300 border rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[40px] "
                                            onKeyUp={(e) =>
                                                setData('message',e.target.value)
                                            }
                                            placeholder="Write message in under 800 Words..."
                                            defaultValue={data.message}
                                        ></textarea>
                                        <span className="text-xs text-red-600">{errors.message}</span>
                                    </li>
                                    <li className="w-full mt-3">
                                        <div className="flex flex-wrap">
                                            <div className="w-full mb-4">
                                                <label className="block text-left">
                                                    From
                                                </label>
                                                <input
                                                    className="border-gray-300 border rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                                    onChange={(e) =>
                                                        setData('name',e.target.value)
                                                    } value={data.name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                                <span className="text-xs text-red-600">{errors.name}</span>
                                            </div>
                                            <div className="w-full mb-4">
                                                <label className="block text-left">Email </label>
                                                <p className="text-sm text-gray-500 mb-1">Your e-mail remains private.</p>
                                                <input className={`${auth && auth.user && auth.user.email ? 'disabled' : ''} border-gray-300 border rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
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
                                        htmlFor="anonymous"
                                        className="text-left" >
                                        <input
                                            onChange={checkanonymous}
                                            type="checkbox"
                                            id="anonymous"
                                            name="anonymous"
                                            className="mr-2"
                                            value="anonymous" ></input> Keep anonymous
                                    </label>
                                    <p className="text-gray-500 text-sm mb-3" >Your personal email and name will be private.</p>
                                        <label
                                            htmlFor="agreeterm"
                                            className="text-left" >
                                            <input
                                            onChange={(e) => setData('agree', e.target.checked)}
                                            type="checkbox"
                                            id="agreeterm"
                                            name="agreeterm"
                                            className="mr-2"
                                            value="agreeterm" ></input>
                                           I understand I am paying the creator directly and I agree to the <Link target='_blank' className="text-violet-600" href={route("terms-and-conditions")} >Terms of Service</Link> and <a className="text-violet-600" target='_blank' href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6" > Privacy Policy </a>  and the following statements:
                                        </label>
                                        <div className="tearmlist pl-3">
                                            <ul className="pl-0">
                                                <li> This payment will be automatically taken on a daily,weekly,monthly or yearly basis depending on yourchoice and can be cancelled anytime. </li>
                                                <li> For Memberships and subscriptions, I understand I am making a non-refundable purchase that provides access to exclusive posts. This payment will be automatically taken on a daily, weekly, monthly or yearly basis depending on the subscription type. Can be cancelled anytime. </li>
                                                <li> I understand that for wishes or support payments I am making a non-refundable donation of support and understand I will recieve a thank you message as a reward. </li>
                                                <li> This payment of purchase or donation is intended soley for the wish recipient </li>
                                                <li> I have taken the necessary steps to confirm the account owner is authentic and I understand that Spenny Piggy will not be held responsible for any issues arising from a catfishing situation. </li>
                                                <li> I understand that by violating these terms I may be subject to legal action or can fall a victim of scams. </li>
                                                <li> I understand that by checking the box above and then clicking "CHECKOUT",I will have created a legally binding e-signature to this agreement. </li>
                                                <li> By providing an e-mail,you confirm that you are happy to receive marketing updates. You can opt out at anytime. </li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                                <div className="mt-4 flex items-center justify-center" >
                                    <button type="submit"
                                        className={`${!data.agree || processing ? "disabled" : ""} main-button p`}
                                        disabled={!data.agree || processing}>
                                        {processing ? 'Processing...' : `${reccure == 'onetime' ? `Subscribe Once ` : `Subscribe ${wish.subscription_period}`} `}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </Authenticated>
        </>
    );
}

import { useAlerts } from "@/Components/Alerts";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Countries from "@/includes/Countries";
import { useForm, Head } from "@inertiajs/react";
import React from "react";
import { useState } from "react";
import { useRef } from "react";
import Popup from '@/Components/Popup';

export default function Stripe(props) {
    const { auth, user, } = props;
    const checkRef = useRef();
    const { errorAlert } = useAlerts();
    const { data, setData, get, post, processing, errors, reset } = useForm({
        termaccept: "",
    });

    const [countryCurrency, setCountryCurrency] = useState();
    const [country, setCountry] = useState('');
    const getCountry = (e) => {
        if(e == ''){
            setCountry('')
        } else {
            const name = JSON.parse(e);
            setCountry((name && name.code) || "");
            setCountryCurrency((name && name.currency) || "");
        }
    };


    const [connecting, setConnecting] = useState(false);
    const checkTerms = () => {
        if (country == '') {
            errorAlert("Please choose your country.");
            return false;
        }
        setConnecting(true);
        if (checkRef.current.checked) {
            window.location.href = route("stripe.connect", {
                step: "init",
                country: country,
                currency: countryCurrency,
            });
            return true;
        } else {
            errorAlert("Please check accept terms & conditions checkbox");
            checkRef.current.focus();
            setConnecting(false);
            return false;
        }
    };

    return (
        <Authenticated auth={auth.user} user={user}>
            <Head title={""} />
            <div className="blackbg py-4 py-md-5  ">
                <div className="stripbox mb-2  mb-md-4 mx-auto border-mint whbg shadow-mint rounded-3xl ">
                    <div className="loginheadbox pinkbg">
                        <span className="mintbg"></span>
                        <span className="bluebg"></span>
                    </div>
                    {/* <form onSubmit={connectStripe}> */}
                    <div className="stripNote p-3 p-md-4">

                        <h4 className="font-bold mb-2 text-uppercase">
                            The following rules are required by our payment
                            processors to prevent rejection of your account.
                        </h4>

                        <p className="mb-4"> Stripe allows adult creators to use Spenny Piggy to process gifts within our terms of service. If stripe try to shut down your account for any reason, reach out to support and we can ensure you retain it. Providing none of the Items below are listed: </p>

                        <ul className="stripeterms">
                            <li className="py-1 my-1">
                                ❌ Selling goods or service on your wishlist
                            </li>
                            <li className="py-1 my-1">
                                ❌ Promising goods or services in exchange for
                                gifts
                            </li>
                            <li className="py-1 my-1">
                                ❌ Gifts with nudity in the item image
                            </li>
                            <li className="py-1 my-1">
                                ❌ Alcohol, Tobacco & Items containing THC
                            </li>
                            <li className="py-1 my-1">
                                ❌ Explicit Adult Toys.
                                <p className="text-small text-muted mb-0">
                                    Body massaging tools or similar sensual
                                    wellness products are. acceptable
                                </p>
                            </li>
                            <li className="py-1 my-1">
                                ❌ Items including the words: tax, fee, session,
                                deposit or unblock
                                <p className="text-small text-muted mb-0">
                                    These words imply a service being exchanged
                                    for items.
                                </p>
                            </li>
                            <li className="py-1 my-1">
                                ❌ Items with the word Tribute
                                <p className="text-small text-muted mb-0">
                                    Appreciation & Tip are acceptable.
                                </p>
                            </li>
                        </ul>





                                <strong className="d-block w-100 pt-3 mb-1">Choose Country</strong>
                                <Countries send={getCountry} />
                                <div className="text-center flex justify-center mb-4 ">
                                    <Popup modalclass="pinkmodal full stripe-terms shadow-pink ps-0"
                                        space="4" size="md"
                                        action={close} classes={`btn-pink mt-4 lg w-1/2`}
                                        text={`Accept TERMS`} >
                                            <div className="addgoal" >
                                                <h2 className="text-uppercase font-GillSans pb-4 font-large">Important notice !</h2>

                                                <p className='mb-2'><strong>Oink! @{auth && auth.user && auth.user.username}</strong></p>
                                                <p className='mb-2' > To comply with Stripes new rules, you must be posting exclusive content in:</p>

                                                <div className='d-block py-3' >
                                                    <h2 className='font-GillSans text-[20px] text-uppercase mb-2 w-full' >Membership</h2>
                                                    <h2 className='font-GillSans text-[20px] text-uppercase mb-2 w-full' >Bill</h2>
                                                    {/* <h2 className='font-GillSans text-[20px] text-uppercase mb-2 w-full' >FOR Members</h2> */}
                                                </div>

                                                <p className='mb-1 text-[17px]'>Please ensure you create an <b>Membership</b> and <b>Bill</b> for your fans. </p>
                                                {/* <p className='mb-1 text-[17px]'>That is a minimum of 2 posts per month.</p> */}
                                                <p className='mb-1 text-[17px]'>Oink! Oink! 🐷</p>
                                                <div className='termselect mt-4'>
                                                    <label htmlFor="termaccept">
                                                        <p className='text-[15px]' ><input type="checkbox" ref={checkRef} id="termaccept" name="termaccept" value="termaccept"
                                                            required onChange={(e) => setData("termaccept", e.target.value)}></input>
                                                            I confirm I will only use Spenny Piggy in line with the ToS and understand my account could be suspended for repeated violations. I also confirm that I will create and post exclusive content in exchange for receiving gifts, donations, subscriptions, memberships and bill payments. I also confirm that nothing on the above prohibited list will be added to my profile.
                                                        </p></label>
                                                </div>
                                                <button className='btn-pink md m-auto mt-4  d-table' onClick={() => { return checkTerms(); }}>{connecting ? 'Connecting...' : "Go to Stripe"}</button>
                                            </div>
                                    </Popup>
                                </div>


                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

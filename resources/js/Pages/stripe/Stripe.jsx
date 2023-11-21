import { useAlerts } from '@/Components/Alerts';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import Countries from '@/includes/Countries';
import { useForm, Link } from '@inertiajs/react';
import React from 'react';
import { useState } from 'react';
import { useRef } from 'react';

export default function Stripe(props) {
    
    const { auth, user } = props;
    const checkRef = useRef();
    const{errorAlert} = useAlerts();
    const {data, setData, get, post, processing, errors, reset} = useForm({
        termaccept: ''
    });

    const [country, setCountry] = useState(null);
    const getCountry = (e) => { 
        console.log("e", e);
        setCountry(e);
    }

    const connectStripe = (e) => {
        if (props?.auth?.user?.account_id || false) {
            get(route("stripe.connect", {step:"init"}));
        }
        else { post(route("stripe.connect", {step:"init"}))}
    }

    const checkTerms = () => {
        if(!country){
            errorAlert("Please choose your country.");
            return false;
        }
        if(checkRef.current.checked){ 
            window.location.href = route("stripe.connect", {step:"init", country:country});
            return true;
        }
        errorAlert("Please check accept terms & conditions checkbox");
        checkRef.current.focus();
        return false;
    }

    return (
        <Authenticated auth={auth.user} user={user} >
            <div className='blackbg py-4 py-md-5  '>
                <div className='stripbox mb-2  mb-md-4 mx-auto border-mint whbg shadow-mint rounded-3xl '>
                    
                    <div className='loginheadbox pinkbg'>
                        <span className='mintbg'></span>
                        <span className='bluebg'></span>
                    </div>

                    {/* <form onSubmit={connectStripe}> */}
                        <div className='stripNote p-3 p-md-4'>
                                <h4 className='font-bold mb-2 text-uppercase'>The following rules are required by our payment processors 
                                to prevent rejection of your account.</h4>

                                <p className='mb-4' >Stripe allows adult creators to use Spenny Piggy to process gifts within our terms of service. If stripe try to shut down your account for any reason, reach out to support and we can ensure you retain it. Providing none of the Items below are listed:</p>
                                <ul className='stripeterms' >
                                    <li className='py-1 my-1' >❌ Selling goods or service on your wishlist</li>
                                    <li className='py-1 my-1' >❌ Promising goods or services in exchange for gifts</li>
                                    <li className='py-1 my-1' >❌ Gifts with nudity in the item image</li>
                                    <li className='py-1 my-1' >❌ Alcohol, Tobacco & Items containing THC</li>
                                    <li className='py-1 my-1' >
                                    ❌ Explicit Adult Toys.
                                        <p className='text-small text-muted mb-0' >Body massaging tools or similar sensual wellness products are.
                                        acceptable</p>
                                    </li>
                                    <li className='py-1 my-1' >❌ Items including the words: tax, fee, session, deposit or unblock
                                        <p className='text-small text-muted mb-0' >These words imply a service being exchanged for items.</p>
                                    </li>
                                    <li className='py-1 my-1' >❌ Items with the word Tribute
                                        <p className='text-small text-muted mb-0' >Appreciation & Tip are acceptable.</p>
                                    </li>
                                </ul>

                            <strong className='d-block w-100 pt-3 mb-1'>Choose Country</strong>
                            <Countries send={getCountry} />

                            <div className='termselect mt-4'>
                                <label htmlFor="termaccept">
                                    <p><input type="checkbox" ref={checkRef} id="termaccept" name="termaccept" value="termaccept"
                                    required onChange={(e) => setData("termaccept", e.target.value)}></input> 
                                    Keep that and add after wishlist, And confirm that nothing on the prohibited list above will be listed.
                                </p></label>
                            </div>

                        </div>
                        <div className="text-center flex justify-center mb-4 ">
                            <button className='btn-pink lg w-1/2' onClick={ () => {return checkTerms();}}>Go to Stripe</button>
                        </div>
                    {/* </form> */}
                </div>
            </div>
        </Authenticated>
    )
}


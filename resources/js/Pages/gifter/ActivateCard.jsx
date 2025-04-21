import React from "react";
import LoaderButton from "@/Components/LoaderButton";
import { useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";

export default function ActivateCard() {

    const {auth} = usePage().props;
    const [loading, setLoading] = useState(false);
    const checkTerms = () => {
        if(loading) return;
        setLoading(true);
        axios.get(`gifter-card-verification`).then((resp) => {
            window.location.href = resp?.data?.checkout_url;
            setLoading(false);
        }).catch((_err) => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    return (
        <>
        <div className='blackbg'>
                <div className=' mb-md-4 mx-auto border-mint whbg shadow-mint rounded-[30px]'>
                    <div className='loginheadbox pinkbg'>
                        <span className='mintbg'></span>
                        <span className='bluebg'></span>
                    </div>

                    
                    <div className='py-4'>
                        <div className='stripNote p-3 p-md-4'>
                            <h4 className='text-[30px] font-GillSans text-center text-uppercase mb-3'>Activate Account</h4>
                            <p className='mb-1 text-[18px] text-center'> To activate your card and unlock the ability to make payments on our platform, simply click the button below and complete a one-time verification fee of £1. This quick and secure process ensures the safety of all transactions and helps us maintain a trusted environment for our users. Once your card is activated, you’ll be able to seamlessly make purchases and access all payment features on the website.</p>
                            {auth?.user?.address_verification_error ? 
                                <div className="mt-4 text-center">
                                    <strong className="text-red-600">Verification Rejected</strong>
                                    <p className="text-red-600">{auth?.user?.address_verification_error}</p>
                                </div> 
                            : ''}
                        </div>

                        <div className='text-center flex justify-center mb-2'>
                            <LoaderButton 
                            onClick={checkTerms}
                            disabled={loading}
                            className={'p-3 lg'}
                            spinnerClassName="fill-red-600"> Activate Account</LoaderButton>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

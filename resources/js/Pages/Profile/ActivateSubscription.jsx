import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import Countries from '@/includes/Countries';
import { useForm, Head } from '@inertiajs/react';
import React from 'react';
import { useState } from 'react';
import { useRef } from 'react';

export default function ActivateSubscription(props) {

    const { auth, user } = props;
    const checkRef = useRef();
    const { errorAlert } = useAlerts();
    const { data, setData, get, post, processing, errors, reset } = useForm({
        termaccept: ''
    });

    const [country, setCountry] = useState('GB');
    const getCountry = (e) => {
        setCountry(e);
    }

    const [loading, setLoading] = useState(false);
    const checkTerms = () => {
      setLoading(true);
      window.location.href = route("mandatory.checkout");
    }

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={"Set up Subscription"} />
            <div className='blackbg py-4 py-md-5'>
                <div className='stripbox mb-md-4 mx-auto border-mint whbg shadow-mint rounded-3xl'>
                    <div className='loginheadbox pinkbg'>
                        <span className='mintbg'></span>
                        <span className='bluebg'></span>
                    </div>
                    <div className='py-4'>
                        <div className='stripNote p-3 p-md-4'>
                            <h4 className='text-[30px] font-GillSans text-center text-uppercase mb-3'>Set up Subscription</h4>
                            <p className='mb-4 text-[18px] text-center'>
                                Enjoy a <span className='text-green-500 font-bold'>3-days free trial</span> before your monthly subscription begins! Stripe charges £2 a month for this service, and we add a £2 administrator charge due to heightened compliance requirements.
                            </p>
                                <p className='font-semibold text-center text-green-600 text-lg'>Start your subscription today and pay nothing for the first 3 days!</p>
                        </div>
                        <div className='text-center flex justify-center mb-4'>
                            <LoaderButton onClick={checkTerms}
                                disabled={loading}
                                className={'p-3 lg'}
                                spinnerClassName="fill-red-600">
                                {loading ? "Activating.." : "Start Free Trial"}
                            </LoaderButton>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    )

}


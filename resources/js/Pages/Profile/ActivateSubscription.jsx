import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import Countries from '@/includes/Countries';
import { useForm, Head } from '@inertiajs/react';
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
            <Head title={"Activate Subscription"} />
            <div className="blackbg py-10 flex items-center lg:h-[85vh] md:py-10 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="whbg shadow-voilet border-voilet rounded-[40px]  overflow-hidden">
                        <div className="pinkbg px-6 py-4 !border-b-[3px] flex items-center">
                            <span className="border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block"></span>
                            <span className="border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block"></span>
                            <span className="border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block"></span>
                        </div>

                        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h1 className="text-xl md:text-3xl font-GillSans uppercase mb-3">Activate Your Membership</h1>
                                <p className="text-[16px] md:text-[18px] text-black/80 mb-6">Enjoy a <span className="text-green-700 font-semibold">3‑day free trial</span> before your monthly subscription begins. Stripe charges £2/month for the service, plus a £2 admin charge due to compliance.</p>
                                <ul className="space-y-3 text-[15px] md:text-[16px]">
                                    <li className="flex items-start gap-3"><span className="w-2.5 h-2.5 rounded-full bg-[#05EFB8] mt-2"></span><span>Instant access to creator tools and member benefits</span></li>
                                    <li className="flex items-start gap-3"><span className="w-2.5 h-2.5 rounded-full bg-[#05EFB8] mt-2"></span><span>Cancel any time during the trial, no charge</span></li>
                                    <li className="flex items-start gap-3"><span className="w-2.5 h-2.5 rounded-full bg-[#05EFB8] mt-2"></span><span>Secure billing powered by Stripe</span></li>
                                </ul>
                                <div className="mt-8">
                                    <div className="flex items-center gap-3 text-sm text-black/60">
                                        <span className="inline-block w-2 h-2 rounded-full bg-[#924DFF]"></span>
                                        <span>Your free trial starts immediately after activation</span>
                                    </div>
                                </div>
                            </div>
                            <div className='lg:ps-[30px]'>
                                <div className="border border-black rounded-[40px]   !p-4 md:!p-6">
                                    <div className="flex items-baseline font-poppins justify-between">
                                        <div>
                                            {/* <p className="text-sm text-black/60">Billing</p> */}
                                            <p className="font-poppins text-xl md:text-2xl font-bold">£4/month</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs bg-[#05EFB8] text-black">3‑day free trial</span>
                                    </div>
                                    <div className="mt-4 text-sm text-black/70">Includes £2 Stripe service fee and £2 admin charge</div>
                                    <div className="mt-6">
                                        <LoaderButton onClick={checkTerms} disabled={loading} className={"button p w-full size-lg"} spinnerclass="fill-red-600">
                                            {loading ? "Activating.." : "Activate Subscription"}
                                        </LoaderButton>
                                    </div>
                                    <div className="mt-4 text-xs text-black/60">By continuing, you agree to the Membership Terms and recurring billing. You can cancel at any time before the trial ends.</div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                                    <div className="border border-black rounded-[40px]  p-2">
                                        <p className="text-xs text-black/60">Secure Payments</p>
                                        <p className="text-sm font-medium">Powered by Stripe</p>
                                    </div>
                                    <div className="border border-black rounded-[40px]  p-2">
                                        <p className="text-xs text-black/60">Support</p>
                                        <p className="text-sm font-medium">Priority Assistance</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Authenticated>
    )

}

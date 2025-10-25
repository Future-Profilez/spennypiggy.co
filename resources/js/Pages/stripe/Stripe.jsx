import { useAlerts } from "@/Components/Alerts";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Countries from "@/includes/Countries";
import { useForm, Head } from "@inertiajs/react";
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
    const adminIdentityApproved = auth?.user?.identity_admin_status === 1;
    const finalStepsUnlocked = auth?.user?.profile_status_lock == 2;
    const checkTerms = () => {
        if (country == '') {
            errorAlert("Please choose your country.");
            return false;
        }
        if (!finalStepsUnlocked) {
            errorAlert("Complete admin profile approval before connecting Stripe.");
            return false;
        }
        if (!adminIdentityApproved) {
            errorAlert("Your identity is awaiting admin approval. Stripe connection is disabled until approved.");
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
            <Head title="Connect Stripe Account - Spenny Piggy" />
            <div className="bg-white min-h-screen py-12 md:py-20">
                <div className="max-width-800 mx-auto px-4">
                    {/* Header Section */}
                    <div className="text-center mb-2">
                        <h1 className="text-[29px] font-gulfs uppercase text-pink mb-1">
                            Connect Your Stripe Account
                        </h1>
                        <p className="text-black text-lg font-CeraGR max-w-2xl mx-auto mb-4 ">
                            Set up secure payments to start receiving gifts and donations from your fans
                        </p>
                    </div>

                    {/* Gating Banner */}
                    {!finalStepsUnlocked && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg text-yellow-800">
                            <p className="font-semibold">Admin Profile Approval Required</p>
                            <p className="text-sm">Complete your basic profile and submit for admin approval to unlock payment setup.</p>
                        </div>
                    )}
                    {finalStepsUnlocked && !adminIdentityApproved && (
                        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-blue-800">
                            <p className="font-semibold">Identity Under Admin Review</p>
                            <p className="text-sm">Your identity documents are verified by Stripe and awaiting admin approval. Stripe connection will be available once approved.</p>
                        </div>
                    )}

                    {/* Main Content Card */}
                    <div className="whbg overflow-hidden">
                        <div className="">
                            {/* Payment Processor Guidelines */}
                            <div className="mb-8">
                                <div className="flex justify-center mt-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl text-center font-bold text-gray-800 font-gulfs uppercase">
                                            Payment Guidelines
                                        </h2>
                                        <p className="text-gray-600 text-center">Required by Stripe to prevent account rejection</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                                    <p className="text-gray-700 leading-relaxed">
                                        <strong className="text-voilet">Stripe supports adult creators</strong> using Spenny Piggy to process gifts within our terms of service. 
                                        If Stripe attempts to restrict your account, contact our support team for assistance. 
                                        Please ensure none of the following prohibited items are listed:
                                    </p>
                                </div>

                                {/* Prohibited Items Grid */}
                                <div className="grid md:grid-cols-1 gap-1 mb-8">
                                    {[
                                        {
                                            icon: "🛍️",
                                            title: "Selling goods or services",
                                            subtitle: "on your wishlist"
                                        },
                                        {
                                            icon: "🤝",
                                            title: "Promising goods or services",
                                            subtitle: "in exchange for gifts"
                                        },
                                        {
                                            icon: "🖼️",
                                            title: "Gifts with nudity",
                                            subtitle: "in the item image"
                                        },
                                        {
                                            icon: "🚬",
                                            title: "Alcohol, Tobacco & THC items",
                                            subtitle: "Prohibited substances"
                                        },
                                        {
                                            icon: "🔞",
                                            title: "Explicit Adult Toys",
                                            subtitle: "Sensual wellness products are acceptable"
                                        },
                                        {
                                            icon: "💰",
                                            title: "Service-related words",
                                            subtitle: "tax, fee, session, deposit, unblock"
                                        },
                                        {
                                            icon: "👑",
                                            title: "Word 'Tribute'",
                                            subtitle: "Use 'Appreciation' or 'Tip' instead"
                                        }
                                    ].map((item, index) => (
                                        <div key={index} className="bg-white border-2 border-red-100 rounded-xl p-3 hover:border-red-200 transition-colors">
                                            <div className="flex items-center  gap-2">
                                                <span className="text-2xl">{item.icon}</span>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 mb-1">
                                                        ❌ {item.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{item.subtitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Country Selection */}
                            <div className="mb-2">
                                <div className="bg-gradient-to-r from-mint/10 to-voilet/10 rounded-2xl p-6">
                                    <h3 className="text-normal text-center font-bold text-gray-800 mb-2 capitalize">
                                        Select Your Country
                                    </h3>
                                    <div className="max-w-md m-auto">
                                        <Countries send={getCountry} />
                                    </div>
                                </div>
                            </div>

                            {/* Terms and Connect Button */}
                            <div className="text-center">
                                <Popup 
                                    modalclassName="pinkmodal full stripe-terms shadow-pink ps-0"
                                    space="4" 
                                    size="md"
                                    action={close} 
                                    classes={` ${country == null || country == '' ? 'disabled' : ''} ${(!finalStepsUnlocked || !adminIdentityApproved) ? 'disabled' : ''} btn-pink sm  hover:shadow-voilet transition-all duration-300 transform hover:scale-105`}
                                    text="Review Terms & Connect Stripe"
                                >
                                    <div className="">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">🐷</span>
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-800 font-GillSans uppercase mb-2">
                                                Important Notice!
                                            </h2>
                                            <p className="text-lg text-pink font-semibold">
                                                Oink! @{auth?.user?.username}
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
                                            <p className="text-gray-700 mb-4">
                                                To comply with Stripe's new requirements, you must be posting exclusive content in:
                                            </p>
                                            
                                            <div className="grid grid-cols-1 gap-2 mb-4">
                                                <div className="bg-white rounded-[30px] p-2 text-center border-2 border-voilet">
                                                    <h3 className="font-bold text-voilet text-normal">MEMBERSHIP</h3>
                                                </div>
                                                <div className="bg-white rounded-[30px] p-2 text-center border-2 border-pink">
                                                    <h3 className="font-bold text-pink text-normal">BILLS</h3>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-gray-700">
                                                <p>Please ensure you create <strong>Membership</strong> and <strong>Bill</strong> content for your fans.</p>
                                                <p className="text-pink font-semibold">Oink! Oink! 🐷</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                            <label htmlFor="termaccept" className="flex items-start space-x-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    ref={checkRef} 
                                                    id="termaccept" 
                                                    name="termaccept" 
                                                    value="termaccept"
                                                    required 
                                                    onChange={(e) => setData("termaccept", e.target.value)}
                                                    className="mt-1 w-5 h-5 text-pink border-2 border-gray-300 rounded focus:ring-pink focus:ring-2"
                                                />
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    I confirm I will only use Spenny Piggy in line with the Terms of Service and understand my account could be suspended for repeated violations. I also confirm that I will create and post exclusive content in exchange for receiving gifts, donations, subscriptions, memberships and bill payments. I also confirm that nothing on the above prohibited list will be added to my profile.
                                                </p>
                                            </label>
                                        </div>

                                        <div className="flex justify-center">
                                            <button 
                                                className="button p transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
                                                onClick={checkTerms}
                                                disabled={connecting || !finalStepsUnlocked || !adminIdentityApproved} >
                                                {connecting ? (
                                                    <span className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Connecting to Stripe...
                                                    </span>
                                                ) : (
                                                    "Connect to Stripe"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-6 py-3">
                            <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-black text-sm">
                                Secured by Stripe - Industry-leading payment security
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

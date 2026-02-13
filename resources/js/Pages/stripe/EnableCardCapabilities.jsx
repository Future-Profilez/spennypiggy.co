import { Link } from "@inertiajs/react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function EnableCardCapabilities({charges}) {

    const [loading, setLoading] = useState(false);
  return (
    <div className="w-full mb-6 bg-white rounded-[30px] md:rounded-[40px]  shadow-sm border-2 border-pink-500 overflow-hidden">
        <div className="flex">
            <div className="w-1.5 bg-[#F94F96]"></div>
            <div className="flex-1 p-8">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-pink-50 text-[#F94F96]">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl leading-tight">Enable Card Payments</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#F94F96]">
                                    Action Required
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-gray-600 mb-6 text-base leading-relaxed">
                    Your Stripe account is not fully enabled. Please click below to complete the Stripe onboarding and enable payments.
                </p>

                <a 
                    onClick={() => setLoading(!loading)}
                    href="/stripe/enable_card_payments"
                    className="block w-full text-center bg-[#F94F96] hover:bg-pink-600 text-white font-gulfs uppercase text-lg py-3 px-6 rounded-full transition-all duration-200 btn-shadow active:transform active:scale-[0.99]"
                >
                    {loading ? "Loading..." : "Enable Card Payments"} 
                </a>
            </div>
        </div>
    </div>
  );
}

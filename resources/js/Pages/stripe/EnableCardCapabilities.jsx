import { Link } from "@inertiajs/react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function EnableCardCapabilities({charges}) {

    const [loading, setLoading] = useState(false);
  return (
    <div className="w-full mb-6 bg-white rounded-box border-2 border-[#FF007F] overflow-hidden">
        <div className="flex">
            <div className="w-1.5 shrink-0 bg-[#FF007F]"></div>
            <div className="min-w-0 flex-1 p-5 sm:p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-pink-50 text-[#FF007F]">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl leading-tight">Enable Card Payments</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#FF007F]">
                                    Action Required
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-black/80 mb-6 text-base leading-relaxed">
                    Your Stripe account is not fully enabled. Please click below to complete the Stripe onboarding and enable payments.
                </p>

                <a
                    onClick={() => setLoading(!loading)}
                    href="/stripe/enable_card_payments"
                    className="flex min-h-[48px] w-full items-center justify-center rounded-box-sm bg-[#FF007F] px-6 py-3 text-center font-gulfs text-sm uppercase text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 md:text-[17px]"
                >
                    {loading ? "Loading..." : "Enable Card Payments"} 
                </a>
            </div>
        </div>
    </div>
  );
}

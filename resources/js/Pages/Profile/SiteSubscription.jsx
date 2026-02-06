import { Link } from "@inertiajs/react";

export default function SiteSubscription({ charges, user }) {

    // Enable button only when all approvals are completed
    const isEnabled =
        user?.social_links?.status === 1 &&
        user?.avatar_approved === 1 &&
        user?.bio_approved === 1;

    return (
        <div className="w-full finishs mb-4 rounded-xl  bg-white !border-voilet shadow-voilet">

            <div className="border-bottom border-voilet !border-0">
                <h2 className="text-large font-GillSans text-uppercase p-3 goaltitle text-white btn-shadow pinkbg">
                    Subscription Status
                </h2>
            </div>

            <div className="p-4">
                <p className="mb-4 text-[15px] font-poppins text-center text-gray-700">
                    Enjoy a{" "}
                    <span className="text-green-700 font-bold uppercase">
                        3-days free trial
                    </span>{" "}
                    before your monthly subscription begins! Stripe charges £2
                    per month, plus a £2 administrator fee due to compliance
                    requirements.
                </p>

                <Link
                    href={isEnabled ? "/activate-subscription" : "#"}
                    onClick={(e) => !isEnabled && e.preventDefault()}
                    className={`btn-pink text-sm btn-shadow w-full block text-center 
                        bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 transition-all duration-200
                        ${!isEnabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""}
                    `}
                >
                    Start Free Trial
                </Link>

                {!isEnabled && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                        Please ensure your avatar, bio, and social links are approved before activating your subscription.
                    </p>
                )}
            </div>

        </div>
    );
}

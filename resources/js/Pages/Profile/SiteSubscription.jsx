import { Link } from "@inertiajs/react";

export default function SiteSubscription({ auth, subscription_status, user, card_capabilities }) {
    const isEnabled =
        user?.social_links?.status === 1 &&
        user?.avatar_approved === 1 &&
        user?.bio_approved === 1 && 
        card_capabilities;

    return (
        <div className="w-full finishs mb-6 p-6 rounded-[30px] md:rounded-[40px]   bg-white  border-2 !border-pink-500  ">

            <h2 className="text-xl font-bold capitalize pb-3 goaltitle text-black  ">
                Subscription Status
            </h2>
                <p className="mb-4 text-[15px] font-poppins text-start text-gray-700">
                    Enjoy a{" "}
                    <span className="text-green-700 font-bold uppercase">
                        3-days free trial
                    </span>{" "}
                    before your monthly subscription begins! Stripe charges £2
                    per month, plus a £2 administrator fee due to compliance
                    requirements.
                </p>

                <Link href={"/activate-subscription"}
                    // onClick={(e) =>  {
                    //     if(!isEnabled && user?.profile_status_lock == 1 ){
                    //         toast.error("Please ensure your avatar, bio, and social links are approved before activating your subscription."),
                    //         e.preventDefault()
                    //     }
                    // }}
                    className={`btn-pink text-sm sm:text-normal md:text-[17px] btn-shadow w-full block text-center 
                    bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 transition-all duration-200
                    ${subscription_status == 0 || isEnabled  ? "" :
                    "cursor-not-allowed opacity-50 pointer-events-none"
                    }`} >
                    { auth?.user?.profile_status_lock == 1 ? "Restart Subscription Again" : "Start Free Trial" }
                </Link>

                {!isEnabled && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                        {!card_capabilities 
                            ? (
                                <span>
                                    Please <a href="/stripe/enable_card_payments" className="underline font-bold text-red-700 hover:text-red-800">enable card payments</a> to activate your subscription.
                                </span>
                            )
                            : "Please ensure your avatar, bio, and social links are approved before activating your subscription."}
                    </p>
                )}

        </div>
    );
}

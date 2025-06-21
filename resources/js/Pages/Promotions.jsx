import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";

export default function Promotions(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth.user} user={user}>
            <Head title={'Summer Promotion Terms - 5% Extra Earnings – June & July 2025'}  />
            <div className="wishlistPage blackbg pt-8 pb-14 ">
                <div className="containerbox static-page p-3">
                 <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
                    <h1 className="text-3xl font-bold text-pink-600 mb-6">
                        Spenny Piggy "5% Extra Earnings" Summer Promotion Terms – June & July 2025
                    </h1>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Promotion Overview</h2>
                        <p>
                        Creators who sign up and complete their account activation on{" "}
                        <span className="font-medium">SpennyPiggy.co</span> between{" "}
                        <strong>1 June 2025</strong> and <strong>31 July 2025</strong> ("Promotion Period")
                        will be eligible to receive an extra <strong>5%</strong> on top of their monthly earnings for
                        a period of <strong>12 months</strong> from the date of activation.
                        </p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Eligibility Criteria</h2>
                        <ul className="list-disc list-inside space-y-1">
                        <li>You must be a new creator who registers and activates an account during the Promotion Period.</li>
                        <li>Your account must remain in good standing throughout the 12-month bonus period.</li>
                        <li>You must comply with Spenny Piggy’s standard Terms of Service and community guidelines at all times.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Bonus Earnings Details</h2>
                        <ul className="list-disc list-inside space-y-1">
                        <li>The additional 5% bonus applies to all earnings generated on SpennyPiggy.co.</li>
                        <li>Chargebacks, refunds, or reversed transactions are excluded from bonus calculations.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Bonus Payment Terms</h2>
                        <ul className="list-disc list-inside space-y-1">
                        <li>The 5% bonus is calculated monthly based on net eligible earnings.</li>
                        <li>Payments will be made within 14 days after the end of each month to the creator’s connected Stripe balance.</li>
                        <li>Bonus amounts are subject to fees, taxes, and payout policy adjustments.</li>
                        <li>Payouts must meet minimum threshold requirements for the bonus to apply.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Duration</h2>
                        <p>
                        The bonus is applied for <strong>12 consecutive months</strong> from the date of account activation.
                        After this period, standard payout rates will resume without the additional 5% bonus.
                        </p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">General Conditions</h2>
                        <ul className="list-disc list-inside space-y-1">
                        <li>Spenny Piggy reserves the right to change or cancel the promotion at any time without prior notice.</li>
                        <li>Accounts that are closed, suspended, or violate policies forfeit remaining bonus eligibility.</li>
                        <li>This offer is non-transferable and cannot be combined with other promotions unless explicitly stated.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">Disputes</h2>
                        <p>
                        Any disputes about bonus payments will be handled according to Spenny Piggy’s standard dispute resolution procedures.
                        </p>
                    </section>
                    </div>
                </div>
            </div>
        </Guest>
    );
}

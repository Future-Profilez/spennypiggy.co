import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";

export default function Promotions(props) {
    const { auth, user } = props;

    const print = () => {
        window.print();
    };
    return (
        <Guest auth={auth.user} user={user}>
            <Head title={"Spenny Piggy — Founder Bonus (Terms & Conditions)"} />
            <div className="wishlistPage bg-white pt-8">
                <div className="containerbox p-3">
                    <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
                        <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">
                            Founder Bonus — We’ll Pay You to Get Spoiled
                        </h1>

                        <header class="bg-white rounded-2xl  shadow-sm">
                            <div class="max-w-6xl mx-auto px-3 py-3 md:px-6 md:py-6 md:flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                        SP
                                    </div>
                                    <div>
                                        <h1 class="text-lg font-semibold">
                                            Spenny Piggy
                                        </h1>
                                        <p class="text-sm text-gray-500">
                                            Founder Bonus — Promotion Terms
                                            &amp; Conditions
                                        </p>
                                    </div>
                                </div>
                                <div class="mt-4 md:mt-0 md:text-right text-sm text-gray-500">
                                    <div>
                                        Last updated:{" "}
                                        <strong>18 October 2025</strong>
                                    </div>
                                    <div class="mt-1 no-print">
                                        <button onClick={print}
                                            class="inline-block px-3 py-1 border rounded-md text-sm"
                                        >
                                            Print / Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <main class="max-w-6xl mx-auto">
                            <section class="accent mt-12 ">
                                <h2 class="text-lg md:text-2xl font-bold">
                                    🐷 Founder Bonus — We’ll Pay You to Get
                                    Spoiled
                                </h2>
                                <p class="mt-2 text-gray-600">
                                    Be among the first{" "}
                                    <strong>150 verified creators</strong> to
                                    join Spenny Piggy and hit{" "}
                                    <strong>£2,500 / $3,000</strong> in
                                    supporter earnings within 30 days to unlock
                                    a <strong>12‑month Founder Bonus</strong>.
                                </p>

                                <div class="mt-6 grid grid-cols-1 md:grid-cols-1 gap-2">
                                    <div class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border">
                                        <h3 class="font-bold text-black">
                                            How the Bonus Works
                                        </h3>
                                        <ul class="mt-3 space-y-2 text-sm text-gray-700">
                                            <li>
                                                Each month for 12 months you
                                                receive an extra{" "}
                                                <strong>10%</strong> of Spenny
                                                Piggy's platform fee collected
                                                from your supporters.
                                            </li>
                                            <li>
                                                Example: if supporters spend{" "}
                                                <strong>£5,000</strong> in a
                                                month and our fee is{" "}
                                                <strong>20%</strong>, you get
                                                10% of that platform fee as a
                                                bonus.
                                            </li>
                                            <li>
                                                To keep the bonus active, earn
                                                between{" "}
                                                <strong>£500–£10,000</strong>{" "}
                                                (or $600–$12,000) each month.
                                                Dropping below for two
                                                consecutive months ends the
                                                bonus.
                                            </li>
                                        </ul>
                                    </div>

                                    <div class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border">
                                        <h3 class="font-bold text-black">
                                            Quick Facts
                                        </h3>
                                        <ul class="mt-3 space-y-2 text-sm text-gray-700">
                                            <li>
                                                Limited to the first{" "}
                                                <strong>
                                                    150 qualified creators
                                                </strong>
                                                .
                                            </li>
                                            <li>
                                                Open to creators in the{" "}
                                                <strong>UK &amp; US</strong>.
                                            </li>
                                            <li>
                                                Bonus payments made monthly via{" "}
                                                <strong>Stripe</strong>.
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="mt-8">
                                    <h3 class="font-bold text-lg pt-6">
                                        Eligibility &amp; Promotion Period
                                    </h3>
                                    <p class="mt-3 text-sm text-gray-700">
                                        Open to verified Spenny Piggy creators,
                                        18+, legally resident in the United
                                        Kingdom or the United States. Business
                                        entities may participate through an
                                        authorised representative. The promotion
                                        starts on{" "}
                                        <strong>18 October 2025</strong> and
                                        runs until the first 150 eligible
                                        creators qualify or the promotion is
                                        closed.
                                    </p>
                                </div>

                                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
                                    <article class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border">
                                        <h4 class="font-semibold">
                                            How to Qualify
                                        </h4>
                                        <ol class="mt-3 ml-4 list-decimal text-sm text-gray-700 space-y-2">
                                            <li>
                                                Register and complete full KYC
                                                verification during the
                                                Promotion Period.
                                            </li>
                                            <li>
                                                Earn £2,500 GBP (or $3,000 USD)
                                                in eligible supporter payments
                                                within your first 30 days of
                                                verification.
                                            </li>
                                            <li>
                                                Remain compliant with the Spenny
                                                Piggy User Agreement and
                                                platform rules.
                                            </li>
                                        </ol>
                                    </article>

                                    <article class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border">
                                        <h4 class="font-semibold">
                                            Bonus Award Details
                                        </h4>
                                        <ul class="mt-3 text-sm text-gray-700 space-y-2">
                                            <li>
                                                Qualified creators receive a
                                                12-month Founder Bonus equal to
                                                10% of the platform fee
                                                collected on their supporter
                                                volume each month.
                                            </li>
                                            <li>
                                                Bonus paid monthly to the
                                                creator’s Spenny Piggy account
                                                balance within 30 days of
                                                month-end.
                                            </li>
                                            <li>
                                                Failure to meet monthly
                                                thresholds for two consecutive
                                                months ends the bonus
                                                permanently.
                                            </li>
                                        </ul>
                                    </article>
                                </div>

                                <div class="mt-6">
                                    <h4 class="font-bold text-lg pt-6">
                                        Limits, Verification &amp; Taxes
                                    </h4>
                                    <p class="mt-3 text-sm text-gray-700">
                                        Each creator account may qualify once.
                                        Fraud, chargebacks, or breaches void
                                        eligibility. All amounts are subject to
                                        applicable tax withholding and reporting
                                        under UK and US law. Creators are
                                        responsible for declaring income taxes
                                        arising from bonus payments.
                                    </p>
                                </div>

                                <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-2  lg:gap-4">
                                    <div class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border text-sm">
                                        <strong>Currency &amp; Payments</strong>
                                        <p class="mt-2 text-gray-600">
                                            Qualifying amounts &amp; bonuses are
                                            in GBP or USD at the prevailing
                                            exchange rate on the payment date.
                                            Payments via Stripe.
                                        </p>
                                    </div>
                                    <div class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border  text-sm">
                                        <strong>Modification</strong>
                                        <p class="mt-2 text-gray-600">
                                            Spenny Piggy may modify or cancel
                                            the Promotion for legal, technical,
                                            or operational reasons. Changes
                                            won't affect creators who already
                                            qualified prior to the change.
                                        </p>
                                    </div>
                                    <div class="bg-gray-50 p-3 sm:p-4 rounded-[20px] border text-sm">
                                        <strong>Liability</strong>
                                        <p class="mt-2 text-gray-600">
                                            Spenny Piggy accepts no
                                            responsibility for technical errors
                                            or delays beyond reasonable control.
                                            Liability exclusions apply to the
                                            maximum extent permitted by law.
                                        </p>
                                    </div>
                                </div>

                                <div class="text-sm text-gray-700">
                                    <p className="mt-6">
                                        For questions about the Promotion, email <a className="text-voilet" href="mailto:support@spennypiggy.co" >support@spennypiggy.co</a> or write to:
                                        Social Vortex Ltd, 55 Colmore Row, Birmingham, England, B3 2AA (UK)
                                        or 1111B S Governors Ave STE 7527, Delaware, United States (US).
                                    </p>
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        </Guest>
    );
}

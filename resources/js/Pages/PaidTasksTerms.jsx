import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
 
export default function PaidTasksTerms(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title={"Paid Tasks — Terms Summary"} />
            <div className="wishlistPage bg-white pt-8">
                <div className="containerbox p-3">
                    <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
                        <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">
                            Paid Tasks — Terms Summary (Creator-Facing)
                        </h1>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">What Paid Tasks Are</h2>
                        <p className="mb-6">
                            Paid Tasks allow supporters to submit paid requests to creators. Creators may accept or
                            decline any request at their sole discretion.
                        </p>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">Payment & Payouts</h2>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Supporter payments are authorised and secured via Stripe at the time a Paid Task is submitted.</li>
                            <li>Funds are routed to the creator upon successful task completion or in accordance with the specific payment flow (e.g., 'Paid Task' vs 'Standard').</li>
                            <li>Creators receive payouts after delivery is confirmed or the task period concludes, subject to platform policies.</li>
                        </ul>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">Acceptance &amp; Control</h2>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Creators are never required to accept a Paid Task.</li>
                            <li>Creators set the price, scope, and deadline for any task they choose to accept.</li>
                            <li>Acceptance of a Paid Task does not create an employment, service, or ongoing obligation.</li>
                        </ul>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">Delivery &amp; Timeframes</h2>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Each Paid Task includes a clearly defined delivery window set by the creator.</li>
                            <li>If a task is not delivered within the agreed timeframe, the platform may automatically process a refund to the supporter.</li>
                            <li>Extensions or changes are optional and at the creator’s discretion.</li>
                        </ul>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">Refunds</h2>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Refunds are handled solely by the platform, not the creator directly.</li>
                            <li>Refund eligibility is based on non-delivery, not subjective satisfaction.</li>
                            <li>Delivered tasks are considered complete once submitted in the agreed format.</li>
                        </ul>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">No Guarantees</h2>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Paid Tasks do not guarantee earnings, income levels, or request volume.</li>
                            <li>The platform does not guarantee task acceptance, completion, or outcomes.</li>
                        </ul>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">Prohibited Use</h2>
                        <p className="mb-3">Paid Tasks may not be used for:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Illegal activity</li>
                            <li>Financial coercion or fraud</li>
                            <li>Services requiring professional licensing</li>
                            <li>Physical harm or real-world enforcement</li>
                            <li>Anything prohibited by platform policies or payment providers</li>
                        </ul>

                        <div className="my-6 h-px w-full bg-gray-200" />

                        <h2 className="text-lg md:text-2xl font-semibold mb-3">Platform Role</h2>
                        <p className="mb-2">
                            The platform acts as a neutral payment facilitator and workflow provider, not a party to the task itself.
                        </p>
                    </div>
                </div>
            </div>
        </Guest>
    );
}

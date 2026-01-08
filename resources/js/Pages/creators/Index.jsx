import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function Index() {
  return (
    <>
      <Head title="Creators — Keep 100%. We Protect Your Payouts.">
        <link rel="canonical" href="/creators" />
      </Head>
      <Guest>
        <div className="wishlistPage bg-white pt-8">
          <div className="containerbox p-3">
            <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
              <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-2">
                Creators Keep 100%.
              </h1>
              <h2 className="text-lg md:text-2xl font-semibold mb-3">We Protect Your Payouts.</h2>
              <p className="mb-6">All-in-one monetisation tools for creators who want real spending, live support, and long-term account safety.</p>
              
               <div className='flex'>
                <Link href="/register" className="button b !px-6 !py-3">Start Free Creator Trial</Link>
              </div>
              <div className="text-sm mt-3">3 days free • £4/month after • Cancel anytime</div>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Why Creators Choose This</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Live Chat Support (Real Humans) — Get help when money is on the line, not days later</li>
                <li>Founder Bonuses for Early Creators — Early adopters unlock extra rewards and priority perks</li>
                <li>Creators Keep 100% — No revenue cuts. Supporters pay the platform fee</li>
                <li>Payout & Chargeback Protection — Disputes handled by the platform, not you</li>
                <li>Stripe-Aligned by Design — Built to avoid freezes, shutdowns, and clawbacks</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Founder Bonuses for Early Creators</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Available to early creators only</li>
                <li>Rewards based on platform activity</li>
                <li>Priority access to new monetisation tools</li>
                <li>Limited availability — once filled, it’s gone</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Built to Drive Higher-Value Spending</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Supporters spend more on gifts, tasks, and bills</li>
                <li>Multiple ways for supporters to pay — not just tips</li>
                <li>Tools designed for repeat spending, not one-offs</li>
                <li>Works alongside your existing platforms</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Your Full Monetisation Toolkit</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Wishlist Gifting — Supporters buy real items, not low-value tips</li>
                <li>Paid Tasks — Set rules, deadlines, and prices for supporter requests</li>
                <li>Bills & Contributions — Let supporters help with real-world costs</li>
                <li>Intro Video — Convert new supporters faster with context</li>
                <li>Leaderboards — Gamify spending and reward top supporters</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Why Your Account Stays Safe Here</h2>
              <p className="mb-4">Payment accounts get shut down when money arrives without a clear reason.</p>
              <p className="mb-3">That’s why Spenny Piggy:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Enforces clear usage and content rules</li>
                <li>Links every payment to a platform feature</li>
                <li>Sends monthly reminders to creators</li>
                <li>Keeps transaction records Stripe expects</li>
              </ul>
              <p className="mb-6">This is why Stripe remains an option.</p>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Disputes Are Our Problem — Not Yours</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Delivery receipts on every transaction</li>
                <li>Time-stamped activity logs</li>
                <li>Platform-managed dispute handling</li>
                <li>Creators are never debited</li>
              </ul>
              <p className="mb-6">If the platform ever loses a dispute, Spenny Piggy absorbs the loss — not the creator.</p>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Why Creators Lose Money on Other Payment Apps</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>No delivery tracking</li>
                <li>No service context</li>
                <li>No platform protection</li>
                <li>One report can freeze everything</li>
              </ul>
              <p className="mb-6">Spenny Piggy exists to remove that risk.</p>

               <div className='flex'>
                <Link href="/register" className="button b !px-6 !py-3">Start Free Creator Trial</Link>
              </div>
              <div className="mt-2 text-sm">3 days free • £4/month after • Live support included</div>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

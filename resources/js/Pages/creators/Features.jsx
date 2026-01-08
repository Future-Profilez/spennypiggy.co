import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function Features() {
  return (
    <>
      <Head title="Everything You Need to Monetise — In One Platform.">
        <link rel="canonical" href="/creators/features" />
      </Head>
      <Guest>
        <div className="wishlistPage bg-white pt-8">
          <div className="containerbox p-3">
            <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
              <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">Everything You Need to Monetise — In One Platform.</h1>
              <div className='flex'>
                <Link href="/register" className="button b !px-6 !py-3">Start Free Creator Trial</Link>
              </div>
              <div className="text-sm mt-3">3 days free • £4/month after • Cancel anytime</div>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Why All-In-One Matters</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Disconnected tools create risk.</li>
                <li>A single platform keeps payments contextualised and review-safe.</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Features</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Wishlist Gifting — Supporters buy real items, not low-value tips</li>
                <li>Paid Tasks — Set rules, deadlines, and prices</li>
                <li>Bills & Contributions — Supporters help with real-world costs</li>
                <li>Intro Video — Convert supporters faster</li>
                <li>Leaderboards — Gamify spending and reward top supporters</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Safety</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>All features link payments to clear platform activity.</li>
                <li>This reduces freezes and chargebacks.</li>
              </ul>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

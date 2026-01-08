import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function StripeSafe() {
  return (
    <>
      <Head title="Built for Reliable Payouts — Not Sudden Shutdowns.">
        <link rel="canonical" href="/creators/stripe-safe" />
      </Head>
      <Guest>
        <div className="wishlistPage bg-white pt-8">
          <div className="containerbox p-3">
            <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
              <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">Built for Reliable Payouts — Not Sudden Shutdowns.</h1>
              <p className="mb-6">For creators who care about long-term account safety.</p>
              <div className='flex'>
                <Link href="/register" className="button b !px-6 !py-3">Start Free Creator Trial</Link>
              </div>
              <div className="text-sm mt-3">3 days free • £4/month after • Cancel anytime</div>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Why Accounts Get Shut Down</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Accounts are closed when money arrives with no clear reason.</li>
                <li>Unexplained transfers trigger reviews and freezes.</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">How Spenny Piggy Prevents This</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Payments always linked to platform features</li>
                <li>Clear usage and content rules</li>
                <li>Monthly compliance reminders</li>
                <li>Activity logs Stripe expects</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Disputes</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Disputes are handled by the platform.</li>
                <li>Creators are never debited.</li>
              </ul>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function Disputes() {
  return (
    <>
      <Head title="Disputes Are Managed by the Platform.">
        <link rel="canonical" href="/creators/disputes" />
      </Head>
      <Guest>
        <div className="wishlistPage bg-white pt-8">
          <div className="containerbox p-3">
            <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
              <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">Disputes Are Managed by the Platform.</h1>
               <div className='flex'>
                <Link href="/register" className="button b !px-6 !py-3">Start Free Creator Trial</Link>
              </div>
              <div className="text-sm mt-3">3 days free • £4/month after • Cancel anytime</div>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">How It Works</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Every transaction includes delivery receipts or activity logs.</li>
                <li>All actions are time-stamped.</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">What This Means For Creators</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Creators are never debited.</li>
                <li>Chargebacks are handled by Spenny Piggy.</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Important Statement</h2>
              <p className="mb-6">If the platform ever loses a dispute, Spenny Piggy absorbs the loss — not the creator.</p>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function Keep100() {
  return (
    <>
      <Head title="You Keep 100% of What You Earn.">
        <link rel="canonical" href="/creators/keep-100" />
      </Head>
      <Guest>
        <div className="wishlistPage bg-white pt-8">
          <div className="containerbox p-3">
            <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
              <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">You Keep 100% of What You Earn.</h1>
<div className='flex'>
                <Link href="/register" className="button b !px-6 !py-3">Start Free Creator Trial</Link>
              </div>
              <div className="text-sm mt-3">3 days free • £4/month after</div>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">What This Means</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>• No revenue cuts</li>
                <li>• Supporters pay platform fee</li>
                <li>• No earning caps</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Why This Is Safe</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>• Payments tied to platform features</li>
                <li>• Platform-managed disputes</li>
                <li>• Chargeback protection included</li>
              </ul>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

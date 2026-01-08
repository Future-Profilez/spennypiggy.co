import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function FounderBonus() {
  return (
    <>
      <Head title="Founder Bonuses for Early Creators.">
        <link rel="canonical" href="/creators/founder-bonus" />
      </Head>
      <Guest>
        <div className="wishlistPage bg-white pt-8">
          <div className="containerbox p-3">
            <div className="max-w-4xl mx-auto md:py-8 text-gray-800">
              <h1 className="text-xl md:text-3xl font-bold text-pink-600 mb-6">Founder Bonuses for Early Creators.</h1>
              <Link href="/register" className="button b !px-6 !py-3 mb-2">Start Free Creator Trial</Link>
              <div className="text-sm">3 days free • £4/month after • Cancel anytime</div>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">What Founders Get</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Founder bonuses reward early platform growth.</li>
                <li>Perks are tied to activity, not guarantees.</li>
              </ul>

              <div className="my-6 h-px w-full bg-gray-200" />

              <h2 className="text-lg md:text-2xl font-semibold mb-3">Key Rules</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Limited availability.</li>
                <li>No guaranteed earnings.</li>
                <li>Terms apply.</li>
              </ul>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

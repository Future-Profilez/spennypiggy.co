import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import CreatorGuideLinks from './components/CreatorGuideLinks';
import { Check, ArrowRight, DollarSign, ShieldCheck } from 'lucide-react';

export default function Keep100() {
  return (
    <>
      <Head title="Keep 100% — Creators Keep All Their Earnings">
        <link rel="canonical" href="/creators/keep-100" />
        <meta name="description" content="No revenue cuts. Supporters pay the platform fee. Fast payouts with full dispute protection." />
        <meta property="og:title" content="Keep 100% — Creators Keep All Their Earnings" />
        <meta property="og:description" content="No revenue cuts. Supporters pay the platform fee. Fast payouts with full dispute protection." />
        <meta property="og:image" content="/siteicon.png" />
        <meta property="og:url" content="https://spennypiggy.co/creators/keep-100" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Keep 100% — Creators Keep All Their Earnings" />
        <meta name="twitter:description" content="No revenue cuts. Supporters pay the platform fee. Fast payouts with full dispute protection." />
        <meta name="twitter:image" content="/siteicon.png" />
      </Head>
      <Guest>
        <div className="bg-[#A2E4B8] min-h-screen font-sans text-gray-900 pb-12 md:pb-16 relative ">
          
          <div className="relative z-1">
          <div className="containerbox mx-auto">
            <div className="pt-12 md:pt-18 lg:pt-32">
              
              <div className="text-center mb-12 md:mb-16">
                <div className="bg-transparent border-0 shadow-none rounded-none max-w-3xl mx-auto">
                  <h1 className="text-4xl md:!text-5xl lg:!text-6xl font-gulfs uppercase leading-[0.85] tracking-wide mb-4 text-black">
                    You Keep <br/>
                    <span className="underline decoration-[6px] decoration-yellow-300">100%</span> Of What <br/>
                    You Earn
                  </h1>
                  <div className="flex justify-center mb-3">
                    <Link href="/register" className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-sm md:text-base py-3 px-6 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                      <span>Start Free Creator Trial</span>
                      <ArrowRight />
                    </Link>
                  </div>
                  <div className="text-xs md:text-sm font-medium text-gray-700">
                    3 days free • £8.99 + VAT / month after
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                 
                 <div className="bg-[#fdfbf7] p-4 sm:!p-8 md:!p-10 lg:!p-14 rounded-[25px] md:rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group">
                    <div className="bg-yellow-300 w-16 h-16 md:w-20 md:h-20 rounded-[30px] border-[3px] border-black flex items-center justify-center mb-8">
                       <DollarSign className="text-[#FF007F]" size={40} />
                    </div>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-gulfs uppercase mb-3 md:mb-8 text-black">What This Means</h2>
                    <ul className="space-y-4 md:space-y-6">
                       {[
                          "No revenue cuts",
                          "Supporters pay platform fee",
                          "No earning caps"
                       ].map((item, i) => (
                          <li key={i} className="text-normal md:text-xl font-bold flex items-center gap-3 text-gray-800">
                             <span className="w-3 h-3 bg-yellow-300 rounded-full border-[3px] border-black"></span>
                             {item}
                          </li>
                       ))}
                    </ul>
                 </div>

                 <div className="bg-black text-white p-4 sm:!p-8 md:!p-10 lg:!p-14 rounded-[25px] md:rounded-[30px] border-[3px] border-black relative overflow-hidden group shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                       <ShieldCheck size={180} className="text-white" />
                    </div>
                    
                    <div className="bg-white w-16 h-16 md:w-20 md:h-20 rounded-[30px] border-[3px] border-black flex items-center justify-center mb-8 relative z-10">
                       <ShieldCheck className="text-yellow-400" size={40} />
                    </div>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-gulfs uppercase mb-3 md:mb-8 relative z-10 text-white">Why This Is Safe</h2>
                    <ul className="space-y-6 relative z-10">
                       {[
                          "Payments tied to platform features",
                          "Platform-managed disputes",
                          "Chargeback protection included"
                       ].map((item, i) => (
                          <li key={i} className="text-normal md:text-xl font-bold flex items-center gap-4 text-gray-200">
                             <div className="bg-yellow-300 p-1 rounded-full text-black border-[3px] border-black">
                                <Check size={16} strokeWidth={4} />
                             </div>
                             {item}
                          </li>
                       ))}
                    </ul>
                 </div>

              </div>

              <div className="mt-8">
                <CreatorGuideLinks />
              </div>

            </div>
          </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

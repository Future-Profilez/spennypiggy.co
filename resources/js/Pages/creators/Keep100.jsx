import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
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
        <div className="bg-[#F9F9F9] min-h-screen font-sans text-gray-900 pb-12 md:pb-20 relative ">
          
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <div className="absolute top-0 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float"></div>
              <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
              <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="relative z-1">
          <div className="containerbox mx-auto">
            <div className="pt-12 md:pt-18 lg:pt-32">
              
              <div className="text-center mb-16 md:mb-24">
                 <h1 className="text-4xl md:!text-5xl lg:!text-6xl xl:!text-7xl font-gulfs uppercase leading-[0.85] tracking-wide mb-8 text-black">
                    You Keep <br/>
                    <span className="text-gradient-wishlist text-shadow-sm">100%</span> Of What <br/>
                    You Earn.
                 </h1>
                 <div className="flex justify-center mb-8">
                    <Link href="/register" className="relative inline-flex items-center gap-4 bg-black text-white font-black text-sm sm:text-normal md:text-lg py-3 px-8 rounded-full 
                        shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                       <span className="relative z-10">Start Free Creator Trial</span>
                       <ArrowRight className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                       <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                 </div>
                 <div className="text-sm font-medium text-gray-500">
                    3 days free • £4/month after
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                 
                 <div className="bg-white p-4 sm:!p-8 md:!p-10 lg:!p-14 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100 hover:border-pink-500 transition-all group">
                    <div className="bg-pink-100 w-16 h-16 md:w-20 md:h-20  rounded-xl  flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                       <DollarSign className="text-pink-600" size={40} />
                    </div>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-gulfs uppercase mb-3 md:mb-8 text-black">What This Means</h2>
                    <ul className="space-y-4 md:space-y-6">
                       {[
                          "No revenue cuts",
                          "Supporters pay platform fee",
                          "No earning caps"
                       ].map((item, i) => (
                          <li key={i} className="text-normal md:text-xl font-bold flex items-center gap-4 text-gray-800">
                             <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
                             {item}
                          </li>
                       ))}
                    </ul>
                 </div>

                 <div className="bg-black text-white p-4 sm:!p-8 md:!p-10 lg:!p-14 rounded-[2rem] md:rounded-[3rem] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                       <ShieldCheck size={180} className="text-white" />
                    </div>
                    
                    <div className="bg-white/10 w-16 h-16 md:w-20 md:h-20 rounded-xl  flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform">
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
                             <div className="bg-yellow-400 p-1 rounded-full text-black">
                                <Check size={16} strokeWidth={4} />
                             </div>
                             {item}
                          </li>
                       ))}
                    </ul>
                 </div>

              </div>

            </div>
          </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

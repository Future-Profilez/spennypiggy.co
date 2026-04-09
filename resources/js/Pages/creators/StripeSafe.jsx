import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import CreatorGuideLinks from './components/CreatorGuideLinks';
import { Check, ArrowRight, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

export default function StripeSafe() {
  return (
    <>
      <Head title="Stripe Safe — Avoid Freezes, Shutdowns & Clawbacks">
        <link rel="canonical" href="/creators/stripe-safe" />
        <meta name="description" content="Built to align with Stripe expectations: clear usage, linked payments and dispute protection to keep your account safe." />
        <meta property="og:title" content="Stripe Safe — Avoid Freezes, Shutdowns & Clawbacks" />
        <meta property="og:description" content="Built to align with Stripe expectations: clear usage, linked payments and dispute protection to keep your account safe." />
        <meta property="og:image" content="/siteicon.png" />
        <meta property="og:url" content="https://spennypiggy.co/creators/stripe-safe" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stripe Safe — Avoid Freezes, Shutdowns & Clawbacks" />
        <meta name="twitter:description" content="Built to align with Stripe expectations: clear usage, linked payments and dispute protection to keep your account safe." />
        <meta name="twitter:image" content="/siteicon.png" />
      </Head>
      <Guest>
        <div className="bg-[#A2E4B8] min-h-screen font-sans text-gray-900 pb-12 md:pb-16 relative">

            <div className='containerbox mx-auto'>
               <div className="relative z-1">
                  <div className=" pt-12 pb-12 md:pt-24 md:pb-12 text-center max-w-3xl mx-auto">
                    <div className="bg-transparent border-0 shadow-none rounded-none">
                      <h1 className="text-4xl md:text-5xl font-gulfs uppercase tracking-normal mb-4 text-black">
                        Built for Reliable Payouts <br/>
                        <span className="text-gray-700">Not Sudden Shutdowns</span>
                      </h1>
                      <p className="text-base md:text-lg font-medium text-gray-700 mx-auto mb-6">
                        For creators who care about long-term account safety.
                      </p>
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Link href="/register" className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-sm md:text-base py-3 px-6 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                          <span>Start Free Creator Trial</span>
                          <ArrowRight />
                        </Link>
                        <div className="text-xs md:text-sm font-medium text-gray-700">
                          3 days free • £4/month after • Cancel anytime
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className=" grid lg:grid-cols-2 gap-0 overflow-hidden rounded-[25px] md:rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                     
                     <div className="bg-black text-white p-4 sm:!p-8 md:!p-12 lg:!p-16 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-800">
                        <div className="mb-10">
                           <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full font-bold uppercase text-sm mb-6">
                              <AlertTriangle size={16} /> The Problem
                           </div>
                           <h2 className="text-3xl md:text-4xl xl:text-4xl font-gulfs uppercase mb-2 md:mb-6 leading-tight">
                              Why Accounts <br/> Get <span className="text-red-500">Shut Down</span>
                           </h2>
                        </div>
                        
                        <ul className="space-y-8">
                           <li className="flex gap-4">
                              <div className="bg-red-500/20 p-3 rounded-[30px]  h-fit shrink-0">
                                 <AlertTriangle className="text-red-500" size={24} />
                              </div>
                              <div>
                                 <p className="text-normal md:text-xl font-bold">Accounts are closed when money arrives with no clear reason.</p>
                              </div>
                           </li>
                           <li className="flex gap-4">
                              <div className="bg-red-500/20 p-3 rounded-[30px]  h-fit shrink-0">
                                 <AlertTriangle className="text-red-500" size={24} />
                              </div>
                              <div>
                                 <p className="text-normal md:text-xl font-bold">Unexplained transfers trigger reviews and freezes.</p>
                              </div>
                           </li>
                        </ul>
                     </div>

                     {/* Right: The Solution */}
                     <div className="bg-white p-4 sm:!p-8 md:!p-12 lg:!p-16 flex flex-col justify-center relative">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                           <ShieldCheck size={200} />
                        </div>
                        
                        <div className="mb-2  md:mb-10 relative z-1">
                           <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 px-4 py-2 rounded-full font-bold uppercase text-sm mb-6">
                              <Check size={16} /> The Solution
                           </div>
                           <h2 className="text-3xl md:text-4xl xl:text-4xl font-gulfs uppercase mb-2 md:mb-6 leading-tight text-gray-900">
                              How Spenny Piggy <br/> <span className="text-gradient-wishlist">Prevents This</span>
                           </h2>
                        </div>

                        <ul className="space-y-6 relative z-10">
                           {[
                              "Payments always linked to platform features",
                              "Clear usage and content rules",
                              "Monthly compliance reminders",
                              "Activity logs Stripe expects"
                           ].map((item, i) => (
                              <li key={i} className="flex items-center gap-4 text-lg font-bold text-gray-800">
                                 <div className="bg-green-500 text-white p-1 rounded-full shrink-0">
                                    <Check size={16} strokeWidth={3} />
                                 </div>
                                 {item}
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  <div className=" mt-12">
                     <div className="bg-[#fdfbf7] text-gray-900 p-4 md:!p-8 lg:!p-12 rounded-[25px] md:rounded-[30px] border-[3px] border-black flex flex-col md:flex-row items-center justify-between gap-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div>
                           <h2 className="text-2xl md:text-3xl lg:text-3xl font-gulfs uppercase mb-4">Disputes</h2>
                           <ul className="space-y-3">
                              <li className="flex items-center gap-3 text-lg text-gray-600">
                                 <Lock className="text-pink-600" size={20} /> Disputes are handled by the platform.
                              </li>
                              <li className="flex items-center gap-3 text-lg text-gray-600">
                                 <Lock className="text-pink-600" size={20} /> Creators are never debited.
                              </li>
                           </ul>
                        </div>
                        <div className="shrink-0">
                           <ShieldCheck size={80} className="text-pink-500 opacity-80" />
                        </div>
                     </div>
                  </div>
                  <CreatorGuideLinks />

               </div>
            </div>
        </div>
      </Guest>
    </>
  );
}

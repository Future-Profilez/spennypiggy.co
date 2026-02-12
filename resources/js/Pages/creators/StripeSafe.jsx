import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
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
        <div className="bg-[#F9F9F9] min-h-screen font-sans text-gray-900 pb-12 md:pb-20 relative overflow-hidden">

            <div className='containerbox mx-auto'>
               <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                  <div className="absolute top-0 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float"></div>
                  <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
                  <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-pulse" style={{animationDelay: '2s'}}></div>
               </div>
               <div className="relative z-1">
                  <div className=" pt-12 pb-20 md:pt-24 md:pb-20 text-center">
                     <h1 className="text-4xl md:text-5xl lg:text-6xl font-gulfs uppercase  tracking-normal mb-6 text-black">
                        Built for <br/>
                        Reliable Payouts <br/>
                        <span className="text-gray-500">Not Sudden Shutdowns.</span>
                     </h1>
                     <p className="text-xl md:text-2xl font-medium text-gray-600 max-w-2xl mx-auto mb-10">
                        For creators who care about long-term account safety.
                     </p>
                     <div className="flex flex-col items-center justify-center gap-4">
                        <Link href="/register" className="relative inline-flex items-center gap-4 bg-black text-white font-black text-sm sm:text-normal md:text-lg py-3 px-3 sm:px-8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                        <span className="relative z-10">Start Free Creator Trial</span>
                        <ArrowRight className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <div className="text-sm font-medium text-gray-500">
                        3 days free • £4/month after • Cancel anytime
                        </div>
                     </div>
                  </div>

                  <div className=" grid lg:grid-cols-2 gap-0 overflow-hidden rounded-[40px]  md:rounded-[40px]  shadow-2xl border border-gray-200">
                     
                     <div className="bg-black text-white p-4 sm:!p-8 md:!p-12 lg:!p-16 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-800">
                        <div className="mb-10">
                           <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full font-bold uppercase text-sm mb-6">
                              <AlertTriangle size={16} /> The Problem
                           </div>
                           <h2 className="text-3xl md:text-4xl xl:text-5xl font-gulfs uppercase mb-2 md:mb-6 leading-tight">
                              Why Accounts <br/> Get <span className="text-red-500">Shut Down</span>
                           </h2>
                        </div>
                        
                        <ul className="space-y-8">
                           <li className="flex gap-4">
                              <div className="bg-red-500/20 p-3 rounded-[40px]  h-fit shrink-0">
                                 <AlertTriangle className="text-red-500" size={24} />
                              </div>
                              <div>
                                 <p className="text-normal md:text-xl font-bold">Accounts are closed when money arrives with no clear reason.</p>
                              </div>
                           </li>
                           <li className="flex gap-4">
                              <div className="bg-red-500/20 p-3 rounded-[40px]  h-fit shrink-0">
                                 <AlertTriangle className="text-red-500" size={24} />
                              </div>
                              <div>
                                 <p className="text-normal md:text-xl font-bold">Unexplained transfers trigger reviews and freezes.</p>
                              </div>
                           </li>
                        </ul>
                     </div>

                     {/* Right: The Solution (Lighter/Gradient) */}
                     <div className="bg-white p-4 sm:!p-8 md:!p-12 lg:!p-16 flex flex-col justify-center relative">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                           <ShieldCheck size={200} />
                        </div>
                        
                        <div className="mb-2  md:mb-10 relative z-1">
                           <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 px-4 py-2 rounded-full font-bold uppercase text-sm mb-6">
                              <Check size={16} /> The Solution
                           </div>
                           <h2 className="text-3xl md:text-4xl xl:text-5xl font-gulfs uppercase mb-2 md:mb-6 leading-tight text-gray-900">
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
                     <div className="bg-white border border-gray-100 text-gray-900 p-4 md:!p-8 lg:!p-12 rounded-[40px]  flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl">
                        <div>
                           <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs uppercase mb-4">Disputes</h2>
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

               </div>
            </div>
        </div>
      </Guest>
    </>
  );
}

import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import { Check, ArrowRight, Gavel, ShieldCheck, Clock, FileCheck, Lock } from 'lucide-react';

export default function Disputes() {
  return (
    <>
      <Head title="Disputes — Platform-Managed Protection, Creators Never Debited">
        <link rel="canonical" href="/creators/disputes" />
        <meta name="description" content="Disputes are handled by the platform with delivery receipts and activity logs. Creators are never debited." />
        <meta property="og:title" content="Disputes — Platform-Managed Protection, Creators Never Debited" />
        <meta property="og:description" content="Disputes are handled by the platform with delivery receipts and activity logs. Creators are never debited." />
        <meta property="og:image" content="/siteicon.png" />
        <meta property="og:url" content="https://spennypiggy.co/creators/disputes" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Disputes — Platform-Managed Protection, Creators Never Debited" />
        <meta name="twitter:description" content="Disputes are handled by the platform with delivery receipts and activity logs. Creators are never debited." />
        <meta name="twitter:image" content="/siteicon.png" />
      </Head>
      <Guest>
        <div className="bg-[#F9F9F9] min-h-screen font-sans text-gray-900 pb-20 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
               <div className="absolute top-0 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float"></div>
               <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
               <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            <div className='containerbox mx-auto'>
               <div className=" w-full mx-auto pt-12 md:pt-24 relative z-1">
                  <div className="text-center max-w-4xl mx-auto mb-16">
                     <div className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full font-bold uppercase text-sm mb-6">
                        <Gavel size={16} className="text-pink-500" /> Creator Protection Program
                     </div>
                     <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-gulfs uppercase leading-[0.9] tracking-[1px] mb-8 text-black">
                        Disputes Are <br className='hidden sm:visible'/>
                        Managed By <br className='hidden sm:visible'/>
                        <span className="text-gray-500">The Platform.</span>
                     </h1>
                     
                     <div className="flex flex-col items-center justify-center gap-4">
                        <Link href="/register" className="relative inline-flex items-center gap-4 bg-black text-white font-black text-sm sm:text-normal md:text-lg py-3 px-8 rounded-full 
                        shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                        <span className="relative z-10">Start Free Creator Trial</span>
                        <ArrowRight className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <div className="text-sm font-medium text-gray-500">
                        3 days free • £4/month after • Cancel anytime
                        </div>
                     </div>
                  </div>

                  <div className="  bg-white rounded-[30px]  md:rounded-[30px]  shadow-2xl border border-gray-100 overflow-hidden relative">
                     
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></div>
                     
                     <div className="grid lg:grid-cols-2">
                        
                        <div className="p-4 md:!p-8 lg:!p-12 xl:!p-16 border-b md:border-b-0 md:border-r border-gray-100">
                           <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-4 md:mb-8 flex items-center gap-3 text-black">
                              <FileCheck size={32} className="text-gray-900" /> How It Works
                           </h2>
                           <ul className="space-y-4 lg:space-y-8">
                              <li className="flex gap-4 items-center">
                                 <div className="bg-gray-100 p-2 md:p-3 rounded-[30px]  h-fit shrink-0">
                                    <FileCheck size={24} className="text-gray-700" />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">Every transaction includes delivery receipts or activity logs.</p>
                                 </div>
                              </li>
                              <li className="flex gap-4 items-center">
                                 <div className="bg-gray-100 p-2 md:p-3 rounded-[30px]  h-fit shrink-0">
                                    <Clock size={24} className="text-gray-700" />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">All actions are time-stamped.</p>
                                 </div>
                              </li>
                           </ul>
                        </div>

                        <div className="p-4 md:!p-8 lg:!p-12 xl:!p-16 bg-gray-50">
                           <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-8 flex items-center gap-3 text-black">
                              <ShieldCheck size={32} className="text-pink-600" /> What This Means
                           </h2>
                           <ul className="space-y-4 lg:space-y-8">
                              <li className="flex gap-4 items-center">
                                 <div className="bg-pink-100 p-2 md:p-3 rounded-[30px]  h-fit shrink-0 text-pink-600">
                                    <Check size={24} strokeWidth={3} />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">Creators are never debited.</p>
                                 </div>
                              </li>
                              <li className="flex gap-4 items-center">
                                 <div className="bg-pink-100 p-2 md:p-3 rounded-[30px]  h-fit shrink-0 text-pink-600">
                                    <Check size={24} strokeWidth={3} />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">Chargebacks are handled by Spenny Piggy.</p>
                                 </div>
                              </li>
                           </ul>
                        </div>

                     </div>

                     <div className="bg-black text-white p-10 md:p-12 text-center border-t border-gray-100">
                        <h3 className="text-gray-400 font-bold uppercase text-sm mb-4 tracking-widest">Important Statement</h3>
                        <p className="text-xl md:text-2xl font-gulfs uppercase leading-tight tracking-wide max-w-3xl mx-auto">
                           "If the platform ever loses a dispute, <span className="text-pink-500">Spenny Piggy absorbs the loss</span> — not the creator."
                        </p>
                     </div>

                  </div>

               </div>
            </div>
        </div>
      </Guest>
    </>
  );
}

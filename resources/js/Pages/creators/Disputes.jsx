import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import CreatorGuideLinks from './components/CreatorGuideLinks';
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
        <div className="bg-[#A2E4B8] min-h-screen font-sans text-gray-900 pb-16 relative">

            <div className='containerbox mx-auto'>
               <div className=" w-full mx-auto pt-12 md:pt-24 relative z-1">
                  <div className="text-center max-w-3xl mx-auto mb-8">
                     <div className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full font-bold uppercase text-sm mb-6">
                        <Gavel size={16} className="text-[#FF007F]" /> Creator Protection Program
                     </div>
                     <div className="bg-transparent border-0 shadow-none rounded-none ">
                       <h1 className="text-4xl sm:text-5xl font-gulfs uppercase leading-[0.9] tracking-wide mb-4 text-black">
                          Disputes Are Managed <br className='hidden sm:visible'/> By <span className="underline decoration-[6px] decoration-yellow-300">The Platform</span>
                       </h1>
                       
                       <div className="flex flex-col items-center justify-center gap-3">
                          <Link href="/register" className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-sm md:text-base py-3 px-8 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                            <span>Start Free Creator Trial</span>
                            <ArrowRight />
                          </Link>
                          <div className="text-xs md:text-sm font-medium text-gray-700">
                            3 days free • £4/month after • Cancel anytime
                          </div>
                       </div>
                     </div>
                  </div>

                  <div className="bg-[#fdfbf7] rounded-[25px] md:rounded-[30px]  border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
                     
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></div>
                     
                     <div className="grid lg:grid-cols-2">
                        
                        <div className="p-4 md:!p-8 lg:!p-12 xl:!p-16 border-b md:border-b-0 md:border-r border-black">
                           <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-4 md:mb-8 flex items-center gap-3 text-black">
                              <FileCheck size={32} className="text-gray-900" /> How It Works
                           </h2>
                           <ul className="space-y-4 lg:space-y-8">
                              <li className="flex gap-4 items-center">
                                 <div className="bg-white p-2 md:p-3 rounded-[30px]  border-[3px] border-black h-fit shrink-0">
                                    <FileCheck size={24} className="text-gray-700" />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">Every transaction includes delivery receipts or activity logs.</p>
                                 </div>
                              </li>
                              <li className="flex gap-4 items-center">
                                 <div className="bg-white p-2 md:p-3 rounded-[30px]  border-[3px] border-black h-fit shrink-0">
                                    <Clock size={24} className="text-gray-700" />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">All actions are time-stamped.</p>
                                 </div>
                              </li>
                           </ul>
                        </div>

                        <div className="p-4 md:!p-8 lg:!p-12 xl:!p-16 bg-white border-t border-black lg:border-t-0">
                           <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-8 flex items-center gap-3 text-black">
                              <ShieldCheck size={32} className="text-[#FF007F]" /> What This Means
                           </h2>
                           <ul className="space-y-4 lg:space-y-8">
                              <li className="flex gap-4 items-center">
                                 <div className="bg-yellow-300 p-2 md:p-3 rounded-[30px]  h-fit shrink-0 text-black border-[3px] border-black">
                                    <Check size={24} strokeWidth={3} />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">Creators are never debited.</p>
                                 </div>
                              </li>
                              <li className="flex gap-4 items-center">
                                 <div className="bg-yellow-300 p-2 md:p-3 rounded-[30px]  h-fit shrink-0 text-black border-[3px] border-black">
                                    <Check size={24} strokeWidth={3} />
                                 </div>
                                 <div>
                                    <p className="text-normal md:text-[18px] font-bold text-gray-800">Chargebacks are handled by Spenny Piggy.</p>
                                 </div>
                              </li>
                           </ul>
                        </div>

                     </div>

                     <div className="bg-black text-white p-10 md:p-12 text-center border-t border-black">
                        <h3 className="text-gray-400 font-bold uppercase text-sm mb-4 tracking-widest">Important Statement</h3>
                        <p className="text-xl md:text-2xl font-gulfs uppercase leading-tight tracking-wide max-w-3xl mx-auto">
                           "If the platform ever loses a dispute, <span className="text-[#FF007F]">Spenny Piggy absorbs the loss</span> — not the creator."
                        </p>
                     </div>

                  </div>

                  <div className="mt-8">
                    <CreatorGuideLinks />
                  </div>

               </div>
            </div>
        </div>
      </Guest>
    </>
  );
}

import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import CreatorGuideLinks from './components/CreatorGuideLinks';
import { ArrowRight, Star, Award, AlertCircle, Clock } from 'lucide-react';

export default function FounderBonus() {
  return (
    <>
      <Head title="Founder Bonuses — Rewards for Early Creators">
        <link rel="canonical" href="/creators/founder-bonus" />
        <meta name="description" content="Exclusive founder bonuses reward early creators based on platform activity with priority perks and access to new tools." />
        <meta property="og:title" content="Founder Bonuses — Rewards for Early Creators" />
        <meta property="og:description" content="Exclusive founder bonuses reward early creators based on platform activity with priority perks and access to new tools." />
        <meta property="og:image" content="/siteicon.png" />
        <meta property="og:url" content="https://spennypiggy.co/creators/founder-bonus" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Founder Bonuses — Rewards for Early Creators" />
        <meta name="twitter:description" content="Exclusive founder bonuses reward early creators based on platform activity with priority perks and access to new tools." />
        <meta name="twitter:image" content="/siteicon.png" />
      </Head>
      <Guest>
        <div className="bg-[#A2E4B8] min-h-screen font-sans text-gray-900 pb-12 md:pb-16 relative"> 

          <div className="relative z-1">
          <div className="containerbox mx-auto">
            {/* Hero Section */}
            <div className="pt-12 md:pt-24 text-center">
               <div className="bg-transparent border-0 shadow-none rounded-none p-6 md:p-8 mb-8 max-w-3xl mx-auto">
                 <div className="inline-flex items-center gap-2 bg-yellow-200 text-black px-6 py-2 rounded-full font-bold uppercase text-sm mb-6 border-[3px] border-black">
                    <Star size={16} className="text-black" /> Exclusive Opportunity
                 </div>
                 <h1 className="text-4xl md:!text-5xl lg:!text-6xl font-gulfs uppercase leading-[0.9] tracking-wide mb-6 text-black">
                    Founder Bonuses <br/>
                    For <span className="underline decoration-[6px] decoration-yellow-300">Early Creators</span>
                 </h1>
                 
                 <div className="flex flex-col items-center justify-center gap-3">
                    <Link href="/register" className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-sm md:text-base py-3 px-6 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                      <span>Start Free Creator Trial</span>
                      <ArrowRight />
                    </Link>
                    <div className="text-xs md:text-sm font-medium text-gray-700">
                      3 days free • £8.99 + VAT / month after • Cancel anytime
                    </div>
                 </div>
               </div>

               <div className="grid lg:grid-cols-2 gap-3 md:gap-8  mx-auto">
                  
                  <div className="bg-[#fdfbf7] p-4 md:!p-8 lg:!p-10 rounded-[25px] md:rounded-[30px]  border-[3px] border-black relative overflow-hidden group shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"> 
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award size={150} />
                     </div>
                     <div className="relative z-10 text-left">
                        <div className="bg-yellow-300 w-12 h-12 md:w-16 md:h-16 rounded-[30px]  border-[3px] border-black flex items-center justify-center mb-6 text-black">
                           <Award size={32} />
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-2 md:mb-6 text-black">What Founders Get</h2>
                        <ul className="space-y-4">
                           <li className="flex gap-4 items-center">
                              <div className="bg-yellow-300 p-1.5 rounded-full shrink-0 border-[3px] border-black"></div>
                              <span className="text-normal lg:text-xl font-bold text-gray-800">Founder bonuses reward early platform growth.</span>
                           </li>
                           <li className="flex gap-4 items-center">
                              <div className="bg-yellow-300 p-1.5 rounded-full shrink-0 border-[3px] border-black"></div>
                              <span className="text-normal lg:text-xl font-bold text-gray-800">Perks are tied to activity, not promises.</span>
                           </li>
                        </ul>
                     </div>
                  </div>

                  <div className="bg-black text-white p-4 md:!p-8 lg:!p-10 rounded-[25px] md:rounded-[30px]  border-[3px] border-black relative overflow-hidden group shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={150} />
                     </div>
                     <div className="relative z-10 text-left">
                        <div className="bg-white w-12 h-12 md:w-16 md:h-16 rounded-[30px]  border-[3px] border-black flex items-center justify-center mb-6 text-[#FF007F]">
                           <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-2 md:mb-6">Key Rules</h2>
                        <ul className="space-y-4">
                           {[
                              "Limited availability.",
                              "No assured earnings.",
                              "Terms apply."
                           ].map((rule, i) => (
                              <li key={i} className="flex gap-4 items-center">
                                 <div className="bg-[#FF007F] p-1.5 rounded-full shrink-0"></div>
                                 <span className="text-normal lg:text-xl font-bold text-gray-200">{rule}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>

               </div>

            </div>
          </div>
          </div>
          <div className="containerbox mx-auto mt-8">
            <CreatorGuideLinks />
          </div>
        </div>
      </Guest>
    </>
  );
}

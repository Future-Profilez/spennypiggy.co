import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
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
        <div className="bg-[#F9F9F9] min-h-screen font-sans text-gray-900 pb-12 md:pb-20 relative overflow-hidden"> 

          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <div className="absolute top-0 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float"></div>
              <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
              <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="relative z-1">
          <div className="containerbox mx-auto">
            {/* Hero Section */}
            <div className="pt-12 pb-16 md:pt-24 md:pb-20 text-center">
               <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-6 py-2 rounded-full font-bold uppercase text-sm mb-8 border border-yellow-200">
                  <Star size={16} className="fill-yellow-700" /> Exclusive Opportunity
               </div>
               <h1 className="text-4xl md:!text-5xl lg:!text-6xl font-gulfs uppercase leading-[0.9] tracking-wide mb-8 text-black">
                  Founder Bonuses <br/>
                  For <span className="text-gradient-wishlist">Early Creators.</span>
               </h1>
               
               <div className="flex flex-col items-center justify-center gap-4 mb-16">
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

               <div className="grid lg:grid-cols-2 gap-3 md:gap-8 max-w-5xl mx-auto">
                  
                  <div className="bg-white p-4 md:!p-8 lg:!p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group hover:border-yellow-400 transition-colors"> 
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award size={150} />
                     </div>
                     <div className="relative z-10 text-left">
                        <div className="bg-yellow-100 w-12 h-12 md:w-16 md:h-16 rounded-xl  flex items-center justify-center mb-6 text-yellow-600">
                           <Award size={32} />
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-gulfs uppercase mb-2 md:mb-6 text-black">What Founders Get</h2>
                        <ul className="space-y-4">
                           <li className="flex gap-4 items-center">
                              <div className="bg-yellow-400 p-1.5 rounded-full shrink-0"></div>
                              <span className="text-normal lg:text-xl font-bold text-gray-800">Founder bonuses reward early platform growth.</span>
                           </li>
                           <li className="flex gap-4 items-center">
                              <div className="bg-yellow-400 p-1.5 rounded-full shrink-0"></div>
                              <span className="text-normal lg:text-xl font-bold text-gray-800">Perks are tied to activity, not promises.</span>
                           </li>
                        </ul>
                     </div>
                  </div>

                  <div className="bg-black text-white p-4 md:!p-8 lg:!p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={150} />
                     </div>
                     <div className="relative z-10 text-left">
                        <div className="bg-white/10 w-12 h-12 md:w-16 md:h-16 rounded-xl  flex items-center justify-center mb-6 text-pink-500">
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
                                 <div className="bg-pink-500 p-1.5 rounded-full shrink-0"></div>
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
        </div>
      </Guest>
    </>
  );
}

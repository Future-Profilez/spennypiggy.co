import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import CreatorGuideLinks from './components/CreatorGuideLinks';
import { Check, ArrowRight, Layers, Shield, Zap, Gift, ListChecks, FileText, Video, Trophy } from 'lucide-react';

export default function Features() {
  return (
    <>
      <Head title="Features — Monetise With Gifting, Tasks, Bills & Memberships">
        <link rel="canonical" href="/creators/features" />
        <meta name="description" content="Everything you need to monetise: wishlist gifting, paid tasks, bills, memberships, intros and leaderboards — designed for repeat spending." />
        <meta property="og:title" content="Features — Monetise With Gifting, Tasks, Bills & Memberships" />
        <meta property="og:description" content="Everything you need to monetise: wishlist gifting, paid tasks, bills, memberships, intros and leaderboards — designed for repeat spending." />
        <meta property="og:image" content="/siteicon.png" />
        <meta property="og:url" content="https://spennypiggy.co/creators/features" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Features — Monetise With Gifting, Tasks, Bills & Memberships" />
        <meta name="twitter:description" content="Everything you need to monetise: wishlist gifting, paid tasks, bills, memberships, intros and leaderboards — designed for repeat spending." />
        <meta name="twitter:image" content="/siteicon.png" />
      </Head>
      <Guest>
        <div className="bg-[#A2E4B8] min-h-screen font-sans text-gray-900 pb-12 md:pb-16 relative">
          
          <div className="containerbox mx-auto">
          <div className="relative z-1">
            {/* Hero Section */}
            <div className="pt-12 md:pt-24">
              <div className="bg-transparent border-0 shadow-none rounded-none max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-gulfs uppercase leading-[0.9] tracking-wide mb-4 text-black">
                  Everything You <br/>
                  Need To Monetise <br/>
                  <span className="text-gray-700">In One Platform</span>
                </h1>
                <div className="mb-2">
                  <Link href="/register" className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-sm md:text-base py-3 px-6 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                    <span>Start Free Creator Trial</span>
                    <ArrowRight />
                  </Link>
                  <div className="py-2 text-xs md:text-sm font-medium text-gray-700">
                    3 days free • £8.99 + VAT / month after • Cancel anytime
                  </div>
                </div>
              </div>

              {/* Why All-In-One Matters */}
              <div className="mt-12 mb-12">
                 <h2 className="text-2xl md:text-3xl xl:text-4xl font-gulfs uppercase mb-6 flex items-center gap-3 text-black">
                    <Layers className="text-[#FF007F]" size={32} /> Why All-In-One Matters
                 </h2>
                 <div className="space-y-4 text-xl font-medium text-gray-700">
                    <p className="flex gap-3">
                       <span className="bg-pink-600 w-2 h-2 rounded-full mt-3 shrink-0"></span>
                       Disconnected tools create risk.
                    </p>
                    <p className="flex gap-3">
                       <span className="bg-pink-600 w-2 h-2 rounded-full mt-3 shrink-0"></span>
                       A single platform keeps payments contextualised and review-safe.
                    </p>
                 </div>
              </div>

              <div className="mb-12 md:mb-20">
                 <h2 className="text-3xl md:text-5xl font-gulfs uppercase mb-10 text-center text-black">
                    Features
                 </h2>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                       { icon: Gift, title: "Wishlist Gifting", desc: "Supporters buy real items, not low-value tips" },
                       { icon: ListChecks, title: "Paid Tasks", desc: "Set rules, deadlines, and prices" },
                       { icon: FileText, title: "Bills & Contributions", desc: "Supporters help with real-world costs" },
                       { icon: Video, title: "Intro Video", desc: "Convert supporters faster" },
                       { icon: Trophy, title: "Leaderboards", desc: "Gamify spending and reward top supporters" }
                    ].map((feature, i) => (
                       <div key={i} className="bg-white p-6 rounded-[25px] md:rounded-[30px] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-transform duration-200 group">
                          <div className="bg-yellow-300 w-14 h-14 rounded-[30px] border-[3px] border-black flex items-center justify-center mb-6">
                             <feature.icon size={28} className="text-gray-800 group-hover:text-white" />
                          </div>
                          <h3 className="text-xl lg:text-2xl font-bold uppercase mb-2 text-gray-900">{feature.title}</h3>
                          <p className="text-gray-500 text-lg">{feature.desc}</p>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-black rounded-[25px] md:rounded-[30px] p-8 md:p-12 text-center relative overflow-hidden border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative z-1"> 
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs uppercase mb-4 md:mb-8 text-white">Safety</h2>
                  <div className="max-w-3xl mx-auto space-y-3">
                    <p className="text-base md:text-xl font-bold text-white">
                      All features link payments to clear platform activity.
                    </p>
                    <p className="text-base md:text-xl font-bold text-white ">
                      This reduces freezes and chargebacks.
                    </p>
                  </div>
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

import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
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
        <div className="bg-[#F9F9F9] min-h-screen font-sans text-gray-900 pb-12 md:pb-20 relative overflow-hidden">
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <div className="absolute top-0 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float"></div>
              <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float-delayed" style={{animationDelay: '1s'}}></div>
              <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="containerbox mx-auto">
          <div className="relative z-1">
            {/* Hero Section */}
            <div className="pt-12 pt-16 md:pt-24 md:pt-20">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-gulfs uppercase leading-[0.9] tracking-wide mb-8 text-black">
                Everything You <br/>
                Need To Monetise <br/>
                <span className="text-gray-500">In One Platform.</span>
              </h1>
              
              <div className="mb-16">
                <Link href="/register" className="relative inline-flex items-center gap-4 bg-black text-white font-black text-sm sm:text-normal md:text-lg py-3 px-8 rounded-full 
                        shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                  <span className="relative z-10">Start Free Creator Trial</span>
                  <ArrowRight className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <div className="py-4 text-sm font-medium text-gray-500">
                  3 days free • £4/month after • Cancel anytime
                </div>
              </div>

              {/* Why All-In-One Matters */}
              <div className="bg-white p-8 md:p-12 rounded-[30px]  shadow-sm border border-gray-100 mb-16">
                 <h2 className="text-2xl md:text-3xl xl:text-4xl font-gulfs uppercase mb-6 flex items-center gap-3 text-black">
                    <Layers className="text-pink-600" size={32} /> Why All-In-One Matters
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
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                       { icon: Gift, title: "Wishlist Gifting", desc: "Supporters buy real items, not low-value tips" },
                       { icon: ListChecks, title: "Paid Tasks", desc: "Set rules, deadlines, and prices" },
                       { icon: FileText, title: "Bills & Contributions", desc: "Supporters help with real-world costs" },
                       { icon: Video, title: "Intro Video", desc: "Convert supporters faster" },
                       { icon: Trophy, title: "Leaderboards", desc: "Gamify spending and reward top supporters" }
                    ].map((feature, i) => (
                       <div key={i} className="bg-white p-6 rounded-[30px]  hover:-translate-y-2 transition-transform duration-300 border border-gray-100 hover:border-pink-500 shadow-sm hover:shadow-xl group">
                          <div className="bg-gray-100 w-14 h-14 rounded-[30px]  flex items-center justify-center mb-6 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                             <feature.icon size={28} className="text-gray-800 group-hover:text-white" />
                          </div>
                          <h3 className="text-xl lg:text-2xl font-bold uppercase mb-2 text-gray-900">{feature.title}</h3>
                          <p className="text-gray-500 text-lg">{feature.desc}</p>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-[30px]  lg:rounded-[30px]  p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
                 <div className="relative z-1"> 
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs uppercase mb-4 md:mb-8 text-white">Safety</h2>
                    <div className="max-w-3xl mx-auto space-y-4">
                       <p className="text-normal md:text-xl font-bold text-white">
                          All features link payments to clear platform activity.
                       </p>
                       <p className="text-normal md:text-xl font-bold text-white ">
                          This reduces freezes and chargebacks.
                       </p>
                    </div>
                 </div>
                 <Shield className="absolute -bottom-0 -right-0 w-64 h-64 text-white opacity-20 rotate-12" />
              </div>

            </div>
          </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

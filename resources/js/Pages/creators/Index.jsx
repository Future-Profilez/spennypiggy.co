import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import { Check, ArrowRight, Star, Shield, Zap, Lock, AlertTriangle, Gift, DollarSign } from 'lucide-react';

export default function Index() {
  return (
    <>
      <Head title="Creators — Keep 100%. We Protect Your Payouts.">
        <link rel="canonical" href="/creators" />
        <meta name="description" content="All-in-one monetisation tools for creators. Keep 100% with fast payouts, dispute protection and Stripe-aligned safety." />
        <meta property="og:title" content="Creators — Keep 100%. We Protect Your Payouts." />
        <meta property="og:description" content="All-in-one monetisation tools for creators. Keep 100% with fast payouts, dispute protection and Stripe-aligned safety." />
        <meta property="og:image" content="/siteicon.png" />
        <meta property="og:url" content="https://spennypiggy.co/creators" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Creators — Keep 100%. We Protect Your Payouts." />
        <meta name="twitter:description" content="All-in-one monetisation tools for creators. Keep 100% with fast payouts, dispute protection and Stripe-aligned safety." />
        <meta name="twitter:image" content="/siteicon.png" />
      </Head>
      <Guest>
        <div className="bg-[#F9F9F9]  font-sans text-gray-900 pb-20 relative  ">
          <div className='containerbox max-auto'>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-0 left-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float"></div>
                <div className="absolute top-20 right-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-shape animate-float-delayed" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-[400px] left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape animate-pulse" style={{animationDelay: '5s', animationDuration: '5s'}}></div>
            </div>
            <div className="relative z-1">
              <div className=" pt-12 pb-16 md:pt-24 md:pb-24">
                <div className="max-w-6xl">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl  font-gulfs uppercase leading-[0.9] tracking-wide mb-8 text-black">
                    Creators 
                    Keep <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600">100%.</span> <br/>
                    <span className="text-gray-600">We Protect Your Payouts.</span>
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-600 max-w-2xl leading-relaxed mb-8">
                    All-in-one monetisation tools for creators who want real spending, live support, and long-term account safety.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
                    <Link href="/register" className="relative inline-flex items-center gap-4 bg-black text-white font-black text-xs md:text-lg py-3 px-8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                      <span className="relative z-10">Start Free Creator Trial</span>
                      <ArrowRight className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    3 days free • £4/month after • Cancel anytime
                  </div>
                </div>
              </div>

              {/* Section: Why Creators Choose This */}
              <div className="py-12 lg:py-20 relative z-1">
                <div className="">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl md:leading-snug font-gulfs uppercase mb-6   items-center gap-3 text-black">
                    Why Creators <br/> <span className="text-pink-600">Choose This</span>
                  </h2>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {[
                        "Live Chat Support (Real Humans) — Get help when money is on the line, not days later",
                        "Founder Bonuses for Early Creators — Early adopters unlock extra rewards and priority perks",
                        "Creators Keep 100% — No revenue cuts. Supporters pay the platform fee",
                        "Payout & Chargeback Protection — Disputes handled by the platform, not you",
                        "Stripe-Aligned by Design — Built to avoid freezes, shutdowns, and clawbacks"
                      ].map((item, i) => {
                        const [title, desc] = item.split("—");
                        return (
                          <div key={i} className="bg-white p-3 md:p-6 rounded-2xl border border-gray-100 shadow-lg hover:border-pink-500 transition-colors group">
                            <div className="flex gap-2 md:!gap-4">
                              <div className="bg-pink-100 text-pink-600 p-2 rounded-lg h-fit shrink-0 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                <Check size={20} strokeWidth={3} />
                              </div>
                              <div>
                                <h3 className="text-normal md:text-xl font-bold mb-1 text-gray-900">{title}</h3>
                                <p className="text-gray-500 leading-snug">{desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Founder Bonuses Block embedded in grid */}
                    <div className="bg-black text-white p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-center shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                      <div className="relative z-1">
                          <h2 className="text-2xl sm:text-4xl lg:text-4xl  font-gulfs uppercase mb-6 leading-none">
                            Founder Bonuses <br className='hidden lg:visible'/> for Early Creators
                          </h2>
                          <ul className="space-y-3 md:space-y-4 font-bold text-md lg:text-lg">
                            <li className="flex items-center gap-3"><Star className="fill-yellow-400 text-yellow-400" size={20}/> Available to early creators only</li>
                            <li className="flex items-center gap-3"><Star className="fill-yellow-400 text-yellow-400" size={20}/> Rewards based on platform activity</li>
                            <li className="flex items-center gap-3"><Star className="fill-yellow-400 text-yellow-400" size={20}/> Priority access to new monetisation tools</li>
                            <li className="flex items-center gap-3"><Star className="fill-yellow-400 text-yellow-400" size={20}/> Limited availability — once filled, it’s gone</li>
                          </ul>
                      </div>
                      <Star className="absolute -bottom-10 -right-10 w-64 h-64 text-yellow-400 opacity-10 rotate-12" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Higher Value Spending & Toolkit */}
              <div className=" py-12 md:py-24">
                <div className="grid lg:grid-cols-2 gap-20">
                  <div className='lg:pt-12'>
                    <h2 className="text-3xl md:text-5xl font-gulfs uppercase mb-8 leading-tight text-black">
                      Built to Drive <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 decoration-4 underline-offset-4">Higher-Value</span> Spending
                    </h2>
                    <ul className="space-y-4 md:space-y-6">
                      {[
                        "Supporters spend more on gifts, tasks, and bills",
                        "Multiple ways for supporters to pay — not just tips",
                        "Tools designed for repeat spending, not one-offs",
                        "Works alongside your existing platforms"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-md md:text-lg font-medium text-gray-700">
                            <div className="bg-gray-100 p-2 rounded-full text-pink-600 shrink-0"><DollarSign size={20} /></div>
                            {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Toolkit */}
                  <div className="md:bg-white  md:p-10 rounded-[2.5rem] shadow-xl md:border border-gray-100">
                    <h2 className="text-2xl md:text-3xl font-gulfs uppercase mb-8 text-black">
                      Your Full <br/> Monetisation Toolkit
                    </h2>
                    <ul className="space-y-6">
                      {[
                        "Wishlist Gifting — Supporters buy real items, not low-value tips",
                        "Paid Tasks — Set rules, deadlines, and prices for supporter requests",
                        "Bills & Contributions — Let supporters help with real-world costs",
                        "Intro Video — Convert new supporters faster with context",
                        "Leaderboards — Gamify spending and reward top supporters"
                      ].map((item, i) => {
                        const [title, desc] = item.split("—");
                        return (
                            <li key={i} className="group">
                              <h3 className="font-bold text-md md:text-xl flex items-center gap-2 group-hover:text-pink-600 transition-colors text-gray-900">
                                  <Zap size={18} className="text-yellow-500 fill-yellow-500" /> {title}
                              </h3>
                              <p className="text-gray-500 pl-7">{desc}</p>
                            </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section: Account Safety & Disputes */}
                    
                    {/* Safety */}
                    <div className="mb-20 py-4 md:py-20">
                      <h2 className="text-3xl md:text-5xl font-gulfs uppercase mb-6 text-center text-black">
                          Why Your Account <span className="pinkbg text-white px-2 transform -rotate-1 inline-block">Stays Safe</span> Here
                      </h2>
                      <div className="max-w-3xl mx-auto text-center mb-10">
                          <p className="text-xl text-gray-500 mb-4">Payment accounts get shut down when money arrives without a clear reason.</p>
                          <p className="text-xl font-bold text-black mt-4">That’s why Spenny Piggy:</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                          {[
                            "Enforces clear usage and content rules",
                            "Links every payment to a platform feature",
                            "Sends monthly reminders to creators",
                            "Keeps transaction records Stripe expects"
                          ].map((item, i) => (
                            <div key={i} className="bg-gray-100 p-4 md:p-6 rounded-2xl text-center flex flex-col items-center justify-center border border-gray-100 hover:border-pink-500 transition-colors hover:shadow-lg">
                                <p className="font-bold text-gray-80 text-lg">{item}</p>
                            </div>
                          ))}
                      </div>
                      <p className="text-center mt-4 text-normal md:text-xl font-medium text-gray-500">This is why Stripe remains an option.</p>
                    </div>

                    {/* Disputes */}
                    <div className="bg-black text-white rounded-[2rem] md:rounded-[3rem] 
                     p-4 md:!p-16 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                      
                      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                          <div>
                            <h2 className="text-2xl md:text-4xl font-gulfs uppercase mb-6">
                                Disputes Are <br/> <span className="text-pink-500">Our Problem</span> — Not Yours
                            </h2>
                            <ul className="space-y-4 mb-8">
                                {[
                                  "Delivery receipts on every transaction",
                                  "Time-stamped activity logs",
                                  "Platform-managed dispute handling",
                                  "Creators are never debited"
                                ].map((item, i) => (
                                  <li key={i} className="flex items-center gap-3 text-normal md:text-lg text-gray-300">
                                      <Shield className="text-yellow-400" size={20} /> {item}
                                  </li>
                                ))}
                            </ul>
                            <p className="text-[17px] md:text-xl font-bold text-white border-l-4 border-pink-500 pl-4">
                                If the platform ever loses a dispute, Spenny Piggy absorbs the loss — not the creator.
                            </p>
                          </div>

                          {/* Why Creators Lose Money on Other Apps */}
                          <div className="md:bg-white/10 md:p-8 rounded-[2rem] md:border md:border-white/10 backdrop-blur-sm">
                            <h3 className="text-[16px] md:text-xl font-bold uppercase mb-6 text-red-400 flex items-center gap-2">
                                <AlertTriangle  /> Why Creators Lose Money on Other Payment Apps
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {[
                                  "No delivery tracking",
                                  "No service context",
                                  "No platform protection",
                                  "One report can freeze everything"
                                ].map((item, i) => (
                                  <li key={i} className="text-gray-300 flex items-center gap-3">
                                      <span className="w-2 h-2 bg-red-500 rounded-full"></span> {item}
                                  </li>
                                ))}
                            </ul>
                            <p className="text-black font-bold text-sm md:text-lg text-center bg-white py-3 px-4 rounded-xl">
                                Spenny Piggy exists to remove that risk.
                            </p>
                          </div>
                      </div>
                    </div>
              
              <div className="text-center py-4 md:py-20 px-6">
                <Link href="/register" className="relative inline-flex items-center gap-4 bg-black text-white font-black text-sm md:text-xl py-4 px-12 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden">
                    <span className="relative z-10">Start Free Creator Trial</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <div className="mt-4 text-sm font-medium text-gray-500">
                    3 days free • £4/month after • Live support included
                </div>
              </div>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}

import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import CreatorGuideLinks from './components/CreatorGuideLinks';
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
        <div className="bg-[#A2E4B8] min-h-screen font-sans text-gray-900 pb-12 md:pb-16 relative">
          <div className='containerbox mx-auto'>
            <div className="relative z-1">
              <div className=" pt-12 pb-16 md:pt-24 md:pb-20">
                <div className="max-w-4xl">
                  <div className=" ">
                    <h1 className="text-3xl md:text-5xl font-gulfs uppercase leading-[0.9] tracking-wide mb-4 text-black">
                      Creators Keep <span className="underline decoration-[6px] decoration-yellow-300">100%</span> <br/>
                      <span className="text-gray-700">We Protect Your Payouts</span>
                    </h1>
                    <p className="text-base md:text-lg font-medium text-gray-700 max-w-2xl leading-relaxed">
                      All-in-one monetisation tools for creators who want real spending, live support, and long-term account safety.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start">
                      <Link href="/register" className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-sm md:text-base py-3 px-6 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                        <span>Start Free Creator Trial</span>
                        <ArrowRight />
                      </Link>
                      <span className="text-xs md:text-sm font-medium text-gray-700">3 days free • £8.99 + VAT / month after • Cancel anytime</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Why Creators Choose This */}
              <div className="py-10 md:py-16 relative z-1">
                <div className="">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl md:leading-snug font-gulfs uppercase mb-6   items-center gap-3 text-black">
                    Why Creators <br/> <span className="text-[#FF007F]">Choose This</span>
                  </h2>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {[
                        "Live Chat Support (Real Humans) — Get help when money is on the line, not days later",
                        "Founder Bonuses for Early Creators — Early adopters receive extra rewards and priority perks",
                        "Creators Keep 100% — No revenue cuts. Supporters pay the platform fee",
                        "Payout & Chargeback Protection — Disputes handled by the platform, not you",
                        "Stripe-Aligned by Design — Built to avoid freezes, shutdowns, and clawbacks"
                      ].map((item, i) => {
                        const [title, desc] = item.split("—");
                        return (
                          <div key={i} className="bg-white p-4 md:p-6 rounded-[25px] md:rounded-[30px]  border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <div className="flex gap-2 md:!gap-4">
                              <div className="bg-yellow-300 text-black p-2 rounded-[30px]  h-fit shrink-0 border-[3px] border-black">
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
                    <div className="bg-[#fdfbf7] text-black p-6 rounded-[25px] md:rounded-[30px]  border-[3px] border-black relative overflow-hidden flex flex-col justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="relative z-1">
                          <h2 className="text-2xl sm:text-4xl lg:text-4xl  font-gulfs uppercase mb-6 leading-none">
                            Founder Bonuses <br className='hidden lg:visible'/> for Early Creators
                          </h2>
                          <ul className="space-y-3 md:space-y-4 font-bold text-md lg:text-lg">
                            <li className="flex items-center gap-3"><Star className="text-yellow-500" size={20}/> Available to early creators only</li>
                            <li className="flex items-center gap-3"><Star className="text-yellow-500" size={20}/> Rewards based on platform activity</li>
                            <li className="flex items-center gap-3"><Star className="text-yellow-500" size={20}/> Priority access to new monetisation tools</li>
                            <li className="flex items-center gap-3"><Star className="text-yellow-500" size={20}/> Limited availability — once filled, it’s gone</li>
                          </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Higher Value Spending & Toolkit */}
              <div className=" py-10 md:py-16">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-10">
                  <div className='lg:pt-12'>
                    <h2 className="text-3xl md:text-5xl font-gulfs uppercase mb-8 leading-tight text-black">
                      Built to Drive <br/> <span className="text-gradient-wishlist decoration-4 underline-offset-4">Higher-Value</span> Spending
                    </h2>
                    <ul className="space-y-4 md:space-y-6">
                      {[
                        "Supporters spend more on gifts, tasks, and bills",
                        "Multiple ways for supporters to pay — not just tips",
                        "Tools designed for repeat spending, not one-offs",
                        "Works alongside your existing platforms"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-md md:text-lg font-medium text-gray-700">
                            <div className="bg-gray-100 p-2 rounded-full text-[#FF007F] shrink-0"><DollarSign size={20} /></div>
                            {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Toolkit */}
                  <div className="md:bg-white  md:p-10 rounded-[25px] md:rounded-[30px]  shadow-[4px_4px_0px_0px_#FF007F]l md:border border-gray-100">
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
                              <h3 className="font-bold text-md md:text-xl flex items-center gap-2 group-hover:text-[#FF007F] transition-colors text-gray-900">
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
                    <div className="mb-16 py-8 md:py-12">
                      <h2 className="text-3xl md:text-5xl font-gulfs uppercase mb-6 text-center text-black">
                          Why Your Account <span className="underline decoration-[6px] decoration-yellow-300">Stays Safe</span> Here
                      </h2>
                      <div className="max-w-3xl mx-auto text-center mb-10">
                          <p className="text-xl text-black font-bold mb-4">Payment accounts get shut down when money arrives without a clear reason.</p>
                          <p className="text-xl font-bold text-black mt-4">That’s why Spenny Piggy:</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                          {[
                            "Enforces clear usage and content rules",
                            "Links every payment to a platform feature",
                            "Sends monthly reminders to creators",
                            "Keeps transaction records Stripe expects"
                          ].map((item, i) => (
                            <div key={i} className="bg-[#fdfbf7] p-4 md:p-6 rounded-[25px] md:rounded-[30px]  text-center flex flex-col items-center justify-center border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-bold text-gray-80 text-lg">{item}</p>
                            </div>
                          ))}
                      </div>
                      <p className="text-center mt-4 text-normal md:text-lg font-medium text-gray-900">This is why Stripe remains an option.</p>
                    </div>

                    {/* Disputes */}
                    <div className="bg-black text-white rounded-[25px] md:rounded-[30px]  p-6 md:p-10 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                      
                      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                          <div>
                            <h2 className="text-2xl md:text-4xl font-gulfs uppercase mb-6">
                                Disputes Are <br/> <span className="text-[#FF007F]">Our Problem</span> — Not Yours
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
                            <p className="text-[17px] md:text-xl font-bold text-white border-l-4 border-[#FF007F] pl-4">
                                If the platform ever loses a dispute, Spenny Piggy absorbs the loss — not the creator.
                            </p>
                          </div>

                          {/* Why Creators Lose Money on Other Apps */}
                          <div className="bg-white text-black p-6 rounded-[25px] md:rounded-[30px]  border-[3px] border-black">
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
                                  <li key={i} className="text-gray-600 flex items-center gap-3">
                                      <span className="w-2 h-2 bg-red-500 rounded-full"></span> {item}
                                  </li>
                                ))}
                            </ul>
                            <p className="text-black font-bold text-sm md:text-lg text-center bg-white py-3 px-4 rounded-[30px]  ">
                                Spenny Piggy exists to remove that risk.
                            </p>
                          </div>
                      </div>
                    </div>
              
              <div className="text-center py-4 md:py-12 px-6">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-3 bg-yellow-300 text-black font-black text-base py-3 px-8 rounded-full border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  <span>Start Free Creator Trial</span>
                  <ArrowRight />
                </Link>
                <div className="mt-2 text-sm font-medium text-gray-700">
                  3 days free • £8.99 + VAT / month after • Live support included
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

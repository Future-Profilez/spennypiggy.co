import LoaderButton from '@/Components/LoaderButton';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function ActivateSubscription(props) {

    const { auth, user } = props;

    const [loading, setLoading] = useState(false);
    const checkTerms = () => {
      setLoading(true);
      window.location.href = route("mandatory.checkout");
    }

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={"Activate Subscription"} />
            <div className="blackbg py-10 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8C52FF]/40 to-[#05EFB8]/40 rounded-[30px] blur opacity-20"></div>
                  <div className="relative rounded-[30px] bg-[#000]/40 backdrop-blur-3xl border border-white/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="border border-white/20 bg-red-600/90 w-3.5 h-3.5 rounded-full block"></span>
                        <span className="border border-white/20 bg-yellow-400/90 w-3.5 h-3.5 rounded-full block"></span>
                        <span className="border border-white/20 bg-[#05EFB8]/90 w-3.5 h-3.5 rounded-full block"></span>
                      </div>
                      <span className="text-white/50 text-xs uppercase tracking-widest">Secure Checkout</span>
                    </div>

                    <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div>
                        <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3">Creator Plan</p>
                        <h1 className="text-white font-black text-2xl md:text-4xl leading-tight">
                          Activate your Wishlist plan
                        </h1>
                        <p className="text-white/60 mt-4 text-[14px] md:text-[15px] leading-relaxed">
                          Start with a <span className="text-[#05EFB8] font-bold">3-day free trial</span>. After the trial, your plan renews at <span className="text-white font-bold">£4/month</span>.
                          This includes a £2 Stripe service fee and a £2 admin compliance charge.
                        </p>

                        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 rounded-[20px] bg-white/5 border border-white/10">
                            <p className="text-white/60 text-xs mb-1">Trial</p>
                            <p className="text-white font-black text-lg">3 days free</p>
                            <p className="text-white/40 text-xs mt-1">Cancel before it ends</p>
                          </div>
                          <div className="p-4 rounded-[20px] bg-white/5 border border-white/10">
                            <p className="text-white/60 text-xs mb-1">Billing</p>
                            <p className="text-white font-black text-lg">£4 / month</p>
                            <p className="text-white/40 text-xs mt-1">Secure via Stripe</p>
                          </div>
                        </div>

                        <div className="mt-7 space-y-3">
                          {[
                            'Receive payments and unlock creator tools',
                            'Instant activation — trial starts immediately',
                            'Cancel anytime before the trial ends',
                          ].map((t) => (
                            <div key={t} className="flex items-start gap-3">
                              <span className="mt-2 w-2.5 h-2.5 rounded-full bg-[#05EFB8]"></span>
                              <span className="text-white/70 text-[14px] md:text-[15px]">{t}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 p-4 rounded-[20px] bg-[#8C52FF]/10 border border-[#8C52FF]/20">
                          <p className="text-white/80 text-sm font-bold mb-1">Why is this required?</p>
                          <p className="text-white/60 text-[13px] leading-relaxed">
                            This plan helps cover platform compliance costs and keeps payments secure for supporters and creators.
                          </p>
                        </div>
                      </div>

                      <div className="lg:pl-6">
                        <div className="p-6 rounded-[30px] bg-white/5 border border-white/10">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-white/60 text-xs uppercase tracking-widest">Plan Total</p>
                              <p className="text-white font-black text-3xl mt-2">£4</p>
                              <p className="text-white/40 text-xs -mt-1">per month after trial</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs bg-[#05EFB8] text-black font-bold">3-day trial</span>
                          </div>

                          <div className="mt-5 space-y-2 text-sm">
                            <div className="flex items-center justify-between text-white/70">
                              <span>Stripe service fee</span>
                              <span className="text-white">£2</span>
                            </div>
                            <div className="flex items-center justify-between text-white/70">
                              <span>Admin compliance charge</span>
                              <span className="text-white">£2</span>
                            </div>
                            <div className="h-px bg-white/10 my-2"></div>
                            <div className="flex items-center justify-between text-white font-bold">
                              <span>Monthly total</span>
                              <span>£4</span>
                            </div>
                          </div>

                          <div className="mt-6">
                            <LoaderButton onClick={checkTerms} disabled={loading} className={"button p w-full size-lg"} spinnerclass="fill-red-600">
                              {loading ? "Redirecting..." : "Activate Subscription"}
                            </LoaderButton>
                          </div>

                          <div className="mt-4 text-white/50 text-xs leading-relaxed">
                            By continuing, you agree to recurring billing after the free trial. You can cancel at any time before the trial ends.
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-[20px] bg-white/5 border border-white/10">
                            <p className="text-white/50 text-[11px] uppercase tracking-widest mb-1">Payments</p>
                            <p className="text-white/80 text-sm font-bold">Powered by Stripe</p>
                          </div>
                          <div className="p-4 rounded-[20px] bg-white/5 border border-white/10">
                            <p className="text-white/50 text-[11px] uppercase tracking-widest mb-1">Support</p>
                            <p className="text-white/80 text-sm font-bold">Priority help</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </Authenticated>
    )

}

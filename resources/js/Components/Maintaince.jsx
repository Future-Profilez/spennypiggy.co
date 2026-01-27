import React from 'react'

export default function Maintaince() {
  return (
    <>
      <style>{`
         body {padding-bottom: 0px !important;}
      `}</style>
      <div className="h-screen py-12 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#F94F96] via-[#EFEA7B] to-white md:px-4">
         <div className="max-w-2xl w-full bg-[#fff] md:bg-white rounded-3xl shadow-xl px-8 py-20 text-center relative">
            <div className="absolute inset-x-0 -bottom-10 opacity-10 pointer-events-none">
                  <div className="h-24 bg-repeat-x bg-[radial-gradient(circle_at_1px_1px,#F94F96_1px,transparent_0)]" />
            </div>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F94F96]/10 mb-4 mx-auto relative">
                  <div className="absolute inset-0 rounded-full bg-[#F94F96]/20 animate-ping" />
                  <span className="relative text-4xl animate-bounce">🐷</span>
            </div>
            <p className="uppercase tracking-[0.25em] text-xs text-[#F94F96] font-semibold mb-2">
                  live update in progress
            </p>
            <h1 className="text-2xl md:text-3xl font-gulfs text-[#F94F96] mb-3 tracking-wide uppercase">
                  We are tuning things behind the scenes
            </h1>
            <p className="text-gray-700 mb-2">
                  This page is temporarily unavailable while we roll out some upgrades.
            </p>
            <p className="text-sm text-gray-500 mb-6">
                  Your account, payments and wishlist data are safe. We are just doing a little housekeeping so things run smoother next time you visit.
            </p>
            <div className="w-full max-w-md mx-auto mb-6">
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                     <div className="h-full w-2/3 bg-gradient-to-r from-[#F94F96] to-[#EFEA7B] animate-pulse" />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                     Spenny Piggy engineers are shuffling coins and polishing pages.
                  </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
                  <button
                     type="button"
                     className="px-6 py-2.5 rounded-full bg-[#F94F96] text-white font-semibold shadow hover:bg-[#E23F85] transition"
                     onClick={() => {
                        if (window.history.length > 1) {
                              window.history.back();
                        } else {
                              window.location.href = "/";
                        }
                     }}
                  >
                     Go back
                  </button>
                  <a
                     href="/"
                     className="px-6 py-2.5 rounded-full border border-[#F94F96] text-[#F94F96] font-semibold hover:bg-[#F94F96]/5 transition"
                  >
                     Go to homepage
                  </a>
            </div>
            <p className="text-[11px] text-gray-400">
                  If this message does not go away after a few minutes, please try again later or reach out through our usual support channels.
            </p>
         </div>
      </div>
    </>
  )
}

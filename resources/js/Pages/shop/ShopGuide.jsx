import React from 'react';

export default function ShopGuide() {
    return (
        <div className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Digital Products Flow */}
                <div className="bg-white border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-black text-xl uppercase tracking-wide">💻 Digital Products</h3>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">01.</span>
                            <p className="text-sm font-bold text-gray-700">Add your product (PDF, Link, or Secret Message).</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">02.</span>
                            <p className="text-sm font-bold text-gray-700">Supporter pays and completes the checkout.</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">03.</span>
                            <p className="text-sm font-bold text-gray-700">Fulfillment is <span className="text-green-600 uppercase">Automatic</span>. They get the content instantly on the success page.</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">04.</span>
                            <p className="text-sm font-bold text-gray-700">Funds are added to your balance immediately.</p>
                        </li>
                    </ul>
                </div>

                {/* Physical Products Flow */}
                <div className="bg-white border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-black text-xl uppercase tracking-wide">📦 Physical Products</h3>
                    </div>
                    <ul className="space-y-2">
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">01.</span>
                            <p className="text-sm font-bold text-gray-700">Set your price and shipping rates (Domestic/Worldwide).</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">02.</span>
                            <p className="text-sm font-bold text-gray-700">Supporter provides their shipping address at checkout.</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">03.</span>
                            <p className="text-sm font-bold text-gray-700">Go to <span className="text-blue-600 uppercase">Orders</span> tab, check the address, and ship the item.</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-black text-pink-500">04.</span>
                            <p className="text-sm font-bold text-gray-700">Mark as <span className="text-green-600 uppercase">Delivered</span> in View Info to release the funds to your balance.</p>
                        </li>
                    </ul>
                </div>

                {/* General Tips */}
                <div className="md:col-span-2 bg-yellow-100 border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <h3 className="font-black text-xl uppercase tracking-wide mb-4">💡 Pro Tips for Creators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* <div className="bg-white border-2 border-black p-4 rounded-[20px] md:rounded-[30px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-xs font-black uppercase mb-1 text-pink-500">Variations</p>
                            <p className="text-sm font-bold">Use variations for different sizes, colors, or versions of your product.</p>
                        </div> */}
                        <div className="bg-white border-2 border-black p-4 rounded-[20px] md:rounded-[30px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-xs font-black uppercase mb-1 text-pink-500">Approval</p>
                            <p className="text-sm font-bold">New items are reviewed by Admin. Only you can see them until they are approved.</p>
                        </div>
                        <div className="bg-white border-2 border-black p-4 rounded-[20px] md:rounded-[30px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-xs font-black uppercase mb-1 text-pink-500">Communication</p>
                            <p className="text-sm font-bold">Supporters can leave messages or answer your custom questions during purchase.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

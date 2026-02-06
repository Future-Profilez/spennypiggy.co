import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';

export default function FAQ() {
  const faqs =[
    {
      "title": "What is Spenny Piggy?",
      "description": "Spenny Piggy is your one-stop party platform for every type of creator out there! Get those financial love taps, whip up a wishlist, dish out free and exclusive goodies, and even roll out bespoke memberships and custom commissions. It's the ultimate creator playground! 🚀"
    },
    {
      "title": "How do I get paid?",
      "description": "Bag those bucks effortlessly with automatic Stripe payments! Your payment dashboard lets you be the money maestro, changing payout details on a whim. Initial payouts may take 7-14 days but are usually quick. In the United States/Aus, it's a snappy 2-day roll—charge Monday, party Wednesday. UK/European pals, enjoy a slick 7-day roll—the Monday magic. Keep in mind, payout dates may change based on your account status. If in doubt, reach out to Stripe and us for help! 💰"
    },
    {
      "title": "How much does it cost?",
      "description": "Creators, listen up! The best part? It won't cost you a dime! You pocket the whole 100%. Sure, there might be some tiny conversion costs, but fear not—US, CAD, and UK creators, you're in the clear! Now, here's the scoop for Supporters: there's a service fee, starting at just 8%. But, for those creators craving extra perks, drop £29.99 per month for exclusive features and no service fees for supporters. They just handle the processing fees, making each transaction way cheaper. More money in your pocket, less in fees—win-win! 💸"
    },
    {
      "title": "What currencies do you offer?",
      "description": "Pick your currency! Creators, you've got the choice between USD or GBP. If you're based in the UK, GBP; for the rest of the world, USD is the go-to. Customize your display currency, and supporters can do the same when making payments. Keeping it simple for everyone! 💲"
    }
  ];

  return (
    <>
    <div id={`faq`} className='bg-black pt-24 pb-24 relative ' >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float-delayed"></div>
      </div>

      <div className='containerbox relative  ' >
          <h2 className='fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white mb-12 uppercase leading-tight text-center' >
            Frequently Asked <span className="text-gradient-wishlist">Questions</span>
          </h2>
          <div className='max-w-4xl mx-auto' >
              <div className='flex flex-col gap-6' >
                  {faqs && faqs.map((f, i)=>{
                    return (
                      <Disclosure key={i} defaultOpen={i === 0}>
                        {({ open }) => (
                          <div className={`fading bg-gray-900 border-2 border-pink-500 rounded-3xl shadow-[4px_4px_0px_0px_rgba(236,72,153,1)] overflow-hidden`}>
                            <Disclosure.Button className={`flex w-full justify-between px-6 py-6 text-left text-xl font-gulfs uppercase focus:outline-none ${open ? 'text-yellow-400' : 'text-white'}`}>
                              <span>{f.title}</span>
                              <ChevronUpIcon
                                className={`${
                                  open ? 'rotate-180 transform' : ''
                                } h-6 w-6 text-pink-500 transition-transform duration-200`}
                              />
                            </Disclosure.Button>
                            <Transition
                                enter="transition duration-100 ease-out"
                                enterFrom="transform scale-95 opacity-0"
                                enterTo="transform scale-100 opacity-100"
                                leave="transition duration-75 ease-out"
                                leaveFrom="transform scale-100 opacity-100"
                                leaveTo="transform scale-95 opacity-0"
                            >
                              <Disclosure.Panel className="px-6 pb-6 text-lg text-gray-300 leading-relaxed">
                                {f.description}
                              </Disclosure.Panel>
                            </Transition>
                          </div>
                        )}
                      </Disclosure>
                    )
                  })}
              </div>
          </div>
      </div>
    </div>
    </>
  );
};

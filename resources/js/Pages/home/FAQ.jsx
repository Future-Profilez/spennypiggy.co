import { useState } from "react";
import Accordion from "react-bootstrap/Accordion";

export default function FAQ() {
  const [open, setOpen] = useState(false);

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
    <style jsx>{`
    .faq-custom .accordion-button {
        background-color: transparent !important;
        color: white !important;
        font-family: 'Gulfs Display', sans-serif !important;
        font-size: 1.25rem;
        text-transform: uppercase;
        box-shadow: none !important;
        padding: 1.5rem;
    }
    .faq-custom .accordion-button:not(.collapsed) {
        color: #FACC15 !important; /* Yellow-400 */
    }
    .faq-custom .accordion-button::after {
        filter: invert(1);
    }
    .faq-custom .accordion-button:not(.collapsed)::after {
        filter: invert(1) sepia(1) saturate(5) hue-rotate(0deg); /* Yellow-ish */
    }
    .faq-custom .accordion-item {
        background-color: #111827; /* gray-900 */
        border: 4px solid #EC4899; /* pink-500 */
        border-radius: 1.5rem !important;
        margin-bottom: 1.5rem;
        box-shadow: 4px 4px 0px 0px #EC4899;
        overflow: hidden;
    }
    .faq-custom .accordion-body {
        color: #D1D5DB; /* gray-300 */
        font-size: 1.125rem;
        line-height: 1.625;
        padding: 0 1.5rem 1.5rem 1.5rem;
    }
  `}</style>
    <div id={`faq`} className='bg-black pt-24 pb-24 relative ' >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float-delayed"></div>
      </div>

      <div className='containerbox relative  ' >
          <h2 className='fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white mb-12 uppercase leading-tight text-center' >
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Questions</span>
          </h2>
          <div className='max-w-4xl mx-auto' >
              <div className='faq-custom' >
                  <Accordion defaultActiveKey={0}>
                    {faqs && faqs.map((f, i)=>{
                      return <Accordion.Item eventKey={i} key={i} className='fading' >
                          <Accordion.Header onClick={(e) => setOpen(i)}>
                              {f.title}
                          </Accordion.Header>
                          <Accordion.Body>
                          {f.description}
                          </Accordion.Body>
                      </Accordion.Item>
                    })}
                  </Accordion>
              </div>
          </div>
      </div>
    </div>
    </>
  );
};

import React, { useState } from 'react';
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
    <style>{`
    .faq-section .accordion-button{font-family:var(--body-font);text-transform:uppercase;font-size:20px;color:#ffff;}
    .faq-section .accordion-header button{background:#000000 !important;}
    .faq-section .accordion-collapse{background:#000000 !important;}
    .faq-section .accordion-item{border: 2px solid #05EFB8 !important;}
    .faq-section .accordion-button:focus{box-shadow:none !important;}
  `}</style>
    <div id={`faq`} className='faq-section pt-10 pb-5' >
      <div className='container' >
          <h2 className='headingSm shadow-none font-gulfs stroke-none text-center mb-4 lg:!mb-8 pb-2' >Frequently Asked questions</h2>
          <div className='max-width-1100 m-auto d-table' >
              <div className='faqaccordian' >
                  <Accordion defaultActiveKey={0}>
                    {faqs && faqs.map((f, i)=>{
                      return <Accordion.Item eventKey={i} data-aos="zoom-in-up" className='mb-4' >
                          <Accordion.Header onClick={(e) => setOpen(i)}>
                              {f.title}
                          </Accordion.Header>
                          <Accordion.Body className='text-white'>
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


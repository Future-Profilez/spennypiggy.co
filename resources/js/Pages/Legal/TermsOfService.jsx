import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function TermsOfService(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Terms of Service" />
            <LegalLayout activePage="TermsOfService">
                <div className="mx-auto p-0 lg:p-12">
                    <h1 className="mx-auto p-0 text-2xl md:text-4xl font-black text-[#FF007F] mb-8 uppercase tracking-tighter-12">
                        Terms of Service
                    </h1>
                    <div className="prose prose-pink max-w-none">
<p className="mb-4 text-gray-700 leading-relaxed italic">Last Updated: 23 April 2026</p>
<p className="mb-4 text-gray-700 leading-relaxed">Please read the following important terms and conditions and check that they contain everything which you accept and nothing that you are not willing to agree to.</p>
<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">Definitions</h2>
<p className="mb-4 text-gray-700 leading-relaxed">For the purposes of these Terms:</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Account” means a registered account on the Platform.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Available Balance” means funds eligible for payout after all deductions, reserves, and controls.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Chargeback” means a dispute initiated through a payment provider or card network.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Connected Account” means a payment account established with a Payment Processor.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Creator” means a user who monetises through the Platform.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Creator Content” means all content, services, goods, or interactions offered by a Creator.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Merchant of Record” means the legal entity responsible for a transaction.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Payment Processor” means third-party providers such as Stripe.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Platform Fees” means fees applied by Spenny Piggy.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Reserve” means funds withheld for risk management.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Rolling Reserve” means funds held for a defined period.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Services” means all Platform functionality.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Supporter” means a paying user.</p>
<p className="mb-4 text-gray-700 leading-relaxed">“Transaction” means any payment conducted via the Platform.</p>
<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">Disclaimer</h2>
<p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy is a technology platform and listing platform only and does not guarantee, endorse, verify, or approve any Creator Content. Any disputes, errors, complaints, revision requests, refund requests, delivery queries, or other communications regarding Creator Content, purchases, subscriptions, memberships, paid messages, paid tasks, tribute payments, custom payments, wishlist-linked purchases, or any other form of transaction conducted through the Platform should be made directly to the relevant Creator in the first instance.</p>
<p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy is not responsible for fulfilling, supplying, delivering, managing, or guaranteeing any Creator Content and is not responsible for refunds or the management of disputes arising out of transactions between users, except to the extent that Spenny Piggy may intervene at its sole discretion or where required by law, by a payment processor, or for the protection of the Platform, its users, or third parties.</p>
<p className="mb-4 text-gray-700 leading-relaxed">All transactions relating to Creator Content, including without limitation digital content, subscriptions, memberships, custom content, paid messaging, paid task interactions, support payments, tribute payments, products, wish item rewards, storefront items, and any other form of purchase or payment, are with the relevant Creator only. Creators are listed as independent third-party sellers identified on the Spenny Piggy platform, which facilitates third-party sales, third-party payments, and third-party interactions between users. Unless otherwise expressly stated by Spenny Piggy in writing for a specific flow or feature, the relevant Creator is the Merchant of Record for creator-led transactions. Spenny Piggy does not identify itself as the seller of any goods or services as aforesaid, and users shall have no recourse against Spenny Piggy in respect of such purchases, subscriptions, payments, services, or interactions.</p>
<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">Description of Service</h2>
<p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy, accessed at spennypiggy.co or such other related domain, subdomain, application, interface, or checkout environment as we may make available from time to time, herein referred to as “Spenny Piggy”, the “Website”, the “Site”, or the “Platform”, is a technology platform. It is not a financial institution, bank, merchant, creditor, charity, advisor, broker, money service business, or regulated payment service provider of any kind.</p>
<p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy is designed to allow a Creator to register and customise a page such as a creator profile or storefront page on the Platform. The Platform facilitates, among other things, the following:</p>
<p className="mb-4 text-gray-700 leading-relaxed">It allows creators (see below definition in clause 4.1.1) to publish and customise a page with images, text, video, profile information, offers, pricing, and related materials, and to use that page to facilitate the acceptance of monetary support, support-linked payments, tribute payments, paid messages, paid tasks, subscriptions, memberships, custom requests, digital interactions, reward-based wishlist activity, product-linked purchases through third-party retailer or commerce infrastructure partners, and other forms of Creator content, which shall be collectively referred to in these Terms as “Creator Content”.</p>
<p className="mb-4 text-gray-700 leading-relaxed">It allows Supporters and other users to follow Creators, communicate with Creators, provide support, purchase, subscribe, pay to access content or interactions, and otherwise engage with Creator Content through the Platform.</p>
<p className="mb-4 text-gray-700 leading-relaxed">In summary</p>
<p className="mb-4 text-gray-700 leading-relaxed">We source, host, and operate a platform that enables a community of creators to present and monetise their own Creator Content and interactions and to receive messages and financial compensation from Supporters. The Platform provides the technical environment, payment routing, moderation controls, risk controls, payout administration, and related support infrastructure to make that possible, but it does not become the seller, supplier, or fulfiller of Creator Content simply by providing such infrastructure.</p>
<p className="mb-4 text-gray-700 leading-relaxed">Some of your key rights</p>
<p className="mb-4 text-gray-700 leading-relaxed">This agreement sets out:</p>
<p className="mb-4 text-gray-700 leading-relaxed">your legal rights and responsibilities;</p>
<p className="mb-4 text-gray-700 leading-relaxed">our legal rights and responsibilities; and</p>
<p className="mb-4 text-gray-700 leading-relaxed">certain key information required by law.</p>
<p className="mb-4 text-gray-700 leading-relaxed">In this agreement:</p>
<p className="mb-4 text-gray-700 leading-relaxed">“We”, “us”, or “our” means Social Vortex Limited and, where applicable, Social Vortex, Inc.; and</p>
<p className="mb-4 text-gray-700 leading-relaxed">“You” or “your” means the person accessing or using our Site.</p>
<p className="mb-4 text-gray-700 leading-relaxed">If you do not understand any of the provisions of this agreement, and wish to talk to us about it, please contact us by:</p>
<p className="mb-4 text-gray-700 leading-relaxed">Email: support@spennypiggy.co; or</p>
<p className="mb-4 text-gray-700 leading-relaxed">such other support contact details as we may publish on the Site from time to time.</p>
<p className="mb-4 text-gray-700 leading-relaxed">We are Social Vortex Limited, a company registered in England and Wales under company number 15233693, trading as Spenny Piggy. Our registered office is at 55 Colmore Row, C/O WeWork, Birmingham, B3 2AA, United Kingdom. Our VAT registration number is GB 452012540.</p>
<p className="mb-4 text-gray-700 leading-relaxed">For our US operations, services may also be provided by Social Vortex, Inc., a company registered in Delaware, United States of America. Its registered office is at 1111B S Governors Ave, STE 7527, Dover, DE 19904, United States.</p>
<p className="mb-4 text-gray-700 leading-relaxed">We may update these Terms from time to time, so please check this page regularly for updates. If you do not accept a change to these Terms, you must stop accessing or using our Site immediately.</p>
<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">1. Introduction</h2>
<p className="mb-4 text-gray-700 leading-relaxed">1.1 Application of this agreement</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.1.1 This agreement applies to anyone who accesses or uses our Site, regardless of whether that person has created an account, completed verification, made a purchase, received a payout, or otherwise interacted with our Services.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.1.2 If you do not wish to be bound by this agreement, you must not access or use our Site.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.2 Integrated legal framework</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.1 You acknowledge and agree that Spenny Piggy operates through a structured set of legal documents, policies, and agreements which together form the full legal framework governing your use of the Platform.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.2 These include, without limitation:</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">these Terms & Conditions;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Creator Agreement;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Supporter Terms;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Supporter–Creator Agreement;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Merchant of Record (MoR) Agreement;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Reserves and Payments Policy;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Paid Tasks Terms;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Acceptable Use Policy;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Privacy Policy;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Cookies Policy;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">the Return Policy;</p>
<p className="mb-4 text-gray-700 leading-relaxed">and any other policies or agreements published by Spenny Piggy from time to time.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.3 All such documents are incorporated by reference into these Terms and form a single, unified, legally binding agreement.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.4 By accessing or using the Platform, creating an account, making a purchase, or receiving funds, you confirm that you have read, understood, and agreed to be bound by all documents forming part of the Platform Legal Framework.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.5 Where a feature is subject to specific terms (including but not limited to Paid Tasks, Subscriptions, or Messaging), your use of that feature constitutes acceptance of the applicable additional terms.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.6 You acknowledge that no single document within the Platform Legal Framework operates in isolation, and that your rights and obligations must be interpreted across all applicable documents collectively.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.3 Hierarchy of documents</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.3.1 In the event of any conflict or inconsistency between documents within the Platform Legal Framework, the following order of precedence shall apply:</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Merchant of Record (MoR) Agreement, in respect of payment responsibility and transaction structure;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Reserves and Payments Policy, in respect of payouts, reserves, and fund control;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Creator Agreement, in respect of Creator obligations and earnings;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Supporter–Creator Agreement, in respect of Transactions between users;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Supporter Terms, in respect of Supporter obligations;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Paid Tasks Terms, in respect of task-based payments and interactions;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">These Terms & Conditions, in respect of general Platform use;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Acceptable Use Policy and other compliance policies;</p>
<p className="mb-4 text-gray-700 leading-relaxed ml-6">The Privacy Policy and Cookies Policy, in respect of data processing.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.3.2 Spenny Piggy reserves the right to interpret and apply this hierarchy at its sole discretion where required for compliance, risk management, or operational purposes.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.4 Third-party services</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.4.1 You are also agreeing to be bound by the terms and conditions of any third-party services that you connect to, or use in conjunction with, your Spenny Piggy account or your use of the Platform, including without limitation third-party payment processors such as Stripe and any other linked providers, processors, gateways, payout providers, verification providers, or commerce infrastructure providers that we may use from time to time.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.4.2 Those third-party providers may have their own terms and conditions, acceptable use rules, prohibited business policies, reserve rights, payout conditions, verification requirements, and dispute procedures, and you are responsible for complying with those terms to the extent they apply to you.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.4.3 Spenny Piggy shall not be liable for any action taken by a third-party provider in relation to your account, transactions, funds, payouts, reserves, verification status, or access to services, including without limitation declines, reversals, withholding of funds, reserve application, enhanced due diligence requests, account restrictions, suspensions, or terminations.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.5 Language</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.5.1 This agreement is only available in English. No other language version shall apply unless expressly provided by us in writing.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.6 Other documents and local laws</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.6.1 When accessing the Site, creating an account, purchasing or selling subscriptions, content, physical items, memberships, paid messages, paid tasks, tribute payments, or any other media, service, or interaction, you also agree to be legally bound by our website terms and conditions and any documents referred to in them, including our Privacy Policy, our community or content rules, our payments or payout policies, and any other guidelines or policies published by us from time to time.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.6.2 You also agree that you are responsible for compliance with any applicable local laws to the extent that such laws apply to your access to and use of the Platform or to your transactions with other users.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.7 Changes to access, features, and services</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.7.1 From time to time, we may restrict access to some parts of the Website, or to the entire Website, to users.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.7.2 We may also update and change our Site from time to time to reflect changes to subscriptions, memberships, creator tools, interaction features, support flows, paid messaging, paid tasks, tributes, storefront functionality, wishlist functionality, risk controls, moderation controls, legal requirements, regulatory requirements, payment processor requirements, and our business priorities.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.7.3 We may add, remove, suspend, or materially alter any feature, product, payment method, payout arrangement, moderation method, or account requirement at any time, provided that where a major change materially affects users we will use reasonable efforts to provide notice where reasonably practicable.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">2. Your Privacy and Personal Information</h2>
<p className="mb-4 text-gray-700 leading-relaxed">2.1 Privacy Policy</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.1.1 Our Privacy Policy is available on our Site and forms part of the overall contractual framework governing your use of the Services.</p>

<p className="mb-4 text-gray-700 leading-relaxed">2.2 Use of personal information</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.2.1 Your privacy and personal information are important to us. Any personal information that you provide to us will be dealt with in accordance with our Privacy Policy, which explains what personal information we collect from you, how and why we collect, store, use, and share such information, your rights in relation to your personal information, and how to contact us and supervisory authorities if you have a query or complaint about the use of your personal information.</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.2.2 By using the Platform, you acknowledge that we may process personal information for purposes including, without limitation:</p>
<div className="ml-6 mb-2 text-gray-700">(i) account creation and administration;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) transaction processing and payout administration;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) identity verification and compliance checks;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) fraud prevention, risk monitoring, and moderation;</div>
<div className="ml-6 mb-2 text-gray-700">(v) customer support and dispute handling;</div>
<div className="ml-6 mb-2 text-gray-700">(vi) legal and regulatory compliance.</div>
<p className="mb-4 text-gray-700 leading-relaxed">2.2.3 You acknowledge that some data may also be processed by third-party service providers, including payment processors and identity verification providers, in accordance with their own applicable terms and privacy notices.</p>

<p className="mb-4 text-gray-700 leading-relaxed">2.3 Electronic communications</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.3.1 By using Spenny Piggy, you consent to receiving communications from us electronically, including emails, account alerts, product notices, verification requests, moderation notices, payout notices, reserve notices, risk notices, and messages posted to your Spenny Piggy account.</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.3.2 You acknowledge and agree that all communications that we provide to you electronically satisfy any legal requirement that such communications be in writing.</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.3.3 If you wish to withdraw your consent to receiving non-essential electronic communications from us at any time, you may do so by contacting us at support@spennypiggy.co and notifying us of your withdrawal of consent. However, you acknowledge and agree that we may still send you communications which are necessary for the operation of your account, the performance of these Terms, the administration of Transactions, the operation of payouts, the enforcement of reserves, the handling of disputes, the conduct of moderation, or compliance with legal, regulatory, fraud-prevention, or payment processor requirements.</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.3.4 It is your responsibility to ensure that your contact information remains accurate and up to date at all times and that you regularly review communications sent to your registered email address or made available through your account. We shall not be responsible for any loss, delay, restriction, account action, payout delay, reserve application, dispute outcome, or other consequence arising from your failure to review or respond to communications issued by us.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">3. Account Registration</h2>
<p className="mb-4 text-gray-700 leading-relaxed">3.1 Creating an account</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.1.1 To register and create an account on Spenny Piggy, you must be at least eighteen (18) years of age and capable of entering into a legally binding agreement. By creating an account, you represent and warrant that you meet these requirements.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.1.2 You must provide a valid email address, a username, and a password, or authenticate via an approved third-party login method where available. It is a condition of your use of the Website that all information you provide is accurate, current, complete, and not misleading.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.1.3 We reserve the right, at any time and at our sole discretion, to refuse registration, to require additional information, or to suspend or terminate an account where we are unable to verify the information provided to our reasonable satisfaction.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.2 Information accuracy and ongoing obligations</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.2.1 You agree that all information you provide to register with this Website or otherwise, including through any interactive features on the Website, is governed by our Privacy Policy and must remain accurate and up to date.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.2.2 You must promptly update your account information if any of your details change, including without limitation your name, contact details, payment details, payout details, tax status, or residency.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.2.3 We may rely on the information you provide for the purposes of:</p>
<div className="ml-6 mb-2 text-gray-700">(i) identity verification;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) payment processing;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) payout execution;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) fraud prevention;</div>
<div className="ml-6 mb-2 text-gray-700">(v) regulatory compliance.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.2.4 You acknowledge that failure to provide accurate or up-to-date information may result in:</p>
<div className="ml-6 mb-2 text-gray-700">(i) delayed or withheld payouts;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) account restrictions;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) suspension or termination of your account.</div>

<p className="mb-4 text-gray-700 leading-relaxed">3.3 Payment method requirements (Supporters)</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.3.1 If you intend to subscribe, join a membership, send support, pay for content, access paid messages, complete paid tasks, or otherwise make payments through the Platform, you will be required to provide a valid payment method.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.3.2 Payment information is processed and stored by our third-party payment processors, including but not limited to Stripe. Spenny Piggy does not store full payment card details.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.3.3 By providing payment details, you authorise:</p>
<div className="ml-6 mb-2 text-gray-700">(i) the relevant payment processor to process transactions;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) Spenny Piggy to transmit your information as required to facilitate payments.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.3.4 Spenny Piggy reserves the right to change payment processors at any time without notice, and you agree to comply with the terms of any such processors.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.4 Payout setup and verification (Creators)</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.4.1 If you intend to receive earnings through the Platform, you must complete onboarding with our payment processor and provide valid payout details.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.4.2 This may include, without limitation:</p>
<div className="ml-6 mb-2 text-gray-700">(i) bank account details;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) legal name and address;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) government-issued identification;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) tax information;</div>
<div className="ml-6 mb-2 text-gray-700">(v) any additional verification required by payment processors or law.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.4.3 For UK-based Creators, we may collect details including sort code, account number, account holder name, and address.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.4.4 For international Creators, we may collect such additional information as required by the applicable payment processor and jurisdiction.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.4.5 All such information may be stored within secure environments provided by our payment partners, including within Stripe systems.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.4.6 You acknowledge that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) payouts cannot be made until verification is complete;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) additional verification may be required at any time;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) payouts may be delayed, restricted, or suspended if verification fails or is incomplete.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.5 Tax responsibility</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.5.1 You acknowledge and agree that you are solely responsible for determining, reporting, and paying any taxes applicable to your use of the Platform, including without limitation income tax, VAT, sales tax, or any equivalent obligations in your jurisdiction.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.5.2 Spenny Piggy does not provide tax advice and is not responsible for calculating or remitting taxes on your behalf unless explicitly required by law.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.5.3 You acknowledge that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) you may be required to report earnings to tax authorities;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) tax obligations may arise in multiple jurisdictions;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) failure to comply with tax obligations is your responsibility.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.5.4 Upon reasonable request, we may provide transaction summaries or payout records. Where the generation of formal tax documentation is required, we reserve the right to charge a reasonable administrative fee.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.6 Account use representations</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.6.1 By registering on Spenny Piggy, you represent, warrant, and agree that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) all account registration information and content you provide is your own and is accurate and truthful;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) you have not previously had an account suspended or terminated for breach of these Terms without express permission to re-register;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) you will not use external or unauthorised payment methods to bypass Platform payment systems;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) you will not sell, transfer, or assign your account to any third party;</div>
<div className="ml-6 mb-2 text-gray-700">(v) you will comply with all applicable laws and these Terms at all times.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.6.2 We reserve the right, at any time, to verify your compliance with these Terms and to suspend or restrict your account where we are unable to do so.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.7 Account security</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.7.1 You are fully responsible for all activities that occur under your account.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.7.2 You must keep your login credentials confidential and must not disclose them to any third party.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.7.3 You agree to notify us immediately at support@spennypiggy.co if you suspect any unauthorised use of your account or any breach of security.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.7.4 You should take reasonable steps to protect your account, including logging out after use and exercising caution when accessing your account from shared or public devices.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.7.5 We shall not be liable for any loss or damage arising from your failure to comply with these obligations.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.8 Account control and suspension</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.8.1 We have the right to disable, suspend, or restrict access to any username, password, or account at any time, at our sole discretion, for any reason or no reason, including where we believe you have breached these Terms or where required for compliance, fraud prevention, or operational purposes.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.8.2 Where your account is suspended or restricted:</p>
<div className="ml-6 mb-2 text-gray-700">(i) access to features may be limited;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) payouts may be delayed or withheld;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) content may be removed or restricted.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.8.3 You may not create a new account to circumvent a suspension or restriction without our prior written consent.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.9 General account obligations</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.9.1 Your use of the Site is for your personal use only unless expressly authorised otherwise.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.9.2 You agree that you are responsible for:</p>
<div className="ml-6 mb-2 text-gray-700">(i) all costs associated with your use of the Site;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) maintaining the confidentiality of your account details.</div>
<p className="mb-4 text-gray-700 leading-relaxed">3.9.3 The Site is intended for use by users who can access it lawfully. If you access the Site from outside the United Kingdom, you are responsible for compliance with local laws.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.9.4 You agree to comply with all applicable policies, including our acceptable use and content policies.</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.9.5 We may prevent or suspend your access to the Site if you fail to comply with these Terms or any applicable law.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">4. Acceptable Use for Creators</h2>
<p className="mb-4 text-gray-700 leading-relaxed">4.1 Definition of a Creator</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.1.1 A “Creator” is defined as any user who registers a Spenny Piggy account and uses the Platform in any way to:</p>
<div className="ml-6 mb-2 text-gray-700">(i) publish, upload, or display content;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) solicit or receive payments, support, or contributions;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) offer subscriptions, memberships, or paid access;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) provide paid messaging, paid tasks, tributes, or custom interactions;</div>
<div className="ml-6 mb-2 text-gray-700">(v) sell digital or physical goods or services through the Platform.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.1.2 For the purposes of these Terms, all such content, interactions, offers, and materials shall be collectively referred to as “Creator Content”.</p>

<p className="mb-4 text-gray-700 leading-relaxed">4.2 Responsibility for Creator Content</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.2.1 As a Creator, you are solely responsible for all Creator Content that you create, upload, post, publish, transmit, distribute, or otherwise make available through the Platform.</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.2.2 You represent and warrant that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) you own all rights necessary to use and monetise such content;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) you have obtained all required permissions, licences, and consents;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) your content does not infringe any third-party rights;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) your content complies with all applicable laws and regulations.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.2.3 You acknowledge that you shall be fully liable for any loss, damage, claim, or expense arising out of or in connection with your Creator Content.</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.2.4 You agree to indemnify Spenny Piggy in respect of any such claims.</p>

<p className="mb-4 text-gray-700 leading-relaxed">4.3 Platform moderation and removal rights</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.1 Spenny Piggy operates a combination of automated (including AI-based) and manual moderation systems to review, monitor, and assess content and activity on the Platform.</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.2 You acknowledge and agree that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) content may be automatically flagged, restricted, or removed;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) content may be reviewed by human moderators;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) moderation decisions may be made at any time.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.3 We reserve the right, at our sole discretion, to:</p>
<div className="ml-6 mb-2 text-gray-700">(i) remove or restrict access to any content;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) disable monetisation features on specific content;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) suspend or restrict accounts;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) apply risk controls, including payout delays or reserves.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.4 Such actions may be taken without prior notice where reasonably necessary to:</p>
<div className="ml-6 mb-2 text-gray-700">(a) comply with law or regulation;</div>
<div className="ml-6 mb-2 text-gray-700">(b) comply with payment processor requirements;</div>
<div className="ml-6 mb-2 text-gray-700">(c) protect users or the Platform;</div>
<div className="ml-6 mb-2 text-gray-700">(d) prevent fraud or abuse.</div>

<p className="mb-4 text-gray-700 leading-relaxed">4.4 Data protection obligations of Creators</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.4.1 Where you receive or access personal data relating to other users (including Supporters), you acknowledge that you may act as an independent data controller in respect of such data.</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.4.2 You agree that you will:</p>
<div className="ml-6 mb-2 text-gray-700">(i) process such data lawfully, fairly, and transparently;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) use such data only for legitimate purposes related to your activity on the Platform;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) not misuse, sell, or unlawfully share personal data.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.4.3 You must provide a mechanism for users to:</p>
<div className="ml-6 mb-2 text-gray-700">(i) withdraw consent;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) request deletion of their data.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.4.4 You acknowledge that failure to comply with applicable data protection laws may result in:</p>
<div className="ml-6 mb-2 text-gray-700">(i) account suspension;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) legal liability;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) reporting to regulatory authorities.</div>

<p className="mb-4 text-gray-700 leading-relaxed">4.5 Prohibited use in relation to payment processors</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.5.1 In addition to these Terms, you must comply with the acceptable use and prohibited business policies of any payment processor connected to the Platform, including but not limited to Stripe. </p>
<p className="mb-4 text-gray-700 leading-relaxed">4.5.2 Without limitation, you agree not to use the Platform in connection with:</p>
<div className="ml-6 mb-2 text-gray-700">(i) any activity prohibited by Stripe or equivalent processors;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) any activity that may expose the Platform to financial, legal, or reputational risk.</div>
<p className="mb-4 text-gray-700 leading-relaxed">4.5.3 You acknowledge that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) violations may result in immediate account restriction;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) payouts may be withheld;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) funds may be reversed or frozen.</div>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">5. Expressly Prohibited Activity</h2>
<p className="mb-4 text-gray-700 leading-relaxed">5.1 General prohibition</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.1.1 Users, including both Creators and Supporters, must not use the Platform in connection with any unlawful, harmful, fraudulent, abusive, or prohibited activity.</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.1.2 The examples set out below are not exhaustive, and we reserve the right to determine, at our sole discretion, whether any activity is prohibited.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.2 Illegal and harmful activity</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.2.1 You must not use the Platform to:</p>
<div className="ml-6 mb-2 text-gray-700">(i) engage in or promote illegal activity;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) facilitate fraud, deception, or financial abuse;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) exploit or harm others.</div>
<p className="mb-4 text-gray-700 leading-relaxed">5.2.2 You must not collect or send funds for illegal purposes.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.3 Adult and explicit content restrictions</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.3.1 The Platform operates in accordance with payment processor requirements and applicable law.</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.3.2 Accordingly, you must not upload, publish, or monetise:</p>
<div className="ml-6 mb-2 text-gray-700">(i) nudity or explicit sexual content;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) pornographic material;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) content promoting sexual services or solicitation;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) non-consensual or exploitative content.</div>
<p className="mb-4 text-gray-700 leading-relaxed">5.3.3 Content that is suggestive but not explicit may be permitted at our discretion, provided it complies with all applicable rules.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.4 Abuse, Harassment, Hateful and Violent Content</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.4.1 You must not:</p>
<div className="ml-6 mb-2 text-gray-700">(i) harass, threaten, or abuse other users;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) engage in stalking or intimidation;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) promote hate speech or discrimination;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) upload, publish, or monetise hateful or violent content, including content that promotes, incites, celebrates, or threatens violence, or that attacks or demeans any person or group on the basis of a protected characteristic (including race, ethnicity, national origin, religion, disability, age, sex, gender identity, or sexual orientation).</div>
<p className="mb-4 text-gray-700 leading-relaxed">5.4.2 Such content may not be sold, listed, unlocked, offered as a reward or membership benefit, or associated with any payment on the Platform.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.5 Platform abuse and circumvention</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.5.1 You must not:</p>
<div className="ml-6 mb-2 text-gray-700">(i) attempt to bypass Platform payment systems;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) direct users to external payment methods to avoid fees or controls;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) create multiple accounts to evade restrictions.</div>
<p className="mb-4 text-gray-700 leading-relaxed">5.5.2 Any attempt to circumvent Platform systems may result in:</p>
<div className="ml-6 mb-2 text-gray-700">(i) immediate suspension;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) permanent account termination;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) withholding of funds.</div>

<p className="mb-4 text-gray-700 leading-relaxed">5.6 Criminal and regulated goods</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.6.1 You must not use the Platform to:</p>
<div className="ml-6 mb-2 text-gray-700">(i) promote or sell illegal goods;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) provide instructions for criminal activity;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) trade in regulated or prohibited items.</div>

<p className="mb-4 text-gray-700 leading-relaxed">5.7 Nature of transactions</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.7.1 You acknowledge that:</p>
<div className="ml-6 mb-2 text-gray-700">(i) most transactions relate to digital goods or interactions;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) payments are voluntary and discretionary.</div>
<p className="mb-4 text-gray-700 leading-relaxed">5.7.2 You are responsible for understanding the nature of any transaction you enter into.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.8 Enforcement</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.8.1 We reserve the right to:</p>
<div className="ml-6 mb-2 text-gray-700">(i) investigate suspected breaches;</div>
<div className="ml-6 mb-2 text-gray-700">(ii) remove content;</div>
<div className="ml-6 mb-2 text-gray-700">(iii) restrict accounts;</div>
<div className="ml-6 mb-2 text-gray-700">(iv) report activity to authorities where required.</div>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">6. Purchases, Payments and Earnings</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1 Payment processing and platform role</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1.1 By using the Site, you acknowledge and agree that Spenny Piggy utilises one or more third-party payment processors, including but not limited to Stripe, to process all Transactions conducted through the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1.2 You acknowledge that all payments are processed by such third-party payment processors and that such processors are responsible for:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i) authorising Transactions;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii) processing payments;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii) holding and settling funds;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv) disbursing funds to Creators.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1.3 Spenny Piggy does not itself:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i) process payments;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii) hold funds as a bank or escrow provider;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii) operate as a payment service provider.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1.4 You further acknowledge that, in relation to creator-led Transactions, the Creator acts as the Merchant of Record unless otherwise expressly stated for a specific feature or flow.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1.5 Accordingly, all Transactions are legally between the Supporter and the Creator, and Spenny Piggy’s role is limited to facilitating the technical infrastructure, payment routing, risk management, moderation, and payout administration.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.2 Use of third-party payment providers</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.2.1 We may work with various third-party payment processors, gateways, payout providers, and financial service providers.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.2.2 We reserve the right, at our sole discretion, to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i) change payment processors;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii) add or remove payment methods;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii) modify payment flows.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.2.3 Such third parties may have additional terms and conditions, and you agree to comply with all such terms.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.2.4 We expressly disclaim liability for any failure by you to comply with such third-party terms.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.3 Platform control and discretion</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.3.1 Notwithstanding any provision in any document forming part of the Platform Legal Framework, Spenny Piggy retains sole and absolute discretion to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">suspend or terminate accounts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">delay, restrict, or refuse payouts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">apply reserves or withhold funds;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">remove or restrict content;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">reverse or cancel Transactions;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">require additional verification or compliance checks.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.3.2 Such actions may be taken at any time and without prior notice where reasonably necessary to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">comply with legal or regulatory obligations;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">comply with payment processor requirements (including Stripe);</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">manage fraud, disputes, or financial risk;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">protect the Platform, its users, or its commercial viability.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.4 Platform risk control authority</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.4.1 You acknowledge and agree that Spenny Piggy operates a comprehensive risk management, fraud prevention, and compliance framework designed to protect the Platform, its users, payment processors, and third-party partners.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.4.2 Accordingly, Spenny Piggy retains the right, at its sole and absolute discretion, to take any action it considers necessary or appropriate to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">prevent fraud, abuse, or financial loss;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">comply with applicable laws, regulations, or contractual obligations;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">comply with the requirements of payment processors (including but not limited to Stripe or any successor provider);</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">maintain the integrity, stability, and commercial viability of the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.4.3 Such actions may be taken at any time, with or without prior notice, and may apply at the level of individual Transactions, individual accounts, groups of linked accounts, or the Platform as a whole.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.5 Conditional nature of payments and payouts</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.5.1 You acknowledge that all payments, earnings, balances, and payouts on the Platform are conditional.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.5.2 No funds shall be considered earned, due, or payable until:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">the relevant Transaction has been successfully authorised, processed, and settled by the applicable payment processor;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">any applicable fraud checks, compliance reviews, or verification processes have been completed;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Spenny Piggy has approved the release of funds in accordance with its internal policies and controls.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.5.3 Spenny Piggy may delay, suspend, restrict, or refuse any payout at its sole and absolute discretion, including where such action results in financial impact to the user.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.6 Reserves, withholding and adjustment</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.6.1 Spenny Piggy may apply reserves, including rolling reserves, fixed reserves, or full balance holds, to any account or Transaction.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.6.2 Such reserves may:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">be applied, increased, reduced, extended, or removed at any time;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">be applied before or after payouts have been scheduled or partially processed;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">be applied across one or more accounts where risk is identified.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.6.3 Funds subject to reserves may be held for such duration as Spenny Piggy considers necessary, including beyond any stated reserve period where risk persists.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.7 Clawback, set-off and recovery rights</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.7.1 You expressly authorise Spenny Piggy to recover any amounts owed to it, including but not limited to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">chargebacks;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">refunds;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">reversals;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">payment processor fees or penalties;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">operational losses;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">compliance or regulatory costs.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.7.2 Recovery may be effected by:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">deduction from current earnings;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">deduction from future payouts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">deduction from reserve balances;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">reversal of previously credited or paid amounts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">invoicing you directly for outstanding sums.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.7.3 These rights apply both before and after payout has been completed and shall survive suspension, termination, or closure of your account.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.7.4 You acknowledge that you remain liable for any negative balance and agree to repay such amounts upon demand.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.8 Payment processor control and override</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.8.1 You acknowledge that all Transactions are subject to the rules, decisions, and controls of third-party payment processors.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.8.2 Where a payment processor, including Stripe, takes any action including but not limited to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">delaying or withholding funds;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">reversing or refunding a Transaction;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">imposing reserves or restrictions;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">suspending or terminating accounts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy shall not be liable for any resulting loss, delay, or restriction.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.8.3 You further acknowledge that:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">payment processor decisions may override Platform processes;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Spenny Piggy may be required to act in accordance with such decisions;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">such actions may impact payouts, reserves, or account access.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.9 Linked accounts and network risk controls</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.9.1 Spenny Piggy may identify relationships between accounts based on risk signals, including but not limited to shared identity information, devices, payment methods, behavioural patterns, or transaction flows.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.9.2 Where such relationships are identified, Spenny Piggy may take action across multiple accounts, including:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">applying reserves across accounts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">restricting or suspending multiple accounts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">withholding or offsetting funds across linked accounts.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.9.3 You acknowledge that such actions may be taken even where not all linked accounts have individually breached these Terms.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.10 No guarantee of earnings or platform access</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.10.1 You acknowledge and agree that Spenny Piggy does not guarantee:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">any level of earnings, income, or profitability;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">any volume of transactions or supporter activity;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">continued access to monetisation features;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">uninterrupted availability of the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.10.2 Access to the Platform may be modified, restricted, or removed at any time at Spenny Piggy’s discretion.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.11 Actions in protection of the Platform</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.11.1 Spenny Piggy reserves the right to take any action it reasonably considers necessary to protect:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">its business operations;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">its financial position;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">its relationships with payment processors;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">its regulatory standing;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">its users and partners.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.11.2 Such actions may include measures that delay or prevent payouts, restrict accounts, or otherwise impact users financially.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.11.3 You acknowledge and accept that such actions may be taken in priority of Platform protection, even where they adversely affect individual users.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.12 Debt recovery and assignment</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.12.1 You agree that any amounts owed to Spenny Piggy, including but not limited to negative balances, chargebacks, refunds, fees, penalties, or losses arising from your use of the Platform, constitute a legally recoverable debt.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.12.2 Where any such amount remains unpaid, Spenny Piggy reserves the right, at its sole discretion, to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">pursue recovery directly from you;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">offset the amount against any current or future earnings;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">suspend or restrict your account;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">engage third-party debt collection agencies;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">assign, transfer, or sell the debt to a third party;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">initiate legal proceedings to recover the amount.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.12.3 You acknowledge and agree that:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">such third parties may contact you directly for recovery purposes;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">your personal data may be shared with such third parties in accordance with applicable data protection laws;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">reasonable costs incurred in recovering the debt may be added to the amount owed where permitted by law.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.12.4 These rights shall survive termination or closure of your account.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.13 United States debt collection compliance</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.13.1 Where debts are assigned or referred to third-party collection agencies in the United States, such collection activities shall be conducted in accordance with applicable federal and state laws, including the Fair Debt Collection Practices Act and other applicable consumer protection laws.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.14 Nature of earnings</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.14.1 You may receive earnings from:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	subscriptions and memberships;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	one-time purchases;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	paid messaging or DM access;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	paid tasks or interactions;</div>
                        <div className="ml-6 mb-2 text-gray-700">(v)	tribute or discretionary payments;</div>
                        <div className="ml-6 mb-2 text-gray-700">(vi)	digital content sales;</div>
                        <div className="ml-6 mb-2 text-gray-700">(vii)	physical item-linked transactions.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.14.2 You keep the base amount of what you earn as set by you, subject to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	Platform fees;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	payment processing fees;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	reserves;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	refunds, reversals, or chargebacks;</div>
                        <div className="ml-6 mb-2 text-gray-700">(v)	taxes and external fees.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.14.3 You acknowledge that displayed earnings are provisional and may be adjusted.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.15 Payment authorisation and information</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.15.1 In order to make a purchase, subscribe, or complete a Transaction, you may be required to provide certain information, including without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	your name;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	billing address;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	payment card details;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	security credentials.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.15.2 You represent and warrant that:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	you have the legal right to use the payment method;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	all information provided is accurate and complete.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.15.3 You acknowledge that we may share such information with payment processors and related service providers for the purpose of processing Transactions.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.16 Pricing and Creator control</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.16.1 The price for each subscription, membership, product, interaction, or Transaction shall be set by the Creator.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.16.2 Prices will be clearly displayed on the Platform and may change at any time.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.16.3 You may also have the option to send additional discretionary support to Creators.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.16.4 You acknowledge that:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	prices may vary between Creators;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	pricing may change without notice.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.17 Platform fees and charges</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.17.1 Spenny Piggy applies fees to Transactions conducted through the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.17.2 These fees may include:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	a percentage-based platform fee applied at checkout;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	a compliance or operational fee;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	a fixed transaction fee;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	subscription or account fees payable by Creators.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.17.3 Such fees are typically charged to the Supporter on top of the Creator’s listed price.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.17.4 You acknowledge that:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	the total amount paid by a Supporter may exceed the Creator’s listed price;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	fees are necessary to cover payment processing, compliance, and operational costs.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.17.5 We reserve the right to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	change our fee structure;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	introduce new fees;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	adjust how fees are applied or displayed.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.18 Payment refusal, cancellation and control</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.18.1 We reserve the right to refuse, cancel, suspend, or terminate any Transaction at any time and for any reason, including without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	suspected fraud;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	pricing errors;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	unusual activity;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	breach of these Terms.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.18.2 Such actions may occur:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	before payment processing;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	after payment processing but before settlement;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	after settlement where reversal is required.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.19 Chargeback misuse and payment disputes</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.19.1 You agree not to report as fraudulent, lost, stolen, or unauthorised any payment made through the Platform without a genuine and good faith basis.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.19.2 You further agree not to initiate a chargeback solely due to dissatisfaction with content, interactions, or perceived value.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.19.3 Where a chargeback is initiated without good faith, you may be liable for:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	the amount of the Transaction;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	associated fees;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	administrative costs.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.19.4 We reserve the right to apply an administrative fee and pursue recovery where appropriate.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.20 Payment processor and statement descriptors</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.20.1 Transactions are processed through third-party providers such as Stripe.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.20.2 Payments may appear on your bank or card statement as processed by the payment processor, and may include references to the Creator or Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.20.3 If you do not recognise a Transaction, you must contact support promptly.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.21 Currency and external fees</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.21.1 Transactions may be processed in GBP, USD, or other currencies depending on the Platform configuration.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.21.2 Any currency conversion fees or bank charges shall be determined by your financial institution and are not controlled by Spenny Piggy.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.22 Accepted payment methods</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.22.1 We accept major payment methods including, but not limited to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	Visa;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	Mastercard;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	American Express;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	JCB.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.22.2 We reserve the right to change accepted payment methods at any time.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.23 Payment security</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.23.1 We use commercially reasonable measures to ensure secure payment processing, including encrypted mechanisms provided by our payment processors.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.23.2 However, you acknowledge that:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	no system is completely secure;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	unauthorised access may occur.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.23.3 In the absence of negligence, we shall not be liable for any loss resulting from unauthorised access to payment information.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">6.24 Charging events</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.24.1 Your payment method will be charged:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	when completing a one-time purchase;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	when initiating a subscription or membership;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	upon renewal of recurring subscriptions.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.24.2 All payments are subject to authorisation by the relevant card issuer or financial institution.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">7. Creator Content and Transactions</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.1 Creator offerings</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.1.1 Creators may offer:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	digital content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	memberships and subscriptions;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	paid interactions, messaging, or tasks;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	products or wishlist-linked items.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.1.2 All such offerings are subject to applicable fees and Platform rules.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.2 Contractual relationship</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.2.1 The contractual relationship for any Transaction relating to Creator Content shall be directly between the Creator and the Supporter.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.2.2 The Creator is responsible for providing any applicable terms relating to their offerings.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.3 Platform non-involvement</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.3.1 Spenny Piggy is not a party to any agreements between users and shall not be responsible for:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	fulfilment of content or services;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	returns or refunds;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	disputes between users.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.4 Platform role and Merchant of Record</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.4.1 For the avoidance of doubt, and notwithstanding any other provision of these Terms or any associated agreement, policy, or document, the parties expressly agree as follows.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.4.2 Spenny Piggy operates solely as a technology platform and intermediary that facilitates interactions and transactions between users. Spenny Piggy does not act as a merchant, seller, supplier, distributor, retailer, or contracting party in relation to any Creator Transaction.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.4.3 In all cases, the Creator is the sole Merchant of Record and the sole contracting party responsible for the offer, sale, provision, fulfilment, quality, legality, and delivery of any content, service, or goods made available through the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.4.4 All contractual obligations arising from any transaction exist exclusively between the Creator and the Supporter.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.5 No agency, partnership or representation</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.5.1 Nothing in these Terms, nor in any associated agreement or use of the Platform, shall be construed as creating any form of partnership, joint venture, agency, employment, fiduciary, or representative relationship between:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Spenny Piggy and any Creator;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Spenny Piggy and any Supporter;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">any Creator and any Supporter beyond the specific transaction entered into between them.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.5.2 No user has authority to act on behalf of, bind, or represent Spenny Piggy in any capacity.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.6 Consumer position and digital content waiver</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.6.1 Where a Supporter purchases or accesses digital content, subscriptions, or services that are delivered immediately or made available upon purchase, the Supporter:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">expressly requests immediate performance of the contract;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">acknowledges that access to digital content or services may begin immediately upon payment;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">agrees, to the fullest extent permitted by applicable law, to waive any statutory right to cancel or withdraw from the contract once performance has commenced.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.6.2 Nothing in this clause limits any non-waivable statutory rights, but the parties acknowledge that transactions on the Platform are primarily for immediate access digital content or services provided by Creators.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.7 No platform liability for Creator transactions</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.7.1 To the fullest extent permitted by law, Spenny Piggy shall have no responsibility or liability whatsoever in relation to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">the nature, quality, legality, or accuracy of Creator Content;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">the fulfilment, delivery, or performance of any goods or services;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">any representations, statements, or promises made by Creators;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">any failure by a Creator to perform their obligations.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.7.2 Supporters acknowledge that they enter into transactions at their own risk and must pursue any claims directly against the relevant Creator.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.8 Consistency across Platform documents</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.8.1 This clause shall apply across and take precedence in the interpretation of all Platform documents, including but not limited to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Terms of Service;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Creator Agreement;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Supporter Terms;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Supporter–Creator Contract;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Payments, Payouts and Reserves Policy.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.8.2 In the event of any ambiguity or inconsistency, provisions shall be interpreted in a manner that:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">preserves the Creator’s status as Merchant of Record; and</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">limits Spenny Piggy’s role to that of a technology platform and intermediary.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.9 No assumption of liability through intervention</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.9.1 For the avoidance of doubt, and notwithstanding any other provision of these Terms, Spenny Piggy may, at its sole discretion, take actions in relation to Transactions, accounts, or content, including but not limited to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">issuing refunds or reversals;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">restricting or suspending accounts;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">moderating or removing content;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">delaying, withholding, or releasing funds.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.9.2 Any such action:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">is taken solely for the purposes of risk management, compliance, user protection, or Platform integrity;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">does not create, imply, or establish any obligation, duty of care, or contractual relationship between Spenny Piggy and any user in respect of the underlying Transaction;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">shall not be interpreted as Spenny Piggy acting as merchant, seller, supplier, or responsible party for any Creator Content.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.10 Independent seller and consumer acknowledgment</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.10.1 Supporters acknowledge and agree that:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">all Creator Content is offered by independent third-party Creators;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Spenny Piggy does not produce, supply, or fulfil such content;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">purchases are made directly from Creators acting as independent sellers.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.10.2 Supporters further acknowledge that:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">digital content, subscriptions, and interactions are typically made available immediately upon purchase;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">by completing a Transaction, they expressly request immediate performance of the contract.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.11 Platform non-reliance</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.11.1 To the fullest extent permitted by law:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">users must not rely on the Platform for guarantees of quality, availability, earnings, or outcomes;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">Spenny Piggy makes no representation or warranty as to the success, performance, or reliability of any Creator, content, or Transaction.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">7.12 Interpretation priority</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.12.1 This clause shall apply across all Platform documents and shall be interpreted in a manner that:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">preserves the Creator’s status as Merchant of Record;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">limits Spenny Piggy’s role to that of a technology platform;</p>
                        <p className="mb-4 text-gray-700 leading-relaxed ml-6">prevents any interpretation that would impose seller, supplier, or intermediary liability on Spenny Piggy.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">8. Pricing Policy</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.1 Platform pricing structure</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.1.1 Spenny Piggy applies a fee structure to Transactions conducted through the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.1.2 Fees may be applied in a number of ways, including:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	as a percentage-based fee applied on top of the Creator-set price;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	as a fixed fee applied per Transaction;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	as a compliance, operational, or processing fee.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.1.3 For the avoidance of doubt, the total amount paid by a Supporter may exceed the price set by the Creator due to the application of such fees.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.1.4 Such fees are applied to cover, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	payment processing costs;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	fraud prevention and compliance systems;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	moderation systems (including automated and human review);</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	platform infrastructure and operational costs.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">8.2 Creator pricing and platform role</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.2.1 Creators determine the base price of their Creator Content, memberships, subscriptions, interactions, and other offerings.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.2.2 Spenny Piggy does not set Creator pricing and does not act as the seller of Creator Content.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.2.3 Notwithstanding the above, Spenny Piggy reserves the right to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	restrict pricing where required for compliance;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	remove listings or content that present risk;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	intervene where pricing appears abusive, fraudulent, or misleading.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">8.3 Changes to fees</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.3.1 We reserve the right to change our fees at any time.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.3.2 We may introduce new fees, adjust existing fees, or change how fees are presented or applied.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.3.3 Continued use of the Platform after such changes constitutes acceptance of the updated fee structure.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">8.4 Subscription and creator account fees</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.4.1 Creators may be required to pay subscription or account fees in order to access certain features of the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.4.2 Such fees will be clearly disclosed at the point of purchase or activation.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.4.3 Failure to pay such fees may result in:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	account suspension;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	restriction of monetisation features;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	inability to receive payouts.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">9. Payments</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.1 Platform position on payments</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.1.1 Spenny Piggy is not a payments provider.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.1.2 Payments are made between Supporters and Creators through third-party payment processors.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.1.3 By using the Platform, you acknowledge that:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	all payments are subject to third-party terms;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	Spenny Piggy does not control payment processor decisions.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">9.2 Payment processor obligations</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.2.1 You agree to be bound by the terms of any payment processors connected to the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.2.2 Payment processors are responsible for:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	handling payment credentials;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	authorising Transactions;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	applying fraud and risk checks;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	managing disputes and chargebacks.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">9.3 Visibility of payment information</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.3.1 Payment processors may display certain transaction details depending on the account type and transaction type.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.3.2 Spenny Piggy does not control how such information is displayed by third-party processors. </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">10. Return, Cancellation and Refund Policy</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.1 Finality of Transactions</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.1.1 All purchases made on Spenny Piggy are final and non-refundable except where required by law or expressly permitted by these Terms.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.1.2 This includes, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	digital content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	subscriptions and memberships;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	paid messages and interactions;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	tribute or discretionary payments.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">10.2 Subscription cancellation</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.2.1 You may cancel a subscription at any time.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.2.2 Cancellation prevents future billing only and does not entitle you to a refund for prior charges.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">10.3 Chargebacks and consequences</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.3.1 Any Transaction that results in a chargeback may result in:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	immediate suspension or termination of the user account;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	removal of funds from the Creator;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	recovery action by the Platform.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.3.2 We reserve the right to recover all associated costs.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">10.4 Creator and Platform discretion</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.4.1 Creators may issue refunds at their discretion.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.4.2 Spenny Piggy reserves the right to issue refunds or reverse Transactions at its sole discretion.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">11. Disputes and Chargebacks</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.1 Platform position</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.1.1 Spenny Piggy takes reasonable measures to prevent disputes.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.1.2 However, disputes may still occur due to the nature of digital transactions.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">11.2 Chargeback handling</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.2.1 We may:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	contest disputes;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	provide evidence to payment processors;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	recover losses from Creators.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">11.3 Allocation of losses</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.3.1 In the event of a lost dispute, we reserve the right to charge the Creator some or all of the cost associated with the dispute. </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">12. Billing Errors</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">12.1 Notification requirements</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">12.1.1 If you believe you have been billed in error, you must notify the payment processor and/or Spenny Piggy within thirty (30) days of the charge appearing.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">12.1.2 Failure to notify within this period shall be deemed acceptance of the charge.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">12.2 Limitation of claims</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">12.2.1 We shall not be liable for claims arising from billing errors not reported within the required timeframe.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">13. Social Media Integrations</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">13.1 Third-party integrations</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">13.1.1 The Platform may allow integration with third-party social media services.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">13.1.2 By using such integrations, you agree to comply with the terms of those services.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">13.2 No affiliation</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">13.2.1 Spenny Piggy does not have any affiliation with such platforms unless explicitly stated.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">14. Account Deactivation</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">14.1 User-initiated deactivation</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">14.1.1 You may deactivate your account through the Platform settings.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">14.2 Data retention</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">14.2.1 Certain data may be retained after deactivation for legal, regulatory, or operational purposes.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">14.2.2 Such retention may extend for up to twelve (12) months or longer where required.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">15. Account Eligibility and User Responsibilities</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.1 Eligibility</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.1.1 You must:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	be at least 18 years old;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	be legally capable of entering into contracts;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	not be prohibited from using the Platform.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">15.2 User conduct</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.2.1 You agree to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	comply with all laws;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	treat other users respectfully;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	maintain account security.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.2.2 You agree not to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	misuse the Platform;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	harass or harm others;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	interfere with Platform operations.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">16. The Licence We Give to You</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.1 Limited licence</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.1.1 Subject to your compliance with these Terms, Spenny Piggy grants you a limited, non-exclusive, non-transferable, non-sublicensable, and freely revocable licence to access and use the Site for your own personal and lawful purposes.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.1.2 This licence does not grant you any ownership rights in the Platform or any of its content.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">16.2 Restrictions on use</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.2.1 Except as expressly permitted under these Terms, you may not:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	copy, reproduce, or duplicate any part of the Platform;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	modify, adapt, or create derivative works;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	distribute, sell, sublicense, lease, or transfer access;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	reverse engineer, decompile, or disassemble any part of the Platform.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.2.2 Any unauthorised use shall constitute a material breach of these Terms.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">16.3 Intellectual property rights</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.3.1 All content on the Platform, excluding user-generated content, including text, graphics, software, trademarks, logos, and designs (“Proprietary Materials”), are owned by or licensed to Spenny Piggy.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.3.2 Such materials are protected under applicable intellectual property laws.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.3.3 All rights not expressly granted are reserved.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">17. The Licence You Grant to Us</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.1 Ownership of content</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.1.1 You confirm that you own, or have the necessary rights to use, all content that you upload or publish on the Platform.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">17.2 Licence grant</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.2.1 By uploading or publishing content, you grant Spenny Piggy a worldwide, non-exclusive, royalty-free, perpetual, sublicensable, transferable licence to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	host, store, and display the content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	reproduce and distribute the content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	adapt, format, and modify the content for Platform use;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	use the content for operational, promotional, and compliance purposes.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.2.2 This licence continues even after your account is terminated.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">17.3 Platform use and enforcement</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.3.1 You agree that we may:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	apply watermarks or identifiers;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	use content for moderation and fraud detection;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	remove or restrict content where required.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.3.2 We may also submit infringement notices where your content is unlawfully copied elsewhere. </p>

                        <p className="mb-4 text-gray-700 leading-relaxed">17.4 Waiver of moral rights</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.4.1 To the extent permitted by law, you waive any moral rights in relation to content uploaded to the Platform.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">18. Termination and Suspension</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.1 Termination by user</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.1.1 You may stop using the Platform at any time.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.1.2 Termination does not affect obligations incurred prior to termination.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">18.2 Termination by Spenny Piggy</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.2.1 We may suspend or terminate your account at any time, with or without notice, where:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	you breach these Terms;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	we are required to do so for legal or regulatory reasons;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	risk, fraud, or abuse is suspected.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.2.2 We may also restrict access to features, content, or funds.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">18.3 Effect of termination</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.3.1 Upon termination:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	access to the Platform may be revoked;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	content may be removed;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	payouts may be delayed or withheld.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.3.2 We may retain data as required by law or policy.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">19. Indemnity and Limitation of Liability</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">19.1 Indemnity</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">19.1.1 You agree to indemnify and hold harmless Spenny Piggy, its directors, employees, agents, and affiliates from and against any claims, losses, damages, liabilities, costs, and expenses arising out of:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	your use of the Platform;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	your breach of these Terms;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	your content or conduct.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">19.2 Limitation of liability</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">19.2.1 Our total liability shall be limited to the greater of:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	£100; or</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	the total fees paid by you to us in relation to the claim.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">19.3 Excluded losses</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">19.3.1 We shall not be liable for:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	indirect or consequential losses;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	loss of profits, revenue, or business opportunity;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	loss of data or goodwill;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	losses caused by third parties.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">19.3.2 Nothing in these Terms excludes liability that cannot be excluded by law.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">20.  Content Requirements and Platform Integrity</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">20.1  Creator activity requirements</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">20.1.1  To maintain access to monetisation features, Creators may be required to maintain a minimum level of activity on the Platform.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">20.1.2  This may include the publication of original content and active engagement.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">20.1.3  Failure to meet such requirements may result in:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	suspension of features;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	restriction of payouts;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	account review.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">21.  Creator Subscription and Platform Fees</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">21.1  Account fees</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">21.1.1  Creators may be required to pay a recurring subscription fee to maintain access to Platform features and payment processing infrastructure.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">21.1.2  Failure to pay such fees may result in suspension of account functionality.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">22.  Reporting Content</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">22.1  User reporting</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">22.1.1  Users may report content that they believe is illegal, harmful, or in breach of Platform rules.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">22.1.2  Reports may be submitted through Platform tools or support channels.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">23.  Moderation and Review Systems</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">23.1  Monitoring systems</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">23.1.1  Spenny Piggy operates a combination of:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	automated monitoring systems, including AI-based tools;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	manual review processes.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">23.1.2  These systems are used to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	detect prohibited content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	identify fraud or abuse;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	enforce compliance.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">24.  Action on Prohibited Content</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">24.1  Enforcement actions</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">24.1.1  Where prohibited or illegal content is identified, we may:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	remove content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	restrict accounts;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	suspend or terminate users;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	report activity to authorities.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">25.  Appeals and Communication</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">25.1  User notification</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">25.1.1  Where action is taken, we may notify the affected user and provide information on how to appeal.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">26.  General</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.1  Limitation of service</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.1.1  The Platform is provided on an “as is” and “as available” basis.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.1.2  We do not guarantee uninterrupted or error-free operation.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.2  Technical failures</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.2.1  We shall not be liable for failures relating to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(a)	equipment;</div>
                        <div className="ml-6 mb-2 text-gray-700">(b)	networks;</div>
                        <div className="ml-6 mb-2 text-gray-700">(c)	third-party systems;</div>
                        <div className="ml-6 mb-2 text-gray-700">(d)	cyber attacks;</div>
                        <div className="ml-6 mb-2 text-gray-700">(e)	processor outages;</div>
                        <div className="ml-6 mb-2 text-gray-700">(f)	regulatory action.</div>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.3  Changes to the Platform</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.3.1  We may modify, suspend, or discontinue any part of the Platform at any time without liability.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.4  Inactive accounts</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.4.1  We reserve the right to deactivate accounts that remain inactive for extended periods.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.5  Third-party links</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.5.1  The Platform may contain links to third-party websites.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.5.2  We are not responsible for such websites.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.6  User-generated content</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.6.1  We do not guarantee the accuracy or reliability of user-generated content.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.7  Dispute resolution</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.7.1  We will attempt to resolve disputes promptly.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.7.2  Where resolution cannot be reached, alternative dispute resolution mechanisms may apply.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.8  Legal jurisdiction</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.8.1  These Terms shall be governed by the laws of England and Wales.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.8.2  The courts of England shall have exclusive jurisdiction.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.9  Time limits</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.9.1  Any claim must be brought within twelve (12) months of arising.</p>

                        <p className="mb-4 text-gray-700 leading-relaxed">26.10  Entire agreement</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">26.10.1  These Terms constitute the entire agreement between you and Spenny Piggy.</p>

<p className="mb-4 text-gray-700 leading-relaxed">These Terms were last updated on 23 April 2026.</p>
<p className="mb-4 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}

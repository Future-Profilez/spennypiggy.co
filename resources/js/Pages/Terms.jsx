import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
 
export default function Dashboard(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth.user} user={user}>
            <Head title={'Terms and Conditions'} />
            <div className="wishlistPage blackbg pt-8 pb-14 ">
                <div className="containerbox static-page">
                    <h1>Important Terms and Conditions</h1>

                    <p>
                        Please read the following important terms and conditions
                        and check that they contain everything which you accept
                        and nothing that you are not willing to agree to.
                    </p>

                    <p>
                        Spenny Piggy accessed at{" "}
                        <a href="https://spennypiggy.co" target="_blank">
                            spennypiggy.co
                        </a>{" "}
                        ("Spenny Piggy" or the "Website" or the “Site”) is a
                        social media Wishlist website and application service
                        that allows users to receive funds for gifts from their
                        fans. "Users" or "Wishers" post items on their wishlist
                        and "Gifters" sponsor the purchase of the item through
                        the Spenny Piggy website. Spenny Piggy does not purchase
                        any items on behalf of our Users ("Wishers"). Spenny
                        Piggy sends the funds for the item directly to the User,
                        through our third-party payment gateway, and the User
                        may complete the purchase on their own behalf.
                    </p>

                    <p>For Clarity these are the services provided:</p>
                    <ul>
                        <li>Allow users to Receive Funds</li>
                        <li>
                            Allow users to Upload images / post items on their
                            wishlist
                        </li>
                        <li>
                            Allow gifters to sponsor the purchase of items for
                            users
                        </li>
                    </ul>

                    <p>Summary of some of your key rights:</p>
                    <p>This agreement sets out:</p>
                    <ul>
                        <li>your legal rights and responsibilities;</li>
                        <li>our legal rights and responsibilities; and</li>
                        <li>certain key information required by law.</li>
                    </ul>

                    <p>In this agreement:</p>
                    <p>
                        ‘We’, ‘us’ or ‘our’ means Social Vortex Limited and
                        ‘You’ or ‘your’ means the person using our site.
                    </p>

                    <p>
                        If you don’t understand any of the provisions in the
                        agreement, and want to talk to us about it, please
                        contact us by:
                    </p>
                    <ul>
                        <li>
                            Email:{" "}
                            <a href="mailto:Support@spennypiggy.co">
                                Support@spennypiggy.co
                            </a>{" "}
                            (Monday to Friday: 9 am to 5 pm GMT); or
                        </li>
                        <li>
                            Telephone: 020 4587 3147 (Monday to Friday: 9 am to
                            5 pm GMT)
                        </li>
                    </ul>

                    <p>
                        We are Social Vortex Limited a company registered in
                        England and Wales under company number: 15233693.DBA
                        Spenny Piggy.
                    </p>

                    <p>
                        Our registered office is at: 55 Colmore Row, C/O WeWork,
                        Birmingham, B3 2AA, UK
                    </p>

                    <p>Our VAT registration number is GB 452012540</p>

                    <p>
                        We may update these terms from time to time, so check
                        this page regularly for updates. If you do not accept a
                        change to these terms, you must stop accessing or using
                        our site immediately.
                    </p>

                    <h2>1. Introduction</h2>
                    <p>
                        1.1. This agreement applies to anyone who accesses or
                        uses our site, regardless of registration or user
                        status. If you do not wish to be bound by this
                        agreement, do not access or use our site.
                    </p>
                    <p>
                        1.2. This agreement is only available in English. No
                        other languages will apply to this agreement.
                    </p>
                    <p>
                        1.3. When accessing the site, buying any gifts,
                        subscriptions or any other media, you also agree to be
                        legally bound by our website terms and conditions and
                        any documents referred to in them;
                    </p>
                    <p>
                        1.1. From time to time, we may restrict access to some
                        parts of the Website, or the entire website, to Users.
                    </p>

                    <h2>2. Your privacy and personal information</h2>
                    <p>
                        2.1. Our Privacy Policy is available{" "}
                        <a href="#">here</a>
                    </p>
                    <p>
                        2.2. Your privacy and personal information are important
                        to us. Any personal information that you provide to us
                        will be dealt with in line with our Privacy Policy,
                        which explains what personal information we collect from
                        you, how and why we collect, store, use and share such
                        information, your rights in relation to your personal
                        information and how to contact us and supervisory
                        authorities if you have a query or complaint about the
                        use of your personal information.
                    </p>

                    <p>
                        1.2. By using Spenny piggy, you consent to receiving
                        communications from us electronically, including emails
                        and messages posted to your Spenny Piggy account. You
                        acknowledge and agree that all communications that we
                        provide to you electronically satisfy any legal
                        requirement that such communications be in writing. If
                        you wish to withdraw our consent to receiving
                        communications from us at any time, please email{" "}
                        <a href="mailto:support@spennypiggy.co">
                            support@spennypiggy.co
                        </a>
                        , notifying us of your withdrawal of consent.
                    </p>

                    <h2>1. Account Registration</h2>

                    <p>
                        1.1. To register and create an account on Spenny Piggy
                    </p>
                    <p>
                        1.1.1. You must be over the age of 18 and provide a
                        valid email address, a username, and a password or a
                        valid Gmail account. It is a condition of your use of
                        the Website that all the information you provide on the
                        Website is correct, current, and complete.
                    </p>

                    <p>1.2. Information governance and consent</p>
                    <p>
                        1.2.1. You agree that all information you provide to
                        register with this Website or otherwise, including but
                        not limited to through the use of any interactive
                        features on the Website, is governed by our{" "}
                        <a
                            href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                            target="_blank"
                        >
                            Privacy Policy
                        </a>{" "}
                        and you consent to all actions we take with respect to
                        your information consistent with our Privacy Policy.
                    </p>

                    <p>1.3. Adding a payment card</p>
                    <p>
                        1.3.1. If you are looking to subscribe or donate to
                        other profiles, you will need to add a payment card.
                        When adding a payment card, your card information is
                        stored by a payment processor, which is called Stripe.
                        However, as far as legally possible, Spenny Piggy
                        reserves the right to change the payment processors it
                        uses at any time and without notice to you. Spenny Piggy
                        does not store any payment card information.
                    </p>

                    <p>1.4. Adding a bank account and ID for earning money</p>
                    <p>
                        1.4.1. If you are looking to earn money from gifters
                        subscribing, gifting, or donating to your profile, you
                        will need to add a bank account and upload a valid form
                        of ID. You may also need to submit additional legal
                        information (the exact information required will depend
                        on your country). Your earnings will be paid into your
                        bank account (UK or International) or via one of our
                        payout processors. We store your bank details to make
                        payment. For UK Creators, we store details to make
                        payment to your chosen UK bank account. (Sort Code,
                        Account Number, address and name of the account). For
                        International Creators, we store all required
                        information as per your country's banking requirements.
                        This will include bank account details, your address,
                        and name on the account. All details are stored within
                        our business account on stripe.com.
                    </p>

                    <p>1.5. TAX Status and compliance</p>
                    <p>
                        1.5.1. Your TAX Status and compliance are solely your
                        responsibility. By using the Service, you acknowledge
                        that you are solely responsible for all applicable local
                        or equivalent taxation required by your local laws and
                        governance. Spenny Piggy is not responsible for
                        providing any information to you, other than, upon
                        request, a document displaying all funds transferred to
                        you by our third-party payment processor. If Spenny
                        Piggy is required to provide a tax document on your
                        behalf, the cost to generate such document shall be your
                        responsibility, and you will be billed and shall
                        reimburse Spenny Piggy for that fee. You acknowledge and
                        accept that Spenny Piggy is not responsible for
                        providing any taxation.
                    </p>

                    <p>1.6. Confirmation and Responsibilities</p>
                    <p>
                        1.6.1. By registering on Spenny Piggy, you confirm that:
                    </p>
                    <ul>
                        <li>
                            all account registration, profile information, and
                            content you provide is your own information and the
                            content is truthful and accurate;
                        </li>
                        <li>
                            if you previously had an account with Spenny Piggy,
                            your old account was not terminated or suspended by
                            Spenny Piggy for breach of these Terms;
                        </li>
                        <li>
                            you will not use any third-party payment processors
                            to accept payments for gifts, donations, or
                            subscriptions, or any other service, via Spenny
                            Piggy;
                        </li>
                        <li>
                            you register on Spenny Piggy for your own personal
                            use and you will not sell, rent or transfer your
                            account to any third party; and
                        </li>
                        <li>
                            Spenny Piggy reserves the right, at any time, to
                            verify the information which you provide to us as
                            well as your compliance with these Terms and to
                            suspend your account if it is unable to do so to its
                            reasonable satisfaction.
                        </li>
                    </ul>

                    <p>1.6.2. Account Security and Responsibilities</p>
                    <p>
                        1.6.2.1. You are fully responsible for any and all
                        activities that occur on your account and you are
                        responsible for keeping your login details confidential
                        and secure. You agree not to disclose these details to
                        any other person or entity and immediately notify us at{" "}
                        <a href="mailto:support@spennypiggy.co">
                            support@spennypiggy.co
                        </a>{" "}
                        if you believe someone has used or is using your account
                        without your permission or if your account has been
                        subject to any other breach of security. You also agree
                        to ensure that you log out of your account at the end of
                        each session. You should use particular caution when
                        accessing your account from a public or shared computer
                        so that others are not able to access, view or record
                        your password or other personal information.
                    </p>

                    <p>1.7. Account Disablement</p>
                    <p>
                        1.7.1. We have the right to disable any username,
                        password, or other identifier, whether chosen by you or
                        provided by us, at any time and at our sole discretion
                        for any or no reason, including if, in our opinion, you
                        have breached any provision of these terms.
                    </p>

                    <p>1.8. Your Use of the Site</p>
                    <p>
                        1.8.1. Your use of the site shall be only for your use
                        and you agree that you shall be responsible for:
                    </p>
                    <ul>
                        <li>
                            all costs and expenses you may incur in relation to
                            your use of the Site; and
                        </li>
                        <li>
                            keeping your password and other account details
                            confidential.
                        </li>
                    </ul>

                    <p>1.9. Site Usage and Accessibility</p>
                    <p>
                        1.9.1. The Site is intended for use only by those who
                        can access it from within the UK. If you choose to
                        access the Site from locations outside the UK, you are
                        responsible for compliance with local laws where they
                        are applicable.
                    </p>

                    <p>
                        1.9.2. We seek to make the Site as accessible as
                        possible. If you have any difficulties using the Site,
                        please contact us at{" "}
                        <a href="mailto:support@spennypiggy.co">
                            support@spennypiggy.co
                        </a>{" "}
                        and/or use the website accessibility tools available at{" "}
                        <a href="https://spennypiggy.co" target="_blank">
                            Spennypiggy.co
                        </a>
                        .
                    </p>

                    <p>1.10. Acceptable Use Policy</p>
                    <p>
                        1.10.1. As a condition of your use of the Site, you
                        agree to comply with our{" "}
                        <a href="#">Acceptable Use Policy</a> here.
                    </p>

                    <p>1.11. Access Termination or Suspension</p>
                    <p>
                        1.11.1. We may prevent or suspend your access to the
                        Site if you do not comply with any part of these Terms,
                        any terms or policies to which they refer or any
                        applicable law.
                    </p>

                    <h2>4. Unacceptable Use</h2>
                    <p>
                        1.12. As a condition of your use of the Site, you agree
                        not to use the Site:
                    </p>
                    <ul>
                        <li>
                            for any purpose that is unlawful under any
                            applicable law or prohibited by this Policy;
                        </li>
                        <li>to commit any act of fraud;</li>
                        <li>
                            for the distribution of viruses or malware or other
                            similar harmful software code;
                        </li>
                        <li>
                            for purposes of promoting unsolicited advertising or
                            sending spam;
                        </li>
                        <li>
                            to simulate communications from us or another
                            service or entity in order to collect identity
                            information, authentication credentials, or other
                            information ('phishing');
                        </li>
                        <li>
                            in any manner that disrupts the operation of our
                            Site or business or the website or business of any
                            other entity;
                        </li>
                        <li>in any manner that harms minors;</li>
                        <li>to promote any unlawful activity;</li>
                        <li>
                            to represent or suggest that we endorse any other
                            business, product, or service unless we have
                            separately agreed to do so in writing;
                        </li>
                        <li>
                            to gain unauthorized access to or use of computers,
                            data, systems, accounts, or networks;
                        </li>
                        <li>
                            to attempt to circumvent password or user
                            authentication methods; and
                        </li>
                        <li>
                            create, upload, post, display, publish, or
                            distribute User Content that is obscene, illegal,
                            libelous, hateful, discriminatory, threatening, or
                            harassing, incites violence, causes annoyance,
                            inconvenience, anxiety, or distress (this list is
                            not and should not be regarded as exhaustive).
                        </li>
                    </ul>

                    <p>1.2. Business Authorization</p>
                    <p>
                        1.2.1. If you are using Spenny Piggy on behalf of a
                        business or other entity, you warrant that you are
                        authorized to grant all the licenses stipulated in these
                        Terms and that you are authorized to bind the business
                        or other entity to these Terms.
                    </p>

                    <h2>2. Expressly Prohibited Activity</h2>
                    <p>2.1. Prohibited Activities Guidelines</p>
                    <p>
                        2.1.1. Users engaging with Spenny Piggy, encompassing
                        both Wishers and Gifters, are obliged to adhere to our
                        Prohibited Activities guidelines. It's important to note
                        that this list isn't exhaustive. Spenny Piggy reserves
                        the right to prompt users, at its discretion, for
                        account updates or to face deactivation.
                    </p>

                    <h3>2.2. Prohibited Funding Activities</h3>
                    <p>
                        2.2.1. Explicitly, Wishers cannot collect funds, and
                        Gifters cannot send funds aimed at supporting illegal or
                        prohibited activities. This includes any exchange of
                        goods or services between both parties. Spenny Piggy
                        exclusively permits the sending of gift funds and tips
                        to our Users with a purely charitable intention, devoid
                        of any expectations from the Gifter's end.
                    </p>

                    <h3>2.3. Investigation, Account Closure, and Removal</h3>
                    <p>
                        2.3.1. Spenny Piggy retains the right to investigate
                        Platform use, close accounts, or remove any Cart or User
                        Account if a breach of our Terms of Use is determined,
                        regardless of the specifics.
                    </p>

                    <h3>2.4. Prohibition of Obscene Materials</h3>
                    <p>
                        2.4.1. We strictly prohibit the distribution of obscene
                        materials, including nudity or explicit sexual content.
                        Transactions involving illegal adult content or services
                        such as prostitution are forbidden on our platform.
                    </p>

                    <h3>2.5. Use for Exchange of Goods or Services</h3>
                    <p>
                        2.5.1. By utilizing Spenny Piggy, both Wishers and
                        Gifters acknowledge and agree not to use the platform
                        for exchanging goods or services in return for funds
                        provided by Gifters. Any violation of these guidelines
                        may lead to immediate deactivation of the user's
                        account.
                    </p>

                    <h3>2.6. Spenny Piggy as a Wishlist Platform</h3>
                    <p>
                        2.6.1. Spenny Piggy serves solely as a wishlist
                        platform, enabling Users to post their desired items and
                        receive funds as donations towards their wish baskets.
                        It's essential to understand that Spenny Piggy is not a
                        medium for exchanging products or services. Failure to
                        operate within these guidelines may result in the
                        immediate deactivation of a user's account without prior
                        notice.
                    </p>

                    <h3>2.7. No Entitlement or Expectations</h3>
                    <p>
                        2.7.1. By using this site, you explicitly acknowledge
                        and agree that you do not hold any entitlement or
                        expectations regarding the receipt of services or
                        products from Spenny Piggy Users in exchange for gift
                        funds. When purchasing a gift for a Spenny Piggy User,
                        you acknowledge that it's a conscious decision to make a
                        charitable contribution without any anticipation of
                        receiving products or services in return. Thus, any
                        expectation of products or services in connection with
                        gift funds is expressly prohibited by Spenny Piggy.
                    </p>

                    <h3>2.8 - 2.11 Explicit Content Policies</h3>
                    <p>
                        2.8. Regarding explicit content, Spenny Piggy adheres to
                        its payment provider’s policies, disallowing nudity,
                        pornography, or sexually explicit content on the
                        platform. This includes content depicting or promoting
                        non-consensual sexual acts or adult solicitation.
                    </p>
                    <p>
                        2.9. Sexual exploitation, implied nudity, and sexually
                        explicit content are strictly prohibited. Content
                        showing explicit body parts must be fully covered by
                        clothing to be allowed.
                    </p>
                    <p>
                        2.10. Salacious content that isn't explicit may be
                        permitted, such as depictions of clothing covering
                        specific body parts, but explicit content remains
                        prohibited.
                    </p>
                    <p>
                        2.11. We strictly prohibit content that supports or
                        depicts criminal activities or the trade of regulated
                        goods that are illegal in the United Kingdom. This
                        encompasses a wide range of criminal acts, including
                        instructions on conducting unlawful activities.
                    </p>

                    <p>2.12. Platform for Goodwill and Donations</p>
                    <p>
                        2.12.1. Spenny Piggy operates as a platform for goodwill
                        and donations. By accessing the site and completing an
                        order, you understand that Spenny Piggy does not place
                        orders for wishlist items on behalf of Users. The funds
                        are sent directly to the User, and any utilization of
                        these funds is at the User's discretion. Your
                        contribution is considered a sponsorship toward a
                        specific product from a User's wishlist, and the User
                        has full control over how they use the funds provided.
                    </p>

                    <p>2.13. Donation Responsibilities</p>
                    <p>
                        2.13.1. When making a donation through the site, it's
                        your responsibility to understand how your donation will
                        be utilized. Spenny Piggy does not endorse or guarantee
                        any offers, promises, or rewards made by Users. Any
                        offers or promises made by Wishers connected to gift
                        funding are expressly prohibited and may result in
                        account deactivation.
                    </p>

                    <h2>3. Purchases and Earnings</h2>

                    <p>3.1. Third-Party Payment Processor</p>
                    <p>
                        3.1.1. By using the site, you acknowledge that Spenny
                        Piggy employs a third-party payment processor. You
                        understand that to receive funds for items purchased
                        from your wishlist, you need to set up your bank details
                        with our third-party payment processor. All transactions
                        are handled by our third-party payment processor,
                        responsible for disbursing funds to you upon completion
                        of processing.
                    </p>

                    <h3>3.2. Engagement of Payment Processors</h3>
                    <p>
                        3.2.1. We work with various third-party payment
                        processors and gateways, reserving the right to engage
                        additional processors and gateways at our discretion for
                        all Site and/or Services payments. These third parties
                        might have additional terms and conditions for payment
                        processing, and you're accountable for complying with
                        these terms. We explicitly disclaim liability for any
                        breaches of these terms on your part.
                    </p>

                    <h3>3.3. Earnings and Conversion Fees</h3>
                    <p>
                        3.3.1. You keep 100% of what you earn. However, any
                        conversion fees make reduce this total. We are not
                        responsible for such costs.
                    </p>

                    <h3>3.4. Information for Purchase or Subscription</h3>
                    <p>
                        3.4.1. In order to make a purchase or subscribe, you may
                        be asked to supply certain information to allow us to
                        process and authorize your purchase, including, without
                        limitation, your name, address, card number, card
                        expiration date, card security number and other
                        information. You represent and warrant that (i) you have
                        the legal right to use the form of payment that you use
                        and that (ii) the information that you are providing
                        with that form of payment is true and correct. You
                        acknowledge that we may use a third party for the
                        purposes of processing or facilitating any payment and
                        that by submitting your information to us you grant us
                        the right to provide this information to such third
                        parties.
                    </p>

                    <h3>3.5. Right to Refuse, Cancel, or Terminate Purchase</h3>
                    <p>
                        3.5.1. We reserve the right to refuse, cancel or
                        terminate any purchase any time and for any reason in
                        our sole discretion. Without limiting the foregoing, we
                        reserve the right to refuse, cancel or terminate your
                        purchase because of product or service unavailability,
                        errors in the description of price of our product or
                        service and errors in your purchase.
                    </p>

                    <p>3.6. Subscription and Donation Prices</p>
                    <p>
                        3.6.1. The price for each subscription or single
                        donation will be set by the wishers. The prices will be
                        clearly stated on the Website and may change from time
                        to time. You will further have the chance to send tips
                        to the Creators at your sole discretion.
                    </p>

                    <p>3.7. Reporting and Liability</p>
                    <p>
                        3.7.1. You agree not to report as fraudulent, lost or
                        stolen any form of payment which you have used in
                        conjunction with payment to us, for which you do not
                        have a good faith reason to believe is in fact
                        fraudulent, lost or stolen. You agree not to report as
                        unauthorized any charge by us for any goods or services,
                        for which you do not have a good faith reason to believe
                        is in fact unauthorized. You agree that absent good
                        faith, in the event of any such report you shall be
                        liable to us for such charge or obligation plus an
                        additional £120 administrative fee. The liability
                        specified in this paragraph will not limit our rights or
                        any other liability you may have for any other reason,
                        including a breach of any other provision of these
                        Terms.
                    </p>

                    <p>3.8. Payment Processing by Stripe</p>
                    <p>
                        3.8.1. All transactions are processed by Stripe.
                        Payments on your statements will be debited by Stripe.
                        In the event that you do not recognize them, please
                        contact the Support team at Support@spennypiggy.co or on
                        020 4587 3147.
                    </p>

                    <p>3.9. Fees and Currency</p>
                    <p>
                        3.9.1. Our fees are chargeable in Great British Pounds
                        (GBP), and any exchange fees/settlements will be
                        determined by the agreement between you and your bank or
                        credit or debit card issuer.
                    </p>

                    <p>3.10. Payment Processing Fees</p>
                    <p>
                        3.10.1. All successful transactions incur payment
                        processing fees that are covered by Spenny Piggy.
                    </p>

                    <p>3.11. Accepted Payment Methods</p>
                    <p>
                        3.11.1. We accept the following credit cards and debit
                        cards: VISA, MASTERCARD, AMEX, JCB, and various other
                        methods of payment and reserve the right to change this
                        list at any time.
                    </p>

                    <p>3.12. Security of Payment Information</p>
                    <p>
                        3.12.1. We will do all that we reasonably can to ensure
                        that all of the information you give us when paying for
                        a subscription is secure by using an encrypted secure
                        payment mechanism. However, in the absence of negligence
                        on our part, any failure by us to comply with this
                        agreement or our Privacy Policy (see section 2) or
                        breach by us of our duties under applicable laws we will
                        not be legally responsible to you for any loss that you
                        may suffer if a third party gains unauthorized access to
                        any information that you give us.
                    </p>

                    <p>3.13. Payment Timing</p>
                    <p>
                        3.13.1. Your credit card or debit card will only be
                        charged when making a SINGLE payment or REOCCURRING
                        subscription.
                    </p>

                    <p>3.14. Authorization of Card Payments</p>
                    <p>
                        3.14.1. All payments by credit card or debit card need
                        to be authorized by the relevant card issuer.
                    </p>

                    <h2>4. Pricing Policy</h2>
                    <p>
                        4.1.1. Spenny Piggy applies a flat 20% surcharge/fee on
                        top of the User-set product price. This fee covers the
                        expenses of our payment merchant and associated
                        administrative costs. For absolute clarity, this 20% fee
                        covers payment processing fees globally.
                    </p>

                    <h2>5. Return, Cancellation & Refund Policy</h2>
                    <p>
                        5.1.1. All purchases made on SpennyPiggy.co are final
                        and non-refundable. You are entitled to cancel any paid
                        subscription, for any reason and at any time, thereby
                        ensuring that you will not be billed again for that
                        subscription.
                    </p>
                    <p>
                        5.1.2. Any purchase made on Spenny Piggy resulting in a
                        chargeback will cause the User’s account to be
                        immediately and permanently excluded from Spenny Piggy.
                        Additionally, the chargeback amount will be removed from
                        the earning Creator's income.
                    </p>
                    <p>
                        5.1.3. We retain the right to consider refund requests
                        at our sole discretion.
                    </p>
                    <p>
                        5.1.4. Gift purchasers must explicitly accept that each
                        transaction is non-refundable before making the order.
                        For subscriptions, it is your responsibility to cancel
                        at any time before the subscription is due. If you fail
                        to do so, you will be charged as you agreed to when
                        setting up the subscription.
                    </p>

                    <h2>6. Disputes and Chargebacks</h2>
                    <p>
                        6.1.1. Spenny Piggy takes extensive measures to prevent
                        disputes within the business. Despite enacting the
                        highest level of credit card processing security,
                        disputes may still occur, although they're infrequent on
                        our platform. We're dedicated to collaborating with our
                        users (Wishers) to contest unjust disputes. However, in
                        the event of a lost dispute, Spenny Piggy reserves the
                        right to charge the wishlist owner some or all the cost
                        of the lost dispute.
                    </p>

                    <h2>7. Billing Errors</h2>
                    <p>
                        7.1.1. If you believe you've been mistakenly billed,
                        please promptly notify our third-party billing agent
                        (Stripe) about the error. Failure to do so within thirty
                        (30) days of the billing error appearing on any account
                        statement means you accept the fee in question for all
                        purposes, including inquiries made by or on behalf of
                        your banking institution. We're released from all
                        liabilities and claims resulting from any error or
                        discrepancy not reported within thirty (30) days of the
                        bill being issued to you. These terms supplement any
                        requirements from third-party billing entities we engage
                        with for billing services. You're responsible for
                        reviewing and complying with these entities' terms, in
                        addition to those in this Agreement.
                    </p>

                    <h2>8. Social Media</h2>
                    <p>
                        8.1.1. Spenny piggy allows Users to connect to various
                        social media companies including and not limited to:
                        Spotify, Facebook, Twitter, Instagram and Snapchat. By
                        using this feature, you must fully comply with and
                        respect the Terms of Service for Spotify, Facebook and
                        Twitter, Instagram and Snapchat. Spenny Piggy holds no
                        business relationship with any of the aforementioned
                        social media companies and holds no licenses to any of
                        the logos in use on the site. There may be other social
                        media sites allowed on Spenny piggy to which the same
                        policy applies.
                    </p>

                    <h2>9. Account Deactivation</h2>
                    <p>
                        9.1.1 Should you wish to deactivate your account, please
                        login and delete your account from the settings section.
                        Depending on the account type, account data will need to
                        be kept on file for a period of time after deactivation
                        or deletion. Please refer to our Privacy Policy for more
                        information. For the avoidance of doubt by using our
                        services you agree to and acknowledge that your data
                        will be kept on file for up to 12 months.
                    </p>

                    <p>
                        Before you create an account, you will need to ensure
                        you are eligible to use the site. This section details
                        what you can and can’t do when using the site, as well
                        as the rights you grant to us. You are not authorised to
                        create an account or use the site unless all of the
                        following are true, and by using our site, you
                        represent, warrant, and agree that:
                    </p>

                    <ol>
                        <li>4.1. You are at least 18 years old;</li>
                        <li>
                            4.2. You are legally qualified to enter a binding
                            contract with us;
                        </li>
                        <li>
                            4.3. You are not prohibited by law from using our
                            site;
                        </li>
                        <li>
                            4.4. You have not committed, been convicted of, or
                            pled no contest to a felony or indictable offence
                            (or crime of similar severity), a sex crime, or any
                            crime involving violence or a threat of violence,
                            unless you have received clemency for a non-violent
                            crime and we have determined that you are not likely
                            to pose a threat to other users of our site;
                        </li>
                        <li>
                            4.5. You are not required to register as a sex
                            offender, or are already registered as one;
                        </li>
                        <li>
                            4.6. You have not been banned from using our site;
                        </li>
                        <li>
                            4.7. You do not have more than one account on our
                            site;
                        </li>
                        <li>
                            4.8. Comply with our terms and regularly check this
                            page for updates;
                        </li>
                        <li>
                            4.9. Comply with all applicable laws including, and
                            without limitation, all privacy laws, intellectual
                            property laws, data protection laws and regulatory
                            requirements;
                        </li>
                        <li>
                            4.10. Treat other users in a respectful and
                            courteous manner;
                        </li>
                        <li>
                            4.11. Maintain a strong password and take reasonable
                            steps to protect your login details;
                        </li>
                        <li>
                            4.12. Not use the site in a way that damages the
                            site, or prevents its use by other users;
                        </li>
                        <li>
                            4.13. Not use the site for any harmful, illegal, or
                            nefarious purpose; harass, bully, stalk, intimidate,
                            assault, defame, harm or otherwise mistreat any
                            users;
                        </li>
                        <li>
                            4.14. Not use the site in a way to interfere with,
                            disrupt or negatively affect the platform, the
                            servers, or the site’s networks;
                        </li>
                        <li>4.15. Not use another user’s account;</li>
                        <li>
                            4.16. Do not Violate the licence given to you by
                            Social Vortex Limited; and
                        </li>
                        <li>
                            4.17. Do Not Copy, modify, transmit, distribute, or
                            create any derivative works from, any creator
                            content or our content, or any copyrighted material,
                            images, trademarks, trade names, service marks, or
                            other intellectual property, content or proprietary
                            information accessible through the site without our
                            prior written consent.
                        </li>
                    </ol>

                    <h2>The License We Give to You</h2>

                    <p>
                        5.1. Subject to your compliance with these terms, we
                        grant you a limited, non-exclusive, non-transferable,
                        freely revocable license to use our site for your own
                        personal non-commercial purposes. Except as expressly
                        permitted in these terms, you may not: (i) copy, modify
                        or create derivative works based on the site; (ii)
                        distribute, transfer, sublicense, lease, lend or rent
                        your account on the site to any third party; or (iii)
                        reverse engineer, decompile or disassemble our site. We
                        reserve all rights in and to the site not expressly
                        granted to you under these terms.
                    </p>

                    <p>
                        5.2. Subject to your compliance with the terms and
                        conditions set out in these terms, we hereby grant to
                        you a limited, non-exclusive, non-transferable, freely
                        revocable license to view content for personal use,
                        except as we may restrict or block at the request of its
                        content providers or on its own initiative.
                    </p>

                    <p>
                        5.3. We reserve all rights not expressly granted in
                        these terms.
                    </p>

                    <p>
                        5.4. We reserve the right to exercise whatever lawful
                        means we deem necessary to prevent unauthorized or
                        prohibited uses.
                    </p>

                    <p>
                        5.5. The Content on the Website, excluding your Content
                        and third-party links, but including other text,
                        graphical images, photographs, music, video, software,
                        scripts and trademarks, service marks and logos
                        contained therein (collectively “Proprietary
                        Materials”), are owned by and/or licensed to us. All
                        Proprietary Materials are subject to copyright,
                        trademark and/or other rights under the laws of
                        applicable jurisdictions, including domestic laws,
                        foreign laws, and international conventions. We reserve
                        all our rights over our Proprietary Materials.
                    </p>

                    <p>
                        5.6. Except as otherwise explicitly permitted, you agree
                        not to copy, modify, publish, transmit, distribute,
                        participate in the transfer or sale of, create
                        derivative works of, or in any other way exploit, in
                        whole or in part, any Proprietary Material.
                    </p>

                    <h2>The License You Grant to Us</h2>

                    <p>
                        6.1. You agree that you own all intellectual property
                        rights (examples of which are copyright and trademarks)
                        in any content you upload to our site, or that you have
                        obtained all necessary rights to it.
                    </p>

                    <p>
                        6.2. You consent to grant us a license to all content
                        posted to our site to perform any act restricted by any
                        intellectual property right (including copyright) in
                        such Content, for any purpose reasonably related to the
                        provision and operation of the site. These include
                        reproduction, ensuring availability, communication
                        online and offline, displaying, performing,
                        distribution, translation, and adapting or derivative
                        works of the posted content, or otherwise.
                    </p>

                    <p>
                        6.3. The license which you grant to us is a
                        non-exclusive, royalty-free, worldwide, perpetual
                        sublicensable, assignable, and transferable by us. This
                        means that the license will continue even after your
                        agreement with us ends and you stop using our website,
                        that we do not have to pay you for the license, and that
                        we can grant a sub-license of all posted content to
                        someone else or assign or transfer the license to
                        someone else. This license will enable us to insert text
                        and/or watermarks to posted content, to make it
                        available to other users of the site, as well as to use
                        it for other normal day-to-day operations of the site.
                        We may sell or transfer any license you grant to us in
                        these terms in the event of a sale of our company or its
                        assets to a third party.
                    </p>

                    <p>
                        6.4. Although we do not own your posted content, you
                        grant us the right to submit infringement notifications
                        to any third-party website or service that hosts or is
                        otherwise dealing in infringing copies of the relevant
                        consent without permission. For the avoidance of doubt,
                        we are not under any obligation to submit notifications
                        of infringement, we may at any time submit or withdraw
                        any such notification to any third-party website or
                        service where we consider it appropriate to do so.
                    </p>

                    <p>
                        6.5. You agree that upon our written request, you will
                        provide us with all consents and other information which
                        we reasonably need to submit notifications of
                        infringement on your behalf.
                    </p>

                    <p>
                        6.6. You waive any moral rights which you may have under
                        any applicable law to object to derogatory treatment of
                        any and all posted consent by you on our site.
                    </p>

                    <h2>End of the Agreement</h2>

                    <p>
                        If this agreement is ended, it will not affect our right
                        to receive any money which you owe to us under this
                        agreement.
                    </p>

                    <h2>8. Indemnity</h2>

                    <p>
                        8.1. You agree to indemnify and hold harmless us, our
                        directors, employees and consultants from and against
                        any and all claims, losses, demands, causes of action
                        and judgments (including solicitors' or attorneys' fees
                        and court costs) arising from or concerning any breach
                        by you of this Agreement and/or these terms for your use
                        of the site, and you agree to reimburse us on demand for
                        any losses, costs, or expenses we incur as a result
                        thereof.
                    </p>

                    <p>
                        8.2. Our total liability to you for any and all claims
                        arising out of this agreement, whether in contract, tort
                        (including negligence), breach of statutory duty, or
                        otherwise shall be limited to the greater of £100, or
                        100% of the fees paid by you to us in relation to the
                        claim.
                    </p>

                    <p>
                        8.3. Except for any legal responsibility that we cannot
                        exclude in law (such as for death or personal injury),
                        we are not legally responsible for any:
                    </p>

                    <ul>
                        <li>
                            8.3.1. losses that:
                            <ul>
                                <li>
                                    (a) were not foreseeable to you and us when
                                    the agreement was formed;
                                </li>
                                <li>
                                    (b) that were not caused by any breach on
                                    our part;
                                </li>
                            </ul>
                        </li>
                        <li>8.3.2. business losses;</li>
                        <li>8.3.3. losses to non-consumers;</li>
                        <li>8.3.4. losses of profits;</li>
                        <li>8.3.5. loss of anticipated savings;</li>
                        <li>
                            8.3.6. loss of business opportunity or goodwill or
                            reputation;
                        </li>
                        <li>
                            8.3.7. loss of data or information, including any
                            content;
                        </li>
                        <li>8.3.8. indirect or consequential losses;</li>
                        <li>
                            8.3.9. loss or damage to you caused by a virus,
                            malware, ransomware, or other technologically
                            harmful material that may infect your computer, data
                            or other material due to your use of our site;
                        </li>
                        <li>
                            8.3.10. loss of privacy in the event that your data
                            is reposted elsewhere;
                        </li>
                        <li>
                            8.3.11. loss resultant from the disclosure of your
                            identity or publication of your personal information
                            by other users or third parties without your
                            consent;
                        </li>
                    </ul>

                    <h2>9. Referral Scheme</h2>

                    <p>
                        17.1 Every user with a Spenny Piggy account has a unique
                        referral URL that allows users to earn income from any
                        other user who signs up via their referral link. In
                        order to ensure the referral is successful, the new user
                        must register with Spenny Piggy using the same browser
                        that they used to click the referral link. More
                        information on how the Referral Scheme works can be
                        found at:
                        <a href="https://spennypiggy.co/promotions">
                            https://spennypiggy.co/promotions
                        </a>
                    </p>

                    <p>
                        17.2 Spenny Piggy pays Users who refer other Users 5% of
                        all total income earned by the referred User, and the
                        payment of this referred income is processed on the
                        first calendar business day of each month. This referral
                        income is deducted from the Spenny Piggy’s fee and not
                        from the income of the referred User.
                    </p>

                    <p>
                        17.3 For a User to be successfully added to another
                        User's referral scheme, that user must sign up to Spenny
                        Piggy via a unique referral URL. In no event will Spenny
                        Piggy be liable to add a user to a referral account if
                        that user has not signed up via the correct referral
                        link.
                    </p>

                    <p>
                        17.4 Users may not use Google Ads to impersonate Spenny
                        Piggy with the intention to refer other Users.
                    </p>

                    <p>
                        17.5 We reserve the right to review, change and cancel
                        at our sole discretion and without notice the referral
                        scheme.
                    </p>

                    <h2>10. Thank you notes</h2>

                    <p>
                        10.1. After funding a gift, users on Spenny Piggy will
                        receive a Thank You note either from the Wisher or from
                        Spenny Piggy on behalf of the Wisher. The "Thank You"
                        note refers to any video, image, or text message
                        displayed to the user after the purchase. This note will
                        appear either after checking out on Spenny Piggy, in an
                        email receipt, an email, a page on Spenny Piggy, or
                        elsewhere. The Thank You note might be automated by
                        Spenny Piggy on behalf of the Wisher, automated by the
                        Wisher themselves, or manually created by the Wisher and
                        sent to the user through Spenny Piggy. If users don't
                        provide a valid email address, we cannot guarantee the
                        delivery of the Thank You note. Similarly, if there are
                        any email delivery issues, we cannot be held responsible
                        as these issues involve third parties, such as the
                        user's email provider. We cannot guarantee the delivery
                        of the Thank You note if the user exits Spenny Piggy
                        before the note is displayed. These notes have no
                        minimum length or required sentiment or text.
                    </p>

                    <h2>11. General</h2>

                    <p>
                        11.1. Our liability for losses you suffer as a result of
                        us breaking this agreement is strictly limited to the
                        purchase price of the gift donated.
                    </p>

                    <p>
                        11.2. We shall not be liable to you for the failure of
                        any equipment, data processing system, or transmission
                        link and will not be liable to you as a result of any
                        downtime which may occur upon the site.
                    </p>

                    <p>
                        11.3. The site is provided on an "as is" basis, and you
                        acknowledge that despite our reasonable endeavors, the
                        site may contain bugs, errors, and other problems
                        (including, but not by way of limitation) infection by
                        viruses (despite anti-virus protections which may be
                        incorporated) or anything else that may cause
                        contamination or destruction of any sort that may cause
                        system failures. Pursuant thereto, we will use all
                        reasonable endeavors to correct any errors and omissions
                        as quickly as practicable after being notified by email
                        to
                        <a href="mailto:Support@spennypiggy.co">
                            Support@spennypiggy.co
                        </a>
                    </p>

                    <p>
                        11.4. We shall not be responsible to you for damages or
                        otherwise in respect of any error made to any listing of
                        or reference to a subscription.
                    </p>

                    <p>
                        11.5. We reserve the right to suspend or terminate your
                        access to the site or parts of it if at our sole
                        discretion we believe you are in breach of any provision
                        of this agreement. If your access has been suspended or
                        terminated you will not be permitted to re-register or
                        to re-access the site without our prior consent.
                    </p>

                    <p>
                        11.6. We reserve the right at any time and from time to
                        time to modify or discontinue, temporarily or
                        permanently the site (or any part thereof) without
                        notice to you and without any liability to you or to any
                        third party.
                    </p>

                    <p>
                        11.7. We reserve the right to deactivate your account if
                        it has not been active for a period of six (6) months or
                        more, and to remove it from the database if no
                        communication has been received from you for a further 3
                        months after deactivation has occurred in line with data
                        protection regulation.
                    </p>

                    <p>11.8. Links to third party websites</p>

                    <p>
                        11.8. Links to third party websites on the site are
                        provided solely for your convenience. If you use these
                        links, you leave the site. We have not reviewed all of
                        these third party websites and do not control and are
                        not responsible for these websites or their content or
                        availability. We therefore do not endorse or make any
                        representations about them, or any material found there,
                        or any results that may be obtained from using them. If
                        you decide to access any of the third party websites
                        linked to the site, you do so entirely at your own risk.
                    </p>

                    <p>11.9. Creating a link to our Site</p>

                    <p>
                        11.9. You may create a link to our Site from another
                        website without our prior written consent provided no
                        such link:
                    </p>

                    <ul>
                        <li>
                            11.9.1 creates a frame or any other browser or
                            border environment around the content of our Site;
                        </li>
                        <li>
                            11.9.2 implies that we endorse your products or
                            services or any of the products or services of, or
                            available through, the website on which you place a
                            link to our Site;
                        </li>
                        <li>
                            11.9.3 displays any of the trade marks or logos used
                            on our Site without our permission or that of the
                            owner of such trade marks or logos; or
                        </li>
                        <li>
                            11.9.4 is placed on a website that itself breaches
                            this policy.
                        </li>
                    </ul>

                    <p>
                        11.9.5. We reserve the right to require you to
                        immediately remove any link to the Site at any time, and
                        you shall immediately comply with any request by us to
                        remove any such link or we shall be obliged to disable
                        any link or any social media features.
                    </p>

                    <p>11.10. Change of username or password</p>

                    <p>
                        11.10. We may require you to change your username or
                        password or any other information which permits you
                        access to purchase subscription from the site.
                    </p>

                    <p>11.11. Withdrawal of subscription option</p>

                    <p>
                        11.11. We have the right to withdraw any subscription
                        option from the site for any reason without notice to
                        you and you agree that we will not be responsible for
                        any loss, damage, or cost as a result of such
                        unavailability.
                    </p>

                    <p>11.12. Liability for errors or omissions</p>

                    <p>
                        11.12. We will not be liable for errors or omissions on
                        the site nor for loss or damage suffered by you as a
                        result of any unavailability of the site or by any use
                        by you or reliance placed on the site or its contents
                        including any damage caused to your computer or
                        otherwise howsoever, or any direct, indirect or
                        consequential loss or loss of data.
                    </p>

                    <p>
                        11.13. Failure of equipment, data processing system, or
                        transmission link
                    </p>

                    <p>
                        11.13. We shall not be liable to you for the failure of
                        any equipment, data processing system or transmission
                        link and will not be liable to you as a result of any
                        down-time which may occur upon the site.
                    </p>

                    <p>11.14. Dispute resolution</p>

                    <p>
                        11.14. We will try to resolve any disputes with you
                        quickly and efficiently.
                    </p>

                    <p>11.15. Contact us for concerns</p>

                    <p>11.15. If you are unhappy with:</p>

                    <ul>
                        <li>11.15.1. the subscription;</li>
                        <li>11.15.2. our service to you; or</li>
                        <li>11.15.3. any other matter,</li>
                    </ul>

                    <p>
                        please contact us as soon as possible at{" "}
                        <a href="mailto:support@spennypiggy.co">
                            support@spennypiggy.co
                        </a>
                    </p>

                    <p>11.16. Dispute resolution procedure</p>

                    <p>
                        11.16. If you and we cannot resolve a dispute using our
                        internal complaint handling procedure, we will:
                    </p>

                    <ul>
                        <li>
                            11.16.1. let you know that we cannot settle the
                            dispute with you; and
                        </li>
                        <li>
                            11.16.2. give you certain information required by
                            law about our alternative dispute resolution
                            provider.
                        </li>
                    </ul>

                    <h2>12. Enforcement of Terms</h2>

                    <p>
                        12. No one other than a party to this agreement has any
                        right to enforce any term of this agreement.
                    </p>

                    <h2>13. Time Limit for Claims</h2>

                    <p>
                        13. Except where prohibited by applicable law, any claim
                        or cause of action (including those arising out of or
                        related to this agreement) must be filed within twelve
                        months after the date on which the claim or cause of
                        action arose, or the date you learned of the facts
                        giving rise to the cause of action (whichever is the
                        earlier), or be forever barred.
                    </p>

                    <h2>14. Jurisdiction for Court Proceedings</h2>

                    <p>
                        14. If you want to take court proceedings, the courts of
                        England will have exclusive jurisdiction in relation to
                        this agreement.
                    </p>

                    <h2>15. Applicable Laws</h2>

                    <p>
                        15. The laws of England and Wales will apply to this
                        agreement.
                    </p>
                </div>
            </div>
        </Guest>
    );
}

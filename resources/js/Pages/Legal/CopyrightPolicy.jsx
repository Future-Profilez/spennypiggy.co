import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function CopyrightPolicy(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Copyright Policy" />
            <LegalLayout activePage="CopyrightPolicy">
                <div className="mx-auto w-full max-w-[92ch] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
                    <h1 className="text-2xl md:text-4xl font-black text-[#FF007F] mb-10 uppercase tracking-tight">
                        Copyright & Intellectual Property Policy
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <p className="mb-5 text-gray-700 leading-relaxed italic">Last Updated: May 2026</p>
                        
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Spenny Piggy respects the intellectual property rights of others and expects all users, creators, and supporters to do the same.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            This Copyright & Intellectual Property Policy explains how we handle copyrighted content, trademark complaints, and reports of intellectual property infringement across the platform.
                        </p>

                        <h2 id="sec-1-creator-responsibility" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">1. Creator Responsibility</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Creators are solely responsible for the content, products, digital downloads, media, artwork, PDFs, memberships, messages, and other materials they upload, sell, share, or distribute through Spenny Piggy.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            By uploading or selling content on Spenny Piggy, creators confirm that:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>they own the content; or</li>
                            <li>they have obtained all necessary rights, licences, permissions, and authorisations required to use, distribute, sell, or monetise the content.</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Creators must not upload, distribute, sell, or share content that infringes the intellectual property rights of any third party.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            This includes, but is not limited to:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>copyrighted media;</li>
                            <li>pirated digital products;</li>
                            <li>leaked subscription content;</li>
                            <li>copied artwork;</li>
                            <li>stolen photographs;</li>
                            <li>unauthorised PDFs or eBooks;</li>
                            <li>movies, TV shows, music, or games;</li>
                            <li>copyrighted templates or courses;</li>
                            <li>trademarked branding or logos used without permission.</li>
                        </ul>

                        <h2 id="sec-2-prohibited-infringing-content" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">2. Prohibited Infringing Content</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            The following content is prohibited on Spenny Piggy:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>content that infringes copyright, trademark, patent, or other intellectual property rights;</li>
                            <li>leaked or stolen creator content;</li>
                            <li>pirated digital goods;</li>
                            <li>unauthorised reproductions or redistributions;</li>
                            <li>impersonation of brands or creators;</li>
                            <li>counterfeit products or misleading branded materials.</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Spenny Piggy reserves the right to remove any content that we reasonably believe may infringe intellectual property rights or violate this policy.
                        </p>

                        <h2 id="sec-3-reporting-copyright-infringement" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">3. Reporting Copyright Infringement</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            If you believe content hosted on Spenny Piggy infringes your copyright or intellectual property rights, you may submit a report to us.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Your report should include:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>your full name and contact information;</li>
                            <li>identification of the copyrighted work;</li>
                            <li>identification of the allegedly infringing content;</li>
                            <li>the URL or location of the content on Spenny Piggy;</li>
                            <li>a statement confirming you believe the use is unauthorised;</li>
                            <li>a statement confirming the information provided is accurate and made in good faith.</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Reports can be submitted to:
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed font-bold">
                            support@spennypiggy.co or via live chat or via the report content button on each creators profile.
                        </p>

                        <h2 id="sec-4-takedown-procedure" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">4. Takedown Procedure</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Upon receiving a valid infringement report, Spenny Piggy may:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>temporarily remove or disable access to the content;</li>
                            <li>request additional information from the reporting party or creator;</li>
                            <li>suspend payouts connected to disputed content;</li>
                            <li>issue warnings or strikes against creator accounts;</li>
                            <li>permanently remove repeat infringers from the platform.</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Spenny Piggy may act without prior notice where we believe immediate removal is appropriate.
                        </p>

                        <h2 id="sec-5-counter-notices" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">5. Counter-Notices</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            If a creator believes content was removed in error or that they have the legal right to use the content, they may submit a counter-notice.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Spenny Piggy may restore content where appropriate following review of the counter-notice and any supporting evidence.
                        </p>

                        <h2 id="sec-6-repeat-infringer-policy" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">6. Repeat Infringer Policy</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Creators who repeatedly upload infringing or unauthorised content may have:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>content removed;</li>
                            <li>accounts suspended;</li>
                            <li>payouts delayed or withheld pending review;</li>
                            <li>platform access permanently terminated.</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Spenny Piggy reserves the right to determine what constitutes repeat infringement or high-risk behaviour.
                        </p>

                        <h2 id="sec-7-platform-discretion" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">7. Platform Discretion</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Spenny Piggy is a user-generated content platform and does not pre-screen or verify ownership of all uploaded content.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            However, we reserve the right to:
                        </p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>review uploaded content;</li>
                            <li>investigate complaints;</li>
                            <li>remove suspicious material;</li>
                            <li>restrict accounts or transactions;</li>
                            <li>cooperate with rights holders, payment providers, and legal authorities where necessary.</li>
                        </ul>

                        <h2 id="sec-8-trademarks" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">8. Trademarks</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Unauthorised use of third-party trademarks, logos, brand identities, or misleading branding is prohibited.
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Creators must not falsely imply affiliation, sponsorship, endorsement, or partnership with any third party.
                        </p>

                        <h2 id="sec-9-contact" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">9. Contact</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            For copyright or intellectual property concerns, please contact:
                        </p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Social Vortex Limited <br />
                            <a href="mailto:jack@socialvortex.io" className="text-[#FF007F] underline">jack@socialvortex.io</a><br />
                            55 Colmore Row, Birmingham, B3 2AA, UK 🇬🇧
                        </p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function UsAddendum(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="US Addendum" />
            <LegalLayout activePage="UsAddendum">
                <div className="mx-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-8 uppercase tracking-tighter">
                        US Addendum
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <p className="mb-4 text-gray-700 leading-relaxed italic">Issue Date: 23 April 2026</p>
                        
                        <p className="mb-6 text-gray-700 leading-relaxed">
                            This US Addendum applies to all Users (Creators and Supporters) resident in the United States of America. It forms part of the Platform Legal Framework and supplements the Terms of Service.
                        </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">1. US Contracting Entity</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            For Users resident in the United States, your contract is with Social Vortex, Inc., a Delaware corporation, which acts as the US operational entity for Spenny Piggy.
                        </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">2. Arbitration Agreement (US Users Only)</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed italic">
                            PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
                        </p>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            2.1 Any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof, including the determination of the scope or applicability of this agreement to arbitrate, shall be determined by arbitration in the State of Delaware before one arbitrator.
                        </p>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            2.2 The arbitration shall be administered by JAMS pursuant to its Comprehensive Arbitration Rules and Procedures. Judgment on the Award may be entered in any court having jurisdiction. This clause shall not preclude parties from seeking provisional remedies in aid of arbitration from a court of appropriate jurisdiction.
                        </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">3. Class Action Waiver</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            YOU AND SPENNY PIGGY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                        </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">4. Tax Compliance (IRS Reporting)</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            4.1 Creators resident in the US acknowledge that Spenny Piggy (via its payment processors) may be required by the Internal Revenue Service (IRS) to report gross earnings on Form 1099-K.
                        </p>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            4.2 You must provide accurate W-9 information when requested. Failure to provide such information may result in the withholding of payouts or the suspension of your account.
                        </p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">5. State-Specific Disclosures</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            Certain US states may have specific consumer protection requirements. Spenny Piggy complies with applicable state laws, and additional disclosures may be provided to you based on your registered location.
                        </p>

                        <p className="mt-12 text-sm text-gray-500">This document forms part of the Spenny Piggy Platform Legal Framework.</p>
                        <p className="text-sm text-gray-500">© 2026 Social Vortex Limited / Social Vortex, Inc. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}

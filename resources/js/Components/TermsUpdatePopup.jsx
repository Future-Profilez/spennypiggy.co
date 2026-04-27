import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import axios from "axios";

export default function TermsUpdatePopup() {
    const { auth, last_terms_update, updated_terms_list } = usePage().props;
    const [show, setShow] = useState(false);
    
    const legalDocs = [
        { key: 'TermsOfService', name: 'Terms of Service', href: '/terms-and-conditions' },
        { key: 'CreatorAgreement', name: 'Creator Agreement', href: '/creator-agreement' },
        { key: 'SupporterTerms', name: 'Supporter Terms', href: '/supporter-terms' },
        { key: 'CreatorSupporterContract', name: 'Creator-Supporter Contract', href: '/creator-supporter-contract' },
        { key: 'MorAgreement', name: 'MoR Agreement', href: '/mor-agreement' },
        { key: 'PaymentsPolicy', name: 'Payments Policy', href: '/reserves-and-payments-policy' },
        { key: 'PaidTasksTerms', name: 'Paid Tasks Terms', href: '/paid-tasks-terms' },
        { key: 'ReturnPolicy', name: 'Return Policy', href: '/return-policy' },
        { key: 'UsAddendum', name: 'US Addendum', href: '/us-addendum' },
    ];

    // Default to showing Terms of Service if no specific docs are selected but an update is triggered
    const activeTermsList = (updated_terms_list && updated_terms_list.length > 0) 
        ? updated_terms_list 
        : ['TermsOfService'];

    const displayDocs = legalDocs.filter(doc => activeTermsList.includes(doc.key));

    useEffect(() => {
        if (auth?.user) {
            const acceptedAt = auth.user.terms_accepted_at;
            const createdAt = auth.user.created_at;
            const updateDate = new Date(last_terms_update);

            if (createdAt) {
                const userCreated = new Date(createdAt).getTime();
                const systemUpdate = updateDate.getTime();

                if (userCreated < systemUpdate) {
                    if (!acceptedAt || new Date(acceptedAt).getTime() < systemUpdate) {
                        setShow(true);
                    }
                }
            }
        }
    }, [auth?.user, last_terms_update]);

    const handleAccept = () => {
        axios.post(route("accept-terms")).then(() => {
            setShow(false);
        });
    };

    if (!show || displayDocs.length === 0) return null;

    return (
        <Modal show={show} onClose={() => {}} closeable={false}>
            <div className="p-8">
                <h2 className="text-2xl font-black text-pink-600 mb-4 uppercase">Terms Updated</h2>
                <p className="text-gray-700 mb-6">
                    We have updated some of our legal policies to better protect our community. 
                    Please review the updated documents below before continuing to use Spenny Piggy.
                </p>
                
                <div className="space-y-3 mb-8">
                    {displayDocs.map((doc) => (
                        <a 
                            key={doc.key}
                            href={doc.href} 
                            target="_blank" 
                            className="block text-pink-600 hover:text-pink-700 font-semibold"
                        >
                            Read {doc.name} →
                        </a>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleAccept}
                        className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        I Accept the Updated Terms
                    </button>
                </div>
            </div>
        </Modal>
    );
}

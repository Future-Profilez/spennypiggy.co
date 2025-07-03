import { useRef, useState } from 'react';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';

export default function DeleteStripeAccount({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        get,
        processing,
        reset,
        errors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };
    // acct_1OMSLC4MdUYr5UAt
    const deleteUser = (e) => {
        e.preventDefault();
        get(route('deleteStripeAccount'), {
            // preserveScroll: true,
            // onSuccess: () => closeModal(),
            // onError: () => passwordInput.current.focus(),
            // onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>


            {confirmingUserDeletion ? <>
            <form onSubmit={deleteUser} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    Confirm Account Deletion
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                   Please enter your password to confirm you would like to permanently delete your account.
                </p>

                <div className="mt-6">
                    <InputLabel htmlFor="password" value="Password" className="sr-only" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="mt-1 block w-full"
                        isFocused
                        placeholder="Password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-center">
                    <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                    <DangerButton className="ml-3" disabled={processing}>
                        Delete
                    </DangerButton>
                </div>
            </form>
            </>
            :
             <>
             <header>
                 <h2 className="text-lg font-medium text-gray-900">Delete Stripe Account</h2>
                 <p className="mt-1 text-sm text-gray-600">Are you sure you want to delete your Stripe account? This action cannot be undone. Deleting your account will result in the permanent removal of your account data, settings, and all associated transactions.

                 </p>
             </header>
             <DangerButton onClick={confirmUserDeletion}>Delete Account</DangerButton>
             </>
             }
        </section>
    );
}

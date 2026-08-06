import Authenticated from "@/Layouts/AuthenticatedLayout";
import ActivateCard from "./ActivateCard";

/**
 * The standalone page for the £500 card-verification gate. `ActivateCard` owns every
 * state and renders nothing once the account is approved.
 *
 * ⚠️ It previously carried a full copy of the checkout handler — `handlePaymentRedirect`
 * plus `loading`, `successAlert`, `errorAlert`, `user` and a `LoaderButton` import —
 * none of which was ever called or rendered. Two implementations of the same redirect,
 * one of them dead, is how the live one gets fixed and the dead one does not.
 */
export default function GifterCardVerification() {
    return (
        <Authenticated>
            {/* ⚠️ `dvh`, never `vh`. This was `!h-[80vh]` with vertically centred
                content — a fixed height that ignores mobile browser chrome, and one
                that clipped the card outright once it grew an address form. Padding
                and a minimum height let it grow instead. `pb-28` clears the fixed
                bottom navigation. */}
            <div className="min-h-[70dvh] bg-[#A2E4B8] px-4 py-8 pb-28 md:py-14">
                <div className="mx-auto w-full max-w-[640px]">
                    <ActivateCard />
                </div>
            </div>
        </Authenticated>
    );
}

import Authenticated from "@/Layouts/AuthenticatedLayout";
import noresultimg from '../../assets/img/noresultimg.png';

/*
 * A profile that has been withdrawn, shown to a VISITOR only.
 *
 * 🚨 IT DOES NOT SAY WHY, AND MUST NOT. It used to be headed "Account Suspended"
 * and explain the reason — so any gifter who still had the link was told the
 * creator's account state. That is the creator's business, and it is the same
 * rule `CreatorAvailabilityMessageService` follows at checkout: a supporter who
 * cannot buy is told the page is paused, never what the platform decided about
 * the person selling.
 *
 * ⚠️ THE OWNER NEVER SEES THIS PAGE. `AuthenticatedSessionController` exempts
 * them, so they get their own dashboard with `SuspendedBanner` on it — which is
 * where the reason and the support route live. The old copy said "if you are the
 * owner of this account, contact support" precisely because they landed here,
 * and that is no longer true.
 *
 * ⚠️ Served with HTTP 410 by the controller. Do not "fix" it to render 200.
 */
export default function WithdrawnProfile({ auth, user }) {
    return (
        <Authenticated auth={auth} user={user}>
            <div className="blackbg py-18">
                <div className="min-h-[80dvh] flex justify-center items-center">
                    <div className="flex justify-center">
                        <div className="max-w-[400px] p-6">
                            <div className="noresultimg mb-5 m-auto">
                                <img alt="" src={noresultimg} />
                            </div>
                            <h2 className="font-gulfs text-3xl uppercase text-white w-full text-center sshadow-yellow">
                                Page not available
                            </h2>
                            <p className="text-gray-300 mt-2 text-center">
                                This page isn&rsquo;t available right now. Have a look
                                at the other creators on Spenny Piggy in the meantime.
                            </p>
                            <div className="flex justify-center mt-4">
                                <a
                                    href={route("discover")}
                                    className="text-pink inline-flex min-h-[44px] items-center cursor-pointer transition-opacity duration-200 hover:opacity-70"
                                >
                                    Discover creators
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}

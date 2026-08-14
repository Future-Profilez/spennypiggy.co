import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import AddIntro from "../intros/AddIntro";
import EditProfile from "../account/EditProfile";
import AddPost from "../feed/AddPost";
import { checkedItem } from "@/includes/Icons";
import AddBills from "../bills/AddBills";
import AddMembership from "../membership/AddMembership";
import TFA from "../Auth/TFA";

const TOTAL_STEPS = 9;

const CustomProgressBar = ({ now, max }) => {
    const percentage = Math.round((now / max) * 100);
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
        <div className="bg-pink-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
    );
};

/**
 * One checklist row.
 *
 * ⚠️ Stacks on a phone. Every row used to be `flex items-center justify-between`
 * with no mobile form, so at 390px the title block and its action squeezed each
 * other: the copy wrapped to four lines and the control was crushed against the
 * right edge. The action is full-width below the text until `sm`, which also
 * gives it a real thumb target — these were bare text links.
 */
function StepRow({ done, title, body, children }) {
    return (
        <div className="profile-steps mt-3 flex flex-col gap-3 rounded-box border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="step-title flex min-w-0 flex-1">
                <div className={`check-icon mr-2 shrink-0 pt-1 ${done ? "checked" : ""}`}>
                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                </div>
                <div className="min-w-0">
                    <h2 className="font-bold text-gray-900">{title}</h2>
                    <p className="text-[14px] text-black/60">{body}</p>
                </div>
            </div>
            <div className="w-full shrink-0 sm:w-auto">{children}</div>
        </div>
    );
}

/**
 * The plain-link steps (auto tweets, VAT, shop) had no styling at all — they
 * rendered as bare inline text, so they were both invisible as controls and
 * far under the 44px touch target the rest of the app holds to.
 */
const STEP_LINK =
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-box-sm border-2 border-black bg-white px-5 text-center text-sm font-bold text-black transition-colors hover:bg-[#FF007F] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 sm:w-auto";

export default function ProfileSteps({ IsloggedIn,  sLinks }) {

    const {  user, global_currency, profile_steps } = usePage().props;
    const [profile, setProfile] = useState(profile_steps || null);

    const updateProfileSteps = ()=> {
        window.location.reload(false)
    }

    if (!profile || profile.total >= TOTAL_STEPS) return null;

    return (
        <>
            <style>{`
                .check-icon.checked svg path {fill: #139700 !important;}
            `}</style>

            {/* ⚠️ `sticky top-0` pinned this card to the top of the VIEWPORT, and
                the app header is fixed at ~75px — so on a phone the checklist
                scrolled up and parked underneath it. Sticky is kept only from
                `lg`, at the same offset the profile's own aside uses. */}
            <div className="profileSteps mb-4 rounded-box border border-gray-400 bg-white p-3 lg:!p-6 lg:sticky lg:top-[111px] lg:z-10">
                <h2 className="mb-1 text-[20px] font-bold">Let’s get you started</h2>
                <p className="mb-3 text-black/60">Successful creators complete these steps, although not all required.</p>
                <CustomProgressBar now={profile.total} max={TOTAL_STEPS} />

                {profile.intro !== 1 && (
                    <StepRow
                        done={profile.intro == 1}
                        title="Add Intro Video"
                        body="Add a 15 - 30 sec intro video for your supporters."
                    >
                        <AddIntro classes="pt-3" text="Add" uuid={user?.id || null} IsloggedIn={IsloggedIn} />
                    </StepRow>
                )}

                {profile.auto_tweets !== 1 && (
                    <StepRow
                        done={profile.auto_tweets == 1}
                        title="Enable Auto Tweets"
                        body="Automatically tweet to your supporters when a wish is granted."
                    >
                        {/* ⚠️ This href was `/account?page=autotweet whitespace-nowrap`
                            — a className had been pasted inside the URL string, so the
                            link resolved to a path containing a space and went nowhere. */}
                        <Link href="/account?page=autotweet" className={STEP_LINK}>Enable</Link>
                    </StepRow>
                )}

                {profile.basic_profile !== 1 && (
                    <StepRow
                        done={profile.basic_profile == 1}
                        title="Complete Basic Profile"
                        body="Add a profile picture and bio."
                    >
                        <EditProfile
                            updateProfileSteps={updateProfileSteps}
                            user={user}
                            classes="updatebtn "
                            global_currency={global_currency}
                        />
                    </StepRow>
                )}

                {profile.post_required !== 1 && (
                    <StepRow
                        done={profile.post_required == 1}
                        title="Write a Post"
                        body="Add something for your subscribers and supporters."
                    >
                        <AddPost text="Add Post" classes="editpoststep" />
                    </StepRow>
                )}

                {profile.membership_required !== 1 && (
                    <StepRow
                        done={profile.membership_required == 1}
                        title="Add Memberships"
                        body="Add at least one membership option for your fans."
                    >
                        <AddMembership text="Add" classes="edit_membership_step" />
                    </StepRow>
                )}

                {profile.bill_required !== 1 && (
                    <StepRow
                        done={profile.bill_required == 1}
                        title="Add Your Bills"
                        body="Add at least one billing option for your fans."
                    >
                        <AddBills text="Add Bill" classes="edit_bill_step" />
                    </StepRow>
                )}

                {profile.vat_setting !== 1 && (
                    <StepRow
                        done={profile.vat_setting == 1}
                        title="VAT settings"
                        body="Add vat percentage."
                    >
                        <Link href="/account" className={STEP_LINK}>Add VAT</Link>
                    </StepRow>
                )}

                {profile.is_2fa !== 1 && (
                    <StepRow
                        done={profile.is_2fa == 1}
                        title="Enable 2FA"
                        body="Enable 2FA for your account security."
                    >
                        <TFA text={<div className="text-center">Enable</div>} />
                    </StepRow>
                )}

                {profile.shop !== 1 && (
                    <StepRow
                        done={profile.shop == 1}
                        title="Shop Items"
                        body="Add digital content to sell to your supporters."
                    >
                        <Link href="/shop" className={STEP_LINK}>Add Digital Goods</Link>
                    </StepRow>
                )}
            </div>
        </>
    );
}

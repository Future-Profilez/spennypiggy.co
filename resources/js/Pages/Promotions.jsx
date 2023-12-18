import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
 
export default function Promotions(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth.user} user={user}>
            <Head title={'Promotions Terms'} />
            <div className="wishlistPage blackbg pt-8 pb-14 ">
                <div className="containerbox static-page p-3">
                <h1>110% First Month Payment Campaign</h1>
                <p>
                  Spenny Piggy is running a campaign to encourage creators to sign up and
                  receive a 10% payment bonus after 30 days on the platform based on each
                  individual creator’s earnings. Running from December 10th to January 30th,
                  2024. Only creators who sign up during this time frame will be eligible.
                </p>
                <p>
                  Subject to these terms and conditions, creators who sign up from December
                  10th, 2023, to January 30th, 2024 will be eligible for an additional 10% payment.
                  Paid automatically or upon request from the creator after 30 days have
                  elapsed.
                </p>
                <p>
                  This campaign is STRICTLY LIMITED to the above dates and to qualify for
                  this, creators must have been using the application for a minimum of 30 days.
                </p>
                <ul>
                  <li>Sign up to Spenny Piggy as a creator.</li>
                  <li>Show a complete profile.</li>
                  <li>
                    Complete the above entry requirements by midnight on 30th January 2024
                    (the ‘Campaign End Date').
                  </li>
                  <li>Not be in breach of the acceptable use policy or the platform terms.</li>
                </ul>
                <p>
                  Your credit payment will be paid either automatically or after informing
                  Spenny Piggy that your payment is now due. Payment will be confirmed via
                  email and sent directly to the creator's Stripe Balance.
                </p>
                <p>
                  For the avoidance of doubt. Each creator is only eligible for a one-off credit
                  payment as per clauses 1, 2, 3, and 4.
                </p>
                <p>Spenny Piggy reserves the right to remove or change this campaign at any time.</p>
                <p>
                  This campaign is in no way sponsored, endorsed, administered by, or
                  associated with any third party or any associated social media platforms or presence.
                </p>
                <p>Promoter: Social Vortex Limited, ‘DBA’ Spenny Piggy, 55 Colmore Row, Birmingham, B3 2AA.</p>
                </div>
            </div>
        </Guest>
    );
}

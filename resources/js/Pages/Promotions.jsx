import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";

export default function Promotions(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth.user} user={user}>
            <Head title={'Promotions Terms'}  />
            <div className="wishlistPage blackbg pt-8 pb-14 ">
                <div className="containerbox static-page p-3">
                <h1>£1000 Giveaway Campaign</h1>
                <p>
                Spenny Piggy is running a campaign to build brand awareness for anyone to win a
                £1,000 gift. Running from Tuesday 26th November to December 31 st 2024. Only
                users that meet all the eligibility criteria during this time frame will be eligible.
                </p>
                <p>
                Subject to these terms and conditions, any user with an Instagram or X account who
                share, like, follow and tag two creators from Tuesday 26th November to December
                31 st 2024 will be entered into a draw to win the £1,000 gift. Paid 30 days after the
                winner has been selected at random.
                </p>

                <p>
                This campaign is STRICTLY LIMITED to the above dates and to qualify for this,
                users must on either Instagram or X:
                </p>
                <ul>
                  <li>Follow Spenny Piggy</li>
                  <li>- Share the post (which must remain for 30 days after the campaign has ended)</li>
                  <li>- Like the post</li>
                  <li>- Tag two creators</li>
                </ul>
                <p>
                Your £1,000 will be paid to the winner via bank transfer only. Payment will be
                confirmed via email and sent directly to the users chosen bank account.
                </p>

                <p>For the avoidance of doubt. Spenny Piggy is not responsible for any bank charges or
                conversion costs and there is only a single winner.
                </p>
                <p>Spenny Piggy reserves the right to remove or change this campaign at any time.</p>
                <p>This campaign is in no way sponsored, endorsed, administered by, or associated
                with any third party or any associated social media platforms or presence.
                </p>
                <p>Promoter: Social Vortex Limited, ‘DBA’ Spenny Piggy, 55 Colmore Row, Birmingham,
                B3 2AA.</p>
                </div>
            </div>
        </Guest>
    );
}

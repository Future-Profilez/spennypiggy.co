import MembershipItem from "@/Components/MembershipItem";

export default function Membership({ item, IsloggedIn, hidebtn }) {
    return (
        <MembershipItem
            item={item}
            IsloggedIn={IsloggedIn}
            showAllBenefits={Boolean(hidebtn)}
        />
    );
}

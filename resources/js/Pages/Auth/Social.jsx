import Popup from "@/Components/Popup";


export default function Social() {

    return <>
        <Popup action={close}
            classes='' text={<><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.7143 13.7857H3V11.2143H10.7143V3.5H13.2857V11.2143H21V13.7857H13.2857V21.5H10.7143V13.7857Z" fill="#5D25FD" />
            </svg> Add Socials</>} >
        </Popup>
    </>
}

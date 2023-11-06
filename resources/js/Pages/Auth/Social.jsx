import Popup from "@/Components/Popup";
import { useForm } from "@inertiajs/react";


export default function Social() {



    const { data, setData, post, processing, errors, reset } = useForm({
        twitter: '',
        whoyouinto: '',
        reddit: '',
        instagram: '',
        discord: '',
        onlyfans: '',
        loyalfans: '',
        fansly: '',
        manyvids: '',
        other: '',
    });


    const createSocial = (e) => {

        e.preventDefault();
        post(route('save_wish_item'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                reset();
                successAlert(resp.props.flash?.success || "Added");
                setClose(false);
                setClear(new Date);
                setTimeout(() => {
                    setClose();
                }, 100)
            },
            onError: (_err) => {
                console.log(`errors:`);
                console.log(_err);
                errorsHandling(_err);
                errorAlert(resp.props.flash?.success || "Added");
            }
        });
    };



    return <>
        <Popup action={close}
            classes='' text="Add Socials" >

            <div className="wishlistModal">
                <div className="widhlistModalInner shadow-pink">
                    <h2 className="font-GillSans">Add Social Links</h2>

                    <div className="wishinfo">
                        <h3>Social Links</h3>
                        <form onSubmit={createSocial}>
                            <ul>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Whoyouinto</label>
                                    <input id="whoyouinto"
                                        name="whoyouinto"
                                        type="text"
                                        value={data.whoyouinto}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('whoyouinto', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Twitter</label>
                                    <input id="twitter"
                                        name="twitter"
                                        type="text"
                                        value={data.twitter}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('twitter', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Instagram </label>
                                    <input id="instagram"
                                        type="text"
                                        name="instagram"
                                        value={data.instagram}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('instagram', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Reddit</label>
                                    <input id="reddit"
                                        name="reddit"
                                        type="text"
                                        value={data.reddit}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('reddit', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Discord</label>
                                    <input id="discord"
                                        name="discord"
                                        type="text"
                                        value={data.discord}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('discord', e.target.value)}
                                    />
                                </li>

                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">OnlyFans</label>
                                    <input id="onlyfans"
                                        name="onlyfans"
                                        type="text"
                                        value={data.onlyfans}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('onlyfans', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">LoyalFans</label>
                                    <input id="loyalfans"
                                        name="loyalfans"
                                        type="text"
                                        value={data.loyalfans}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('loyalfans', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Fansly</label>
                                    <input id="fansly"
                                        name="fansly"
                                        type="text"
                                        value={data.fansly}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('fansly', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">ManyVids</label>
                                    <input id="manyvids"
                                        name="manyvids"
                                        type="text"
                                        value={data.manyvids}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('manyvids', e.target.value)}
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">Other</label>
                                    <input id="other"
                                        name="other"
                                        type="text"
                                        value={data.other}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        onChange={(e) => setData('other', e.target.value)}
                                    />
                                </li>
                            </ul>


                        </form>
                    </div>
                </div>
            </div>

        </Popup>
    </>
}

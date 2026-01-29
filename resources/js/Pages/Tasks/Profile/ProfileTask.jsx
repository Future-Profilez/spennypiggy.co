import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import { Link, useForm, usePage } from "@inertiajs/react";

export default function ProfileTask({ task, IsloggedIn }) {
    const { auth } = usePage().props;
    const { formatMultiPrice } = PriceFormat();
    const { post, processing } = useForm();
    const url = `/task/${task.uuid}`;

     const handlePurchase = () => {
        post(route('task.purchase', task.uuid));
    };

     const handlePurchaseClick = (e) => {
        e.preventDefault();
        handlePurchase();
    };

    return (
        <li className="bg-white rounded-[25px] mb-3 p-4 hover:bg-gray-100 transition-colors border-b-2 border-gray-100 last:border-0">
                <div className="md:flex justify-between items-center hover:!text-pink-500">
                    <div className="">
                        <Link href={url} className="text-xl font-[500] text-gray-900 line-clamp-1 font-anton tracking-wide">
                            {task.title}
                        </Link>
                        <p className="text-sm text-gray-600 my-1 line-clamp-2">
                            {task.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>{task.status}
                            </span>
                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-blue-100 text-blue-800 !border-blue-200">
                                {task.type} Delivery
                            </span>
                            {task?.sla_hours ? 
                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-yellow-100 text-yellow-800 !border-yellow-200">
                                    {task.sla_hours} Hours
                                </span>
                            : ''}
                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-pink-100 text-pink-800 !border-pink-200">
                                {task.category || 'Paid Task'}
                            </span>
                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-gray-200 text-gray-800 !border-gray-400">
                                Created: {new Date(task.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-start ps-0 md:!ps-6">
                        <div className="mt-4 md:mt-0  min-w-[100px] gap-4 flex flex-wrap md:!flex-nowrap items-center">
                            <p className="text-xl sm:text-2xl font-black text-pink-500 font-anton">
                                {formatMultiPrice(task.price, task.currency || 'USD')}
                            </p> 
                            {!IsloggedIn ? 
                                <div className="">
                                    <Link href={`/task/${task.uuid}`} className="whitespace-nowrap text-sm sm:text-normal inline-block px-6 py-2 bg-pink-500 text-white font-bold rounded-full shadow-md hover:bg-pink-600 transition-colors">
                                        <>{task.type === 'instant' ? 'Pay to Access 🔓' : 'Pay to Assign 📝'} </> 
                                    </Link> 
                                </div>
                            : ''}
                        </div> 
                    </div>
                </div>
                {task.is_approved  !== 1 ?
                    <p className="!pt-3 block text-red-500 font-bold">Unapproved : {task.is_approved_reason || 'Item is currently under review. Please check again after 30 minutes.'}</p> 
                : ''}
        </li>
    );
}

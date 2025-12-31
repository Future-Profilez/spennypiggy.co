import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";

export default function ProfileTask({ task, IsloggedIn }) {
    const { auth } = usePage().props;
    const { formatMultiPrice } = PriceFormat();

    const url = `/task/${task.uuid}`;

    return (
        <li className="p-6 hover:bg-gray-50 transition-colors border-b-2 border-gray-100 last:border-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 text-left">
                    <h3 className="text-xl font-bold text-gray-900 font-anton tracking-wide">
                        <Link href={url} className="hover:underline decoration-pink-500 decoration-2">
                            {task.title}
                        </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                            {task.status}
                        </span>
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                            {task.type} Delivery
                        </span>
                    </div>
                </div>
                <div className="text-right min-w-[100px]">
                    <p className="text-2xl font-black text-pink-500 font-anton">
                        {formatMultiPrice(task.price, "GBP")}
                    </p>
                </div>
            </div>
        </li>
    );
}

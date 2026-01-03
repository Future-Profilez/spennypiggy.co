import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import { useState, useEffect } from 'react';
import PriceFormat from "@/includes/PriceFormat";
import Nocontent from '../../includes/Nocontent';

const Countdown = ({ createdAt, hours }) => {
    if (!hours) return null;

    const targetDate = new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000);

    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        
        if (difference <= 0) {
            return null;
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [createdAt, hours]);

    if (!timeLeft) {
        return <span className="text-red-600 font-bold text-xs uppercase tracking-wider">Overdue</span>;
    }

    return (
        <span className="font-mono font-bold text-pink-600 text-sm">
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
    );
};

export default function Index({ auth, tasks, orders, completed_orders, purchased_tasks }) {
    const { formatMultiPrice } = PriceFormat();

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title="My Tasks" />
            <div className="px-3 py-5 min-h-screen !bg-white">
                    <h2 className="text-4xl font-fre uppercase mb-8 text-center text-pink-500">Task Dashboard</h2>
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Active Orders Section */}
                        {orders && orders.length > 0 &&
                            <div className="shadow-layout  !border-3 border-black bg-white shadow-black overflow-hidden rounded-xl">
                                <div className='py-3 px-4 pinkbg flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between'>
                                    <h3 className="font-bold text-xl text-white">Active Orders (Action Required)</h3>
                                    <div className="flex items-center">
                                        <span className=' border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block'></span>
                                        <span className=' border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block'></span>
                                        <span className=' border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block'></span>
                                    </div>
                                </div>
                                
                                <ul className="divide-y divide-gray-200">
                                    {orders?.length > 0 ?
                                        <>
                                            {orders && orders.map(order => (
                                                <li key={order.id} className="p-6 hover:bg-red-50 transition-colors">
                                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                        <div>
                                                            <h3 className="text-xl font-[500] text-gray-900 font-anton tracking-wide">Order #{order.uuid.substring(0, 8)} - {order.task.title}</h3>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                Supporter: <span className="font-semibold">{order.supporter?.name || 'Guest'}</span> | 
                                                                Ordered: {new Date(order.created_at).toLocaleDateString()}
                                                                {order.task.sla_hours && (
                                                                    <> | Remaining: <Countdown createdAt={order.created_at} hours={order.task.sla_hours} /></>
                                                                )}
                                                            </p>
                                                            <div className="mt-2">
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border border-red-200 bg-red-100 text-red-800">
                                                                    {order.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Link 
                                                                href={route('task.order', order.uuid)} 
                                                                className="button p !text-sm sm" >
                                                                Manage Order
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </>
                                        :
                                        <Nocontent text="No active orders found." />
                                    }
                                </ul>
                            </div> }
                    
                        {/* Purchased Tasks */}
                        {purchased_tasks && purchased_tasks.length > 0 && (
                            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,9)] rounded-[23px] overflow-hidden">
                                <div className='p-4 bg-blue-100 flex !border-b-2 !border-black items-center justify-between'>
                                    <h3 className="font-bold text-xl uppercase tracking-tight">Tasks I've Purchased</h3>
                                    <div className="flex items-center gap-2">
                                        <span className='border-2 border-black bg-red-500 w-4 h-4 rounded-full block'></span>
                                        <span className='border-2 border-black bg-yellow-400 w-4 h-4 rounded-full block'></span>
                                        <span className='border-2 border-black bg-green-400 w-4 h-4 rounded-full block'></span>
                                    </div>
                                </div>

                                <ul className="divide-y-2 divide-black">
                                    {purchased_tasks.map(purchase => (
                                        <li key={purchase.id} className="p-6 hover:bg-blue-50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 font-anton tracking-wide">
                                                        <Link href={route('task.order', purchase.uuid)} className="hover:underline">
                                                            {purchase.task.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Creator: <span className="font-semibold">{purchase.task.creator?.name || 'Unknown'}</span> | 
                                                        Purchased: {new Date(purchase.created_at).toLocaleDateString()}
                                                        {['paid', 'assigned', 'pending_review', 'rejected_once', 'escalated', 'initiated'].includes(purchase.status) && purchase.task.sla_hours && (
                                                            <> | Remaining: <Countdown createdAt={purchase.created_at} hours={purchase.task.sla_hours} /></>
                                                        )}
                                                    </p>
                                                    <div className="mt-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                                            purchase.status === 'delivered' || purchase.status === 'completed_accepted' 
                                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                                : 'bg-blue-100 text-blue-800 border-blue-200'
                                                        }`}>
                                                            {purchase.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Link 
                                                        href={route('task.order', purchase.uuid)} 
                                                        className="inline-block bg-white border-2 border-black text-black px-6 py-2 rounded-[15px] font-bold hover:bg-gray-100 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )} 

                        {auth.user.role === 1 && (
                            <div className="shadow-layout !border-3 border-black bg-white shadow-black overflow-hidden rounded-xl">
                                <div className='py-3 px-4 bg-mint flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between'>
                                    {/* <div className="flex items-center">
                                        <span className=' border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block'></span>
                                        <span className=' border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block'></span>
                                        <span className=' border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block'></span>
                                    </div> */}
                                    <h3 className="font-bold text-xl text-black">My Task Definitions</h3>
                                    <Link href={route('task.create')} className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold uppercase hover:bg-gray-800 transition-colors">
                                        + New Task
                                    </Link>
                                </div>

                                {tasks.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-500 mb-4 font-medium">No tasks created yet.</p>
                                        <Link href={route('task.create')} className="button p">
                                            Create Your First Task
                                        </Link>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {tasks.map(task => ( 
                                            <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                    <Link href={route('task.show', task.uuid)} className="flex-1 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                                                        <div  className="flex-1">
                                                            <h3 className="text-xl font-[500] text-gray-900 font-anton tracking-wide">
                                                                <span className="hover:text-pink-500">
                                                                    {task.title}
                                                                </span>
                                                            </h3>
                                                            
                                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mt-1">Created: {new Date(task.created_at).toLocaleDateString()}</p>
                                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                <span className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                                    task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                                }`}>{task.status}
                                                                </span>
                                                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-blue-100 text-blue-800 !border-blue-200">
                                                                    {task.type} Delivery
                                                                </span>
                                                                {task?.sla_hours ? <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-yellow-100 text-yellow-800 !border-yellow-200">
                                                                    {task.sla_hours} Hours
                                                                </span>: ''}
                                                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-pink-100 text-pink-800 !border-pink-200">
                                                                    {task.category || 'Paid Task'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right min-w-[100px]">
                                                            <p className="text-2xl font-black text-pink-500 font-anton font-bold">{formatMultiPrice(task.price, task.currency || 'USD')}</p>
                                                        </div>
                                                    </Link>

                                                    <div className="flex-shrink-0 ml-4">
                                                        <Link 
                                                            href={route('task.edit', task.uuid)} 
                                                            className="inline-block bg-yellow-300 text-black border-2 border-black px-4 py-2 rounded-lg font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                </div>
                                                {task.is_approved !== 1 ?
                                                    <p className="!pt-3 block text-red-500 font-bold">Unapproved : {task.is_approved_reason || 'Item is currently under review. Please check again after 30 minutes.'}</p> 
                                                : ''}  
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Completed Orders / Sales History */}
                        {completed_orders && completed_orders.length > 0 && (
                            <div className="shadow-layout !border-3 border-black bg-white shadow-black overflow-hidden rounded-xl">
                                <div className='py-3 px-4 bg-green-100 flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between'>
                                    <h3 className="font-bold text-xl text-black">Sales History</h3>
                                    <div className="flex items-center">
                                        <span className=' border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block'></span>
                                        <span className=' border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block'></span>
                                        <span className=' border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block'></span>
                                    </div>

                                
                                </div>
                                
                                <ul className="divide-y divide-gray-200">
                                    {completed_orders.map(order => (
                                        <li key={order.id} className="p-6 hover:bg-green-50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <h3 className="text-xl font-[500] text-gray-900 font-anton tracking-wide">
                                                        Order #{order.uuid.substring(0, 8)} - {order.task.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Supporter: <span className="font-semibold">{order.supporter?.name || 'Guest'}</span> | 
                                                        Ordered: {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                    <div className="mt-2">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border !border-green-300 bg-green-100 text-green-800">
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Link 
                                                        href={route('task.order', order.uuid)} 
                                                        className="button b text-sm" >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
            </div>
        </Guest>
    );
}

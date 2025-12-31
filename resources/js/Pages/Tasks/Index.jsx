import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function Index({ auth, tasks, orders, completed_orders, purchased_tasks }) {
    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title="My Tasks" />
            <div className="px-3 py-5 min-h-screen !bg-white">
                    <h2 className="text-4xl font-fre uppercase mb-8 text-center text-pink-500">Task Dashboard</h2>
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Active Orders Section */}
                        {orders && orders.length > 0 && (
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
                                    {orders.map(order => (
                                        <li key={order.id} className="p-6 hover:bg-red-50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 font-anton tracking-wide">
                                                        Order #{order.uuid.substring(0, 8)} - {order.task.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Supporter: <span className="font-semibold">{order.supporter?.name || 'Guest'}</span> | 
                                                        Ordered: {new Date(order.created_at).toLocaleDateString()}
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
                                </ul>
                            </div>
                        )}
                    
                        {/* Purchased Tasks */}
                        {purchased_tasks && purchased_tasks.length > 0 && (
                            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                                <div className='p-4 bg-blue-100 flex border-b-2 border-black items-center justify-between'>
                                    <div className="flex items-center gap-2">
                                        <span className='border-2 border-black bg-red-500 w-4 h-4 rounded-full block'></span>
                                        <span className='border-2 border-black bg-yellow-400 w-4 h-4 rounded-full block'></span>
                                        <span className='border-2 border-black bg-green-400 w-4 h-4 rounded-full block'></span>
                                    </div>
                                    <h3 className="font-bold text-lg uppercase tracking-tight">Tasks I've Purchased</h3>
                                    <div></div>
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
                                                        className="inline-block bg-white border-2 border-black text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-100 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )} 

                        {/* Task Definitions - Only for Creators (role === 1) */}
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
                                        <Link href={route('task.create')} className="btn-pink shadow-mint inline-block px-6 py-3 text-white font-bold rounded-lg border-2 border-black uppercase">
                                            Create Your First Task
                                        </Link>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {tasks.map(task => (
                                            <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                <Link href={route('task.show', task.uuid)} className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                    <div  className="flex-1">
                                                        <h3 className="text-xl font-bold text-gray-900 font-anton tracking-wide">
                                                            <Link  href={route('task.show', task.uuid)} className="hover:text-pink-500">
                                                                {task.title}
                                                            </Link>
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                                task.status === 'active' ? 'bg-green-100 text-green-800 !border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                            }`}>{task.status}
                                                            </span>
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                                                {task.type} Delivery
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right min-w-[100px]">
                                                        <p className="text-2xl font-black text-pink-500 font-anton">${task.price}</p>
                                                    </div>
                                                </Link>
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
                                                    <h3 className="text-xl font-bold text-gray-900 font-anton tracking-wide">
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
                                                        className="button b text-sm"
                                                    >
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

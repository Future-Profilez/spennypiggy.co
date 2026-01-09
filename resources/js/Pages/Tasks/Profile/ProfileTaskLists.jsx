import ProfileTask from './ProfileTask';
import { usePage, Link } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';

export default function ProfileTaskLists({ tasks, IsloggedIn }) {
    return (
        <section className="">
            <div className="shadow-layout pink-shadow-layout !border-3 border-black bg-white shadow-pink overflow-hidden rounded-xl">
                <div className='p-4 pinkbg flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between'>
                    <h3 className="font-bold text-xl text-white">{IsloggedIn ? "My Task Definitions" : "Available Tasks"}</h3>
                    {IsloggedIn ? (
                        <Link href={route('task.create')} className="button b hidden lg:visible">
                            + New Task
                        </Link>
                    ) : (
                        <div className="flex items-center">
                            <span className=' border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block'></span>
                            <span className=' border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block'></span>
                            <span className=' border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block'></span>
                        </div>
                    )}
                </div>

                {tasks && tasks.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {tasks.map((task, index) => (
                            <ProfileTask 
                                key={task.id || index} 
                                task={task} 
                                IsloggedIn={IsloggedIn} 
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="py-10">
                        <Nocontent text="No tasks available yet." />
                        {IsloggedIn && (
                            <div className="text-center mt-4">
                                <Link href={route('task.create')} className="btn-pink shadow-mint inline-block px-6 py-3 text-white font-bold rounded-lg border-2 border-black uppercase">
                                    Create Your First Task
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

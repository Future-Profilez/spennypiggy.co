import ProfileTask from './ProfileTask';
import { usePage, Link } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';

export default function ProfileTaskLists({ tasks, IsloggedIn }) {
    return (
        <section className="pb-6">

            {tasks && tasks.length > 0 ? 
                <div className="">
                    <ul className="divide-y divide-gray-200">
                        {tasks.map((task, index) => (
                            <ProfileTask 
                                key={task.id || index} 
                                task={task} 
                                IsloggedIn={IsloggedIn} 
                            />
                        ))}
                    </ul>
                </div>
                : 
                <div className="py-10">
                    <Nocontent text="No tasks available yet." />
                    {IsloggedIn && (
                        <div className="text-center mt-4">
                            <Link href={route('task.create')} className="btn-pink shadow-mint inline-block px-6 py-3 text-white font-bold rounded-xl  border-2 border-black uppercase">
                                Create Your First Task
                            </Link>
                        </div>
                    )}
                </div>
            }
        </section>
    );
}

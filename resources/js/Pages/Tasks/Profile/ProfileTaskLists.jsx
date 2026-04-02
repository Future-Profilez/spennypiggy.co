import ProfileTask from './ProfileTask';
import { usePage, Link } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';

export default function ProfileTaskLists({ tasks, IsloggedIn, profileUser }) {
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
                                profileUser={profileUser}
                            />
                        ))}
                    </ul>
                </div>
                : 
                <div className="py-10">
                    <Nocontent text="No tasks available yet." />
                    {IsloggedIn && (
                        <div className="text-center mt-4">
                            <Link href={route('task.create')} className="bg-pink-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all inline-block px-6 py-3 font-black rounded-xl border-4 border-black uppercase tracking-wider">
                                Create Your First Task
                            </Link>
                        </div>
                    )}
                </div>
            }
        </section>
    );
}

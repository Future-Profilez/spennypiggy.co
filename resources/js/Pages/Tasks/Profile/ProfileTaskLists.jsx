import ProfileTask from "./ProfileTask";
import { usePage, Link } from "@inertiajs/react";
import Nocontent from "@/includes/Nocontent";
import AddMoreTile from "@/Components/AddMoreTile";

export default function ProfileTaskLists({
    tasks,
    IsloggedIn,
    profileUser,
    suppressEmptyState = false,
}) {
    const hasTasks = !!(tasks && tasks.length > 0);

    if (!hasTasks && suppressEmptyState) return null;

    return (
        <section className="pb-6">
            {hasTasks ? (
                <div className="">
                    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {tasks.map((task, index) => (
                            <ProfileTask
                                key={task.id || index}
                                task={task}
                                IsloggedIn={IsloggedIn}
                                profileUser={profileUser}
                            />
                        ))}
                        {IsloggedIn && (
                            <li className="md:col-span-2">
                                <AddMoreTile
                                    variant="row"
                                    title="Add Task"
                                    subtitle="Create another task for your supporters."
                                    onClick={() =>
                                        window.dispatchEvent(
                                            new Event("toggleAddOptions"),
                                        )
                                    }
                                />
                            </li>
                        )}
                    </ul>
                </div>
            ) : (
                <div className="py-10">
                    <Nocontent
                        showdiscover={true}
                        text="No tasks available yet."
                    />
                    {IsloggedIn && (
                        <div className="text-center mt-4">
                            <Link
                                href={route("task.create")}
                                className="bg-[#FF007F] text-black hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-block px-6 py-3 font-black rounded-xl border-4 border-black uppercase tracking-wider"
                            >
                                Create Your First Task
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

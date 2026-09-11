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
                                    /* 🚨 A TILE INSIDE ONE MODULE'S TAB NAMES THAT MODULE.
                                       A bare `new Event` carries no `detail`, which
                                       Dashboard reads as "the creator has not decided"
                                       and answers with the seven-option chooser — so
                                       "Add Task" opened a menu whose own Task row the
                                       creator then had to press again. */
                                    onClick={() =>
                                        window.dispatchEvent(
                                            new CustomEvent(
                                                "toggleAddOptions",
                                                { detail: { intent: "task" } },
                                            ),
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
                        text="Nothing here yet"
                        subheading="This creator has no paid tasks open."
                    />
                    {IsloggedIn && (
                        <div className="text-center mt-4">
                            <Link
                                href={route("task.create")}
                                className="bg-[#FF007F] text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 inline-flex items-center justify-center min-h-[44px] px-6 py-3 font-black rounded-box-sm border-4 border-black uppercase tracking-wider"
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

import TaskItem from "@/Components/TaskItem";

export default function ProfileTask({ task, IsloggedIn, profileUser }) {
    return (
        <li className="list-none h-full">
            <TaskItem
                task={task}
                IsloggedIn={IsloggedIn}
                profileUser={profileUser}
            />
        </li>
    );
}

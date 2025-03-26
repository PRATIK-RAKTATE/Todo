import { useEffect, useState } from "react";


interface Task {
    _id: string;
    title: string;
    dueDate: string;
    status: string;
    receiver?: { name: string };
    assigner?: { name: string };
}

const CompletedTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCompletedTasks = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/v1/assigner/completed-tasks", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data: { tasks: Task[] } = await response.json();
                setTasks(data.tasks);
            } catch (error) {
                setError((error as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompletedTasks();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Completed Tasks</h2>

            {loading && <p className="text-center text-gray-500">Loading tasks...</p>}
            {error && <p className="text-center text-red-500">Error: {error}</p>}

            {!loading && !error && tasks.length === 0 && (
                <p className="text-center text-gray-500">No completed tasks available.</p>
            )}

            {!loading && !error && tasks.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="border px-4 py-2">Title</th>
                                <th className="border px-4 py-2">Due Date</th>
                                <th className="border px-4 py-2">Status</th>
                                <th className="border px-4 py-2">Task ID</th>
                                <th className="border px-4 py-2">Assigned To</th>
                                <th className="border px-4 py-2">Assigned By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task._id} className="hover:bg-gray-50">
                                    <td className="border px-4 py-2">{task.title}</td>
                                    <td className="border px-4 py-2">{new Date(task.dueDate).toLocaleDateString()}</td>
                                    <td className="border px-4 py-2 text-green-600 font-semibold">{task.status}</td>
                                    <td className="border px-4 py-2">{task._id}</td>
                                    <td className="border px-4 py-2">{task.receiver?.name || "N/A"}</td>
                                    <td className="border px-4 py-2">{task.assigner?.name || "N/A"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CompletedTasks;

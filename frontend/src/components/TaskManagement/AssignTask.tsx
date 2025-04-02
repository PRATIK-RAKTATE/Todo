import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
interface Task {
  id: string;
  title: string;
  assignedTo: string;
  deadline: string;
  status: "pending" | "in-progress" | "completed";
  description?: string;
}

const AssignTask: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        "http://localhost:4000/api/v1/assigner/task/all/assigned",
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Server did not return an array of tasks");
      }

      // Transform API response to match our Task interface
      const validatedTasks = response.data.map((apiTask: any) => {
        // Convert status from "inProgress" to "in-progress"
        const status = apiTask.Status
          ? apiTask.Status.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
          : "pending";

        return {
          id: apiTask.TaskId || "unknown-id",
          title: apiTask.Title || "Untitled Task",
          assignedTo: apiTask.To || "Unassigned",
          deadline: apiTask.Deadline || new Date().toISOString(),
          status: status as Task["status"],
        };
      });

      setTasks(validatedTasks);
      setError(null);
    } catch (err) {
      let errorMessage = "Failed to load tasks";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
        console.error("Axios error details:", {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config.url,
        });
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, []);
  const navigate = useNavigate();

  // The rest of the component remains the same as in previous version
  // Only the fetchAssignedTasks function has been modified

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 md:p-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl bg-gray-700 text-white text-center py-3 rounded-lg font-bold text-xl shadow-lg mb-8"
      >
        Assigned Tasks
      </motion.div>

      {/* Navigation Menu */}
      <div className="w-full max-w-6xl flex justify-end mb-8">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition"
          >
            <FaBars size={20} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute right-0 mt-2 w-48 bg-gray-200 rounded-lg shadow-lg p-3 z-50"
              >
                <ul className="space-y-2 text-gray-700">
                  <li className="hover:bg-gray-300 rounded-md transition">
                    <Link
                      to="/task-home"
                      className="block p-2"
                      onClick={() => setShowMenu(false)}
                    >
                      Task Home Page
                    </Link>
                  </li>
                  <li className="hover:bg-gray-300 rounded-md transition">
                    <Link
                      to="/assign-task"
                      className="block p-2"
                      onClick={() => setShowMenu(false)}
                    >
                      Assigned Tasks
                    </Link>
                  </li>
                  <li className="hover:bg-gray-300 rounded-md transition">
                    <Link
                      to="/task"
                      className="block p-2"
                      onClick={() => setShowMenu(false)}
                    >
                      Assign a Task
                    </Link>
                  </li>
                  <li className="hover:bg-gray-300 rounded-md transition">
                    <Link
                      to="/completed-tasks"
                      className="block p-2"
                      onClick={() => setShowMenu(false)}
                    >
                      Completed Tasks
                    </Link>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full max-w-6xl">
        {loading ? (
          <div className="text-center p-8">
            <div className="inline-block h-12 w-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading assigned tasks...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={fetchAssignedTasks}
                  className="mt-2 text-red-700 underline hover:text-red-600 text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No assigned tasks found
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {task.title}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Assigned to:</span>
                    <span className="text-gray-700 font-medium">
                      {task.assignedTo}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Deadline:</span>
                    <span className="text-gray-700">
                      {new Date(task.deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AssignTask;

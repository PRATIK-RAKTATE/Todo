import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBars } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { Link, Navigate, useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline: string;
  assigner?: User;
  receiver?: User;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
  count?: number;
}

const TaskHomePage: React.FC = () => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600";
      case "inprogress":
        return "text-yellow-600";
      case "pending":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  // Fetch tasks accepted by the current user
  const fetchUserTasks = async (): Promise<void> => {
    console.log("[1] Starting fetchUserTasks");
    setLoading(true);
    setError(null);

    try {
      console.log("[2] Making API call to user tasks endpoint");
      // CORRECTED API ENDPOINT
      const response = await axios.get<ApiResponse<Task[]>>(
        "http://localhost:4000/api/v1/assigner/task/me",
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[3] API response received:", response);

      if (response.data && response.data.success) {
        console.log("[4] Valid user tasks data received:", response.data.data);
        setUserTasks(response.data.data);
      } else {
        console.error("[5] Invalid data format:", response.data);
        throw new Error(
          response.data.message || "Invalid user tasks data format"
        );
      }
    } catch (err) {
      console.error("[6] Error in fetchUserTasks:", err);

      let errorMessage = "Failed to load user tasks";
      if (axios.isAxiosError(err)) {
        console.error("[7] Axios error details:", {
          status: err.response?.status,
          data: err.response?.data,
          config: err.config,
        });
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      console.log("[8] Final cleanup - setting loading to false");
      setLoading(false);
    }
  };

  // Fetch all tasks
  const fetchAllTasks = async (): Promise<void> => {
    console.log("[1] Starting fetchAllTasks");
    setLoading(true);
    setError(null);

    try {
      console.log("[2] Making API call to all tasks endpoint");
      const response = await axios.get<ApiResponse<Task[]>>(
        "http://localhost:4000/api/v1/assigner/task",
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[3] API response received:", response);

      if (response.data && response.data.success) {
        console.log("[4] Valid tasks data received:", response.data.data);
        setAllTasks(response.data.data);
      } else {
        console.error("[5] Invalid data format:", response.data);
        throw new Error(response.data.message || "Invalid tasks data format");
      }
    } catch (err) {
      console.error("[6] Error in fetchAllTasks:", err);

      let errorMessage = "Failed to load tasks";
      if (axios.isAxiosError(err)) {
        console.error("[7] Axios error details:", {
          status: err.response?.status,
          data: err.response?.data,
          config: err.config,
        });
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      console.log("[8] Final cleanup - setting loading to false");
      setLoading(false);
    }
  };

  // Fetch the appropriate data when the active section changes
  useEffect(() => {
    if (activeSection === "users") {
      fetchUserTasks();
    } else if (activeSection === "tasks") {
      fetchAllTasks();
    }
  }, [activeSection]);

  // Format date string to a readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "No deadline";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return dateString || "Invalid Date";
    }
  };

  // Format status string with proper capitalization
  const formatStatus = (status: string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 md:p-20">
      {/* Header */}
      <div className="w-full max-w-6xl bg-gray-800 text-white text-center py-4 rounded-lg text-2xl font-bold shadow-lg">
        Task Home Page
      </div>

      {/* Navigation Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl flex flex-wrap justify-between items-center mt-6 gap-3"
      >
        <button
          onClick={() => {
            navigate("/task");
          }}
          className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition"
        >
          This Milestone ◀
        </button>
        <button
          className={`${
            activeSection === "users" ? "bg-blue-600" : "bg-gray-600"
          } text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition`}
          onClick={() => setActiveSection("users")}
        >
          Users Task
        </button>
        <button
          className={`${
            activeSection === "tasks" ? "bg-blue-600" : "bg-gray-600"
          } text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition`}
          onClick={() => setActiveSection("tasks")}
        >
          All Tasks
        </button>

        {/* Menu Button */}
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
                  <li className="hover:bg-gray-300 rounded-md transition">
                    <Link
                      to="/calendar"
                      className="block p-2"
                      onClick={() => setShowMenu(false)}
                    >
                      Calendar
                    </Link>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content Section */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-1 gap-6 mt-6 place-items-center">
        {/* Left Section - Requests & Ongoing Tasks */}
        {/* <div className="col-span-1 bg-white p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold text-gray-800">Requests</h2>
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-200 rounded-lg">
              From - Task Title - Deadline
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              From - Task Title - Deadline
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mt-6">
            Ongoing Tasks
          </h2>
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-blue-200 rounded-lg">
              From - Task Title - Deadline - Status
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              From - Task Title - Deadline - Status
            </div>
          </div>
        </div> */}

        {/* Right Section - Dynamic Content */}
        <div className="col-span-2 bg-white p-4 rounded-lg shadow-lg w-full">
          {activeSection === "tasks" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-lg font-bold text-gray-800">All Tasks</h2>

              {loading && (
                <div className="text-center my-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading tasks...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                  <p>Error: {error}</p>
                  <button
                    onClick={fetchAllTasks}
                    className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <ul className="mt-4 space-y-3">
                  {allTasks.length > 0 ? (
                    allTasks.map((task) => (
                      <li
                        key={task.id}
                        className="p-4 bg-green-200 rounded-lg shadow-md hover:bg-green-300 transition cursor-pointer"
                      >
                        <Link to={`/task-details/${task.id}`} className="block">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">
                                {task.title || "Untitled Task"}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {task.description}
                                </p>
                              )}
                              {task.assigner && (
                                <p className="text-sm text-gray-600 mt-1">
                                  From: {task.assigner.name}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 md:mt-0 md:ml-4">
                              <p className="text-sm text-gray-600">
                                Deadline: {formatDate(task.deadline)}
                              </p>
                              <p className="text-sm mt-1">
                                Status:{" "}
                                <span
                                  className={`font-medium ${getStatusColor(
                                    task.status
                                  )}`}
                                >
                                  {formatStatus(task.status)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 p-4">No tasks found.</p>
                  )}
                </ul>
              )}
            </motion.div>
          )}

          {activeSection === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-lg font-bold text-gray-800">
                My Accepted Tasks
              </h2>

              {loading && (
                <div className="text-center my-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading your tasks...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                  <p>Error: {error}</p>
                  <button
                    onClick={fetchUserTasks}
                    className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <ul className="mt-4 space-y-3">
                  {userTasks.length > 0 ? (
                    userTasks.map((task) => (
                      <li
                        key={task.id}
                        className="p-4 bg-yellow-200 rounded-lg shadow-md hover:bg-yellow-300 transition cursor-pointer"
                      >
                        <Link to={`/task-details/${task.id}`} className="block">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">
                                {task.title || "Untitled Task"}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {task.description}
                                </p>
                              )}
                              {task.assigner && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Assigned by: {task.assigner.name}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 md:mt-0 md:ml-4">
                              <p className="text-sm text-gray-600">
                                Deadline: {formatDate(task.deadline)}
                              </p>
                              <p className="text-sm mt-1">
                                Status:{" "}
                                <span
                                  className={`font-medium ${getStatusColor(
                                    task.status
                                  )}`}
                                >
                                  {formatStatus(task.status)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 p-4">
                      You have no accepted tasks.
                    </p>
                  )}
                </ul>
              )}
            </motion.div>
          )}

          {!activeSection && (
            <div className="text-gray-600 text-center mt-6">
              Click a button to view tasks or users.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskHomePage;

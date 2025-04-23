import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBars } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom"; // Added missing import"

interface User {
  id: string;
  name: string;
  title: string;
  status: string;
  deadline: string;
}

interface Task {
  id: number;
  title: string;
  deadline: string;
  description?: string;
  status?: string;
  assignedDate?: string;
  assigner?: string;
}

interface ApiResponse<T = any> {
  message: string;
  statusCode: number;
  data: T;
}

// interface ApiResponse {
//   statusCode: number;
//   data: User[] | null;
//   message?: string;
// }

const TaskHomePage: React.FC = () => {
  var userArr: any = [];
  var taskArr: any = [];
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

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

  const fetchTasks = async (): Promise<void> => {
    console.log("[1] Starting fetchTasks");
    setTasksLoading(true);
    setTasksError(null);

    try {
      console.log("[2] Making API call to tasks endpoint");
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
      console.log("[4] Response data:", response.data);

      if (!response.data) {
        console.error("[5] Empty response data");
        throw new Error("Empty response from server");
      }

      if (response.data && Array.isArray(response.data.data)) {
        console.log("[6] Valid tasks data received:", response.data.data);
        setTasks(response.data.data);
      } else {
        console.error("[7] Invalid data format:", response.data);
        throw new Error(response.data.message || "Invalid tasks data format");
      }
    } catch (err) {
      console.error("[8] Error in fetchTasks:", err);

      let errorMessage = "Failed to load tasks";
      if (axios.isAxiosError(err)) {
        console.error("[9] Axios error details:", {
          status: err.response?.status,
          data: err.response?.data,
          config: err.config,
        });
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setTasksError(errorMessage);
    } finally {
      console.log("[10] Final cleanup - setting loading to false");
      setTasksLoading(false);
    }
  };

  // Example tasks can be added to the initial state if needed
  useEffect(() => {
    setTasks([
      { id: 1, title: "Design Landing Page", deadline: "March 31, 2025" },
      { id: 2, title: "API Integration", deadline: "April 2, 2025" },
      { id: 3, title: "Fix UI Bugs", deadline: "April 5, 2025" },
    ]);
  }, []);

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    } else if (activeSection === "tasks") {
      fetchTasks();
    }
  }, [activeSection]);

  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<ApiResponse>(
        "http://localhost:4000/api/v1/assigner/task/me",  
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);

      if (!response.data) {
        throw new Error("Empty response from server");
      }

      userArr = response.data.data as User[];
      console.log("User Array:", userArr);

      if (response.data) {
        // Handle both response formats
        const responseData = response.data.data;

        if (Array.isArray(responseData)) {
          setUsers(responseData);
        } else if (responseData?.names && Array.isArray(responseData.names)) {
          setUsers(responseData.names);
        } else {
          throw new Error("Valid users array not found in response");
        }
      } else if (!response.data) {
        setUsers([]);
      } else {
        throw new Error(response.data || "Unexpected response format");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      let errorMessage = "Failed to load users";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
        console.error("HTTP Error Details:", {
          status: err.response?.status,
          data: err.response?.data,
        });
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }

    // Move these additional API calls outside the finally block
    try {
      const response = await axios.get(
        "http://localhost:4000/api/v1/assigner/task/me",
        { withCredentials: true }
      );

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        const tasks = response.data.data;
        console.log("Fetched tasks:", tasks);
        // Process tasks as needed
      } else {
        throw new Error(
          "Unexpected response format: " + JSON.stringify(response.data)
        );
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      // Additional error handling as needed
    }
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
        <button className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition">
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
        {/* New Calendar Option */}
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
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Left Section - Requests & Ongoing Tasks */}
        <div className="col-span-1 bg-white p-4 rounded-lg shadow-lg">
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
        </div>

        {/* Right Section - Dynamic Content */}
        <div className="col-span-2 bg-white p-4 rounded-lg shadow-lg">
          {activeSection === "tasks" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-lg font-bold text-gray-800">All Tasks</h2>

              {tasksLoading && (
                <div className="text-center my-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading tasks...</p>
                </div>
              )}

              {tasksError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                  <p>Error: {tasksError}</p>
                  <button
                    onClick={fetchTasks}
                    className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!tasksLoading && !tasksError && (
                <ul className="mt-4 space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map((task) => {
                      // Safe date formatting with fallback
                      const formatDate = (dateString: string) => {
                        try {
                          return new Date(dateString).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          );
                        } catch (e) {
                          console.error("Invalid date format:", dateString);
                          return "Invalid Date";
                        }
                      };

                      // Status formatting with fallback
                      const formattedStatus = task.status
                        ? task.status.charAt(0).toUpperCase() +
                          task.status.slice(1)
                        : "Unknown Status";

                      return (
                        <li
                          key={task.id}
                          className="p-4 bg-green-200 rounded-lg shadow-md hover:bg-green-300 transition cursor-pointer"
                        >
                          <Link
                            to={`/task-details/${task.id}`}
                            className="block"
                          >
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
                              </div>
                              <div className="mt-2 md:mt-0 md:ml-4">
                                <p className="text-sm text-gray-600">
                                  Deadline: {formatDate(task.deadline)}
                                </p>
                                {task.status && (
                                  <p className="text-sm mt-1">
                                    Status:{" "}
                                    <span
                                      className={`font-medium ${getStatusColor(
                                        task.status
                                      )}`}
                                    >
                                      {formattedStatus}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })
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
              <h2 className="text-lg font-bold text-gray-800">Users List</h2>

              {loading && (
                <div className="text-center my-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                  <p>Error: {error}</p>
                  <button
                    onClick={fetchUsers}
                    className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <ul className="mt-4 space-y-3">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <li
                        key={user.id}
                        className="p-3 bg-yellow-200 rounded-lg shadow-md hover:bg-yellow-300 transition cursor-pointer flex justify-between items-center"
                      >
                        <span> {user.title}</span>
                        <span>{user.deadline}</span>
                        <span>{user.status}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500">No users found.</p>
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

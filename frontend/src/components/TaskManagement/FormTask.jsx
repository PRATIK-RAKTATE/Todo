import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Milestone from "./Milestone";

const TaskCreateForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [selectedDate, setSelectedDate] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Fetch users on component mount with credentials
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/v1/user", { withCredentials: true })
      .then((response) => {
        if (response.data?.data?.names) {
          setUsers(response.data.data.names);
        } else {
          console.error("Invalid response format:", response.data);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching users:",
          error.response?.status,
          error.response?.data
        );
      });
  }, []);

  const onSubmit = async (data) => {
    if (!selectedReceiver) {
      toast.error("Please select a receiver!");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a deadline!");
      return;
    }

    const formattedData = {
      ...data,
      receiverId: selectedReceiver, // Send selected user's id
      deadline: selectedDate?.toISOString(),
    };

    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/assigner/task",
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // Ensure credentials are included
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Task created successfully!");
        reset();
        setSelectedDate(null);
        setSelectedReceiver("");
      } else {
        toast.error("Error creating task!");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Failed to create task!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Milestone />
      <div className="relative z-20 flex justify-end mb-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition"
          aria-label="Menu"
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

      <div className="w-full max-w-md mx-auto my-8 p-4 sm:p-6 bg-blue-50 border border-blue-300 rounded-xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-800 mb-6 text-center">
          Create Task
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-blue-700 mb-1 text-sm sm:text-base">
              Title
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              placeholder="Task title"
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.title && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-blue-700 mb-1 text-sm sm:text-base">
              Description
            </label>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              placeholder="Task description"
              rows="4"
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.description && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Receiver Dropdown */}
          <div>
            <label className="block text-blue-700 mb-1 text-sm sm:text-base">
              Assign To
            </label>
            <select
              value={selectedReceiver}
              onChange={(e) => setSelectedReceiver(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            {/* {!selectedReceiver && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                Please select a receiver.
              </p>
            )} */}
          </div>

          {/* Date Picker with minDate set to today */}
          <div>
            <label className="block text-blue-700 mb-1 text-sm sm:text-base">
              Deadline
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholderText="Select deadline"
              minDate={new Date()} // Set minimum date to today
              filterDate={(date) => date >= new Date().setHours(0, 0, 0, 0)} // Additional filter to ensure date is today or future
            />
            {/* {!selectedDate && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                Please select a deadline.
              </p>
            )} */}
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Create Task
          </button>
        </form>
        <ToastContainer autoClose={3000} position="top-right" />
      </div>
    </div>
  );
};

export default TaskCreateForm;

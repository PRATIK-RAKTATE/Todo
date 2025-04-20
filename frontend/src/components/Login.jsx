import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  // State to manage form data (email and password)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hook to navigate to another page after successful login
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation: Check if fields are not empty
    if (!email || !password) {
      setError("Please fill out both fields.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "/api/v1/user/login",
        {
          email,
          password,
        },
        {
          withCredentials: true, // Ensure cookies are sent with requests
        }
      );

      // Assuming the backend sends the user info after successful login
      const { success, data, message } = await response.data;

      if (success) {
        login(); // Add this line to update auth state
        // Login successful
        console.log("Login successful");
        // console.log('User:', data.user);

        const user = data.user;
        localStorage.setItem("username", user.name || user.email); // Store name or fallback to email
        console.log(user);

        // Redirect to another page after successful login
        if (user.childId == "none") {
          if (user.role == "coordinator") {
            navigate("/coordinator/uploadAbstracts");
          } else if (user.role == "student") {
            console.log("navigating to student registration page");
            navigate("/register-student", { state: { user } });
          } else if (user.role == "staff") {
            console.log("navigating to staff registration page");
            navigate("/register-staff", { state: { user } });
          }
        } else {
          if (user.role == "student") {
            console.log("navigating to student dashboard");
            navigate("/student/dashboard");
          } else if (user.role == "staff") {
            navigate("/staff/dashboard");
          }
          // TODO: Navigate to the appropriate page based on user role
        }
      } else {
        setError(message || "Something went wrong");
      }
    } catch (err) {
      if (err.response) {
        // The server responded with an error
        setError(err.response.data.message || "Something went wrong");
      } else {
        // Network error or request timeout
        setError("Network error, please try again later");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update email state
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update password state
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      </div>
    </div>
  );
};

export default Login;

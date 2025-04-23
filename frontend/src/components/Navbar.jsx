import React, { useState } from "react";
import { Menu, X, LogIn, Bell, HelpCircle, CheckSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "/api/v1/user/logout",
        {},
        { withCredentials: true }
      );
      // Call logout regardless of the API response to ensure local state is cleared
      logout();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      // Still logout locally even if the API call fails
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-white text-xl font-bold">ProjectTrack</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/faq"
              className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/notifications"
                  className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Link>
                <Link
                  to="/task-home"
                  className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                </Link>
              </>
            )}
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 transition duration-300 shadow-lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-100 hover:text-white hover:bg-blue-700"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/faq"
                className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/notifications"
                    className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Link>
                  <Link
                    to="/tasks"
                    className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Tasks
                  </Link>
                </>
              )}
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-gray-100 hover:text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

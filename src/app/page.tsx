"use client";

import { useState, useEffect } from "react";
import Main from "@/components/Main";
import Login from "@/components/Login";
import { LogOut, User } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log("Stored user data:", userData); // Debug log

        // Handle case where existing users might not have name field
        if (!userData.name && userData.email) {
          console.log("User missing name field, using email as fallback");
          userData.name = userData.email.split("@")[0]; // Use email prefix as name
        }

        setUser(userData);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: {
    id: string;
    email: string;
    name: string;
  }) => {
    console.log("Login userData:", userData); // Debug log
    setUser(userData);
    // Store user in localStorage
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    // Remove user from localStorage
    localStorage.removeItem("user");
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">VP</span>
              </div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-gray-900">
                  Voting Polls
                </h1>
                <span className="text-gray-400">•</span>
                <p className="text-sm text-gray-500">
                  Create and vote on polls together
                </p>
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {user.name || user.email || "Unknown"}
                  </p>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Main />
      </div>
    </div>
  );
}

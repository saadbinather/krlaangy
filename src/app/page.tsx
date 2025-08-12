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
    <div className="min-h-screen bg-black">
      {/* Enhanced Header */}
      <div className="bg-black/90 backdrop-blur-xl border-b border-green-600/20 w-full">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center justify-start">
              <h1 className="text-xl font-bold text-green-600 tracking-wide">
                Krlaangy
              </h1>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <User size={20} className="text-green-400" />
                <div className="text-sm">
                  <p className="font-medium text-white">
                    {user.name || user.email || "Unknown"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center bg-black space-x-2 px-4 py-2 text-red-400 rounded-lg transition-colors text-sm font-medium hover:text-red-800"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Main />
        </div>
      </div>
    </div>
  );
}

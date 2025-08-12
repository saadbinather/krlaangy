"use client";

import React from "react";
import { useSocket } from "@/lib/socket";
import { Wifi, WifiOff, Activity } from "lucide-react";

export default function RealTimeStatus() {
  const { isConnected, isConnecting } = useSocket();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border">
        <div className="flex items-center space-x-2">
          {isConnecting ? (
            <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />
          ) : isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {isConnecting ? "Connecting..." : isConnected ? "Live" : "Offline"}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isConnected ? "Real-time enabled" : "Using REST API fallback"}
        </div>
        {isConnected && (
          <div className="text-xs text-gray-500 mt-1">
            Real-time voting enabled
          </div>
        )}
      </div>
    </div>
  );
}

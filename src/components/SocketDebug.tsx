"use client";

import React, { useState } from "react";
import { useSocket } from "@/lib/socket";

export default function SocketDebug() {
  const { isConnected, isConnecting, sendVote, sendComment } = useSocket();
  const [testMessage, setTestMessage] = useState("");

  const testVote = () => {
    if (isConnected) {
      console.log("Testing vote...");
      sendVote("test-user-id", "test-option-id", "test-plan-id");
    }
  };

  const testComment = () => {
    if (isConnected) {
      console.log("Testing comment...");
      sendComment("Test comment", "test-user-id", "test-plan-id");
    }
  };

  const testRealVote = () => {
    if (isConnected) {
      console.log("Testing real vote...");
      // Use a real plan ID from your database
      const realPlanId = "your-actual-plan-id"; // Replace with a real plan ID
      sendVote("test-user-id", "test-option-id", realPlanId);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4 border">
      <h3 className="font-bold mb-2">Socket.IO Debug</h3>
      <div className="space-y-2 text-sm">
        <div>
          Status:{" "}
          {isConnecting
            ? "Connecting..."
            : isConnected
            ? "Connected"
            : "Disconnected"}
        </div>
        <button
          onClick={testVote}
          disabled={!isConnected}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:bg-gray-300"
        >
          Test Vote
        </button>
        <button
          onClick={testComment}
          disabled={!isConnected}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs disabled:bg-gray-300 ml-2"
        >
          Test Comment
        </button>
        <button
          onClick={testRealVote}
          disabled={!isConnected}
          className="px-2 py-1 bg-purple-500 text-white rounded text-xs disabled:bg-gray-300 ml-2"
        >
          Test Real Vote
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  autoConnect?: boolean;
  planId?: string;
}

interface PlanUpdateData {
  planId: string;
  plan: {
    id: string;
    title: string;
    createdAt: string;
    createdBy: {
      id: string;
      email: string;
      name: string;
    };
    options: Array<{
      id: string;
      optionText: string;
      votes: Array<{
        id: string;
        userId: string;
        user?: {
          id: string;
          email: string;
          name: string;
        };
      }>;
    }>;
    comments: Array<{
      id: string;
      text: string;
      createdAt: string;
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }>;
  };
}

interface PlanDeleteData {
  planId: string;
  deletedData: {
    optionsCount: number;
    votesCount: number;
    commentsCount: number;
  };
}

interface ErrorData {
  error: string;
  message?: string;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, planId } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const eventListenersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socketRef.current) {
      setIsConnecting(true);

      // Create socket connection
      const socketUrl = typeof window !== "undefined" 
        ? window.location.origin 
        : "https://krlaangy.onrender.com";
      console.log("🔌 Connecting to Socket.IO server at:", socketUrl);

      socketRef.current = io(socketUrl, {
        path: "/api/socket",
        autoConnect,
        transports: ["websocket", "polling"], // Try websocket first, then polling
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true,
        withCredentials: false, // Disable credentials for better compatibility
        extraHeaders: {
          "Access-Control-Allow-Origin": "*",
        },
      });

      // Connection event handlers
      socketRef.current.on("connect", () => {
        console.log("✅ Connected to Socket.IO server");
        setIsConnected(true);
        setIsConnecting(false);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Disconnected from Socket.IO server");
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("🚨 Socket connection error:", error);
        console.error("🚨 Error details:", {
          message: error.message,
          name: error.name,
        });
        setIsConnecting(false);
      });

      socketRef.current.on("error", (error) => {
        console.error("🚨 Socket error:", error);
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      });

      socketRef.current.on("reconnect_failed", () => {
        console.error("🚨 Reconnection failed after all attempts");
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect]); // Added autoConnect to dependency array

  // Separate effect for joining rooms when connected
  useEffect(() => {
    if (planId && socketRef.current && isConnected) {
      console.log(`Joining plan room: ${planId}`);
      socketRef.current.emit("join-plan", planId);
    }
  }, [planId, isConnected]);

  // Voting functions
  const sendVote = (userId: string, optionId: string, planId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("new-vote", {
        userId,
        optionId,
        planId,
      });
    }
  };

  const deleteVote = (voteId: string, userId: string, planId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("delete-vote", {
        voteId,
        userId,
        planId,
      });
    }
  };

  const sendComment = (text: string, userId: string, planId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("new-comment", {
        text,
        userId,
        planId,
      });
    }
  };

  const deletePlan = (planId: string, userId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("delete-plan", {
        planId,
        userId,
      });
    }
  };

  // Event listeners with duplicate prevention
  const onPlanUpdated = useCallback(
    (callback: (data: PlanUpdateData) => void) => {
      if (socketRef.current && isConnected) {
        // Remove existing listener if any
        socketRef.current.off("plan-updated");
        socketRef.current.on("plan-updated", callback);
        eventListenersRef.current.add("plan-updated");
      }
    },
    [isConnected]
  );

  const onPlanDeleted = useCallback(
    (callback: (data: PlanDeleteData) => void) => {
      if (socketRef.current && isConnected) {
        // Remove existing listener if any
        socketRef.current.off("plan-deleted");
        socketRef.current.on("plan-deleted", callback);
        eventListenersRef.current.add("plan-deleted");
      }
    },
    [isConnected]
  );

  const onVoteError = useCallback(
    (callback: (data: ErrorData) => void) => {
      if (socketRef.current && isConnected) {
        // Remove existing listener if any
        socketRef.current.off("vote-error");
        socketRef.current.on("vote-error", callback);
        eventListenersRef.current.add("vote-error");
      }
    },
    [isConnected]
  );

  const onCommentError = useCallback(
    (callback: (data: ErrorData) => void) => {
      if (socketRef.current && isConnected) {
        // Remove existing listener if any
        socketRef.current.off("comment-error");
        socketRef.current.on("comment-error", callback);
        eventListenersRef.current.add("comment-error");
      }
    },
    [isConnected]
  );

  const onPlanDeleteError = useCallback(
    (callback: (data: ErrorData) => void) => {
      if (socketRef.current && isConnected) {
        // Remove existing listener if any
        socketRef.current.off("plan-delete-error");
        socketRef.current.on("plan-delete-error", callback);
        eventListenersRef.current.add("plan-delete-error");
      }
    },
    [isConnected]
  );

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  const joinPlanRoom = (planId: string) => {
    if (socketRef.current && isConnected) {
      console.log(`Joining plan room: ${planId}`);
      socketRef.current.emit("join-plan", planId);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    sendVote,
    deleteVote,
    sendComment,
    deletePlan,
    onPlanUpdated,
    onPlanDeleted,
    onVoteError,
    onCommentError,
    onPlanDeleteError,
    disconnect,
    connect,
    joinPlanRoom,
  };
};

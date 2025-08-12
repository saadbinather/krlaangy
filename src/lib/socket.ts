import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  autoConnect?: boolean;
  planId?: string;
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
      const socketUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      console.log("🔌 Connecting to Socket.IO server at:", socketUrl);

      socketRef.current = io(socketUrl, {
        path: "/api/socket",
        autoConnect,
        transports: ["polling", "websocket"], // Try polling first, then websocket
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true,
        withCredentials: true,
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
  }, []); // Only run once on mount

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
  const onPlanUpdated = useCallback((callback: (data: any) => void) => {
    if (socketRef.current && !eventListenersRef.current.has("plan-updated")) {
      socketRef.current.on("plan-updated", callback);
      eventListenersRef.current.add("plan-updated");
    }
  }, []);

  const onPlanDeleted = useCallback((callback: (data: any) => void) => {
    if (socketRef.current && !eventListenersRef.current.has("plan-deleted")) {
      socketRef.current.on("plan-deleted", callback);
      eventListenersRef.current.add("plan-deleted");
    }
  }, []);

  const onVoteError = useCallback((callback: (data: any) => void) => {
    if (socketRef.current && !eventListenersRef.current.has("vote-error")) {
      socketRef.current.on("vote-error", callback);
      eventListenersRef.current.add("vote-error");
    }
  }, []);

  const onCommentError = useCallback((callback: (data: any) => void) => {
    if (socketRef.current && !eventListenersRef.current.has("comment-error")) {
      socketRef.current.on("comment-error", callback);
      eventListenersRef.current.add("comment-error");
    }
  }, []);

  const onPlanDeleteError = useCallback((callback: (data: any) => void) => {
    if (socketRef.current && !eventListenersRef.current.has("plan-delete-error")) {
      socketRef.current.on("plan-delete-error", callback);
      eventListenersRef.current.add("plan-delete-error");
    }
  }, []);

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

"use client";

import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  ThumbsUp,
  X,
  Check,
  Plus,
  Vote,
  Clock,
  User,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSocket } from "@/lib/socket";
import RealTimeStatus from "./RealTimeStatus";
import SocketDebug from "./SocketDebug";

type Plan = {
  id: string;
  title: string;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    name: string;
  };
  options: PlanOption[];
  comments: Comment[];
};

type PlanOption = {
  id: string;
  optionText: string;
  votes: Vote[];
};

type Vote = {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

const fetchPlans = async (): Promise<Plan[]> => {
  try {
    const res = await fetch("/api/plans");
    if (!res.ok) {
      console.error("Failed to fetch plans:", res.status, res.statusText);
      return []; // Return empty array instead of throwing error
    }
    const data = await res.json();
    console.log("Data received in Main component:", data);
    return data;
  } catch (error) {
    console.error("Error fetching plans:", error);
    return []; // Return empty array on any error
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid time";
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid time";
  }
};

export default function Main() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState<{
    [planId: string]: string;
  }>({});
  const [submitting, setSubmitting] = useState<{ [planId: string]: boolean }>(
    {}
  );
  const [selectedOptions, setSelectedOptions] = useState<{
    [planId: string]: string;
  }>({});
  const [showComments, setShowComments] = useState<{
    [planId: string]: boolean;
  }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanOptions, setNewPlanOptions] = useState<string[]>(["", ""]);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // Socket.IO setup for real-time voting
  const {
    isConnected,
    sendVote,
    deleteVote,
    sendComment,
    onPlanUpdated,
    onVoteError,
    onCommentError,
    joinPlanRoom,
  } = useSocket();

  // Join plan rooms for all plans when connected
  useEffect(() => {
    if (isConnected && plans.length > 0) {
      plans.forEach((plan) => {
        console.log(`Joining room for plan: ${plan.id}`);
        // We'll handle room joining in the socket hook
      });
    }
  }, [isConnected, plans]);

  useEffect(() => {
    fetchPlans().then((data) => {
      console.log("Fetched plans data:", data); // Debug log
      setPlans(data);
      setLoading(false);
    });
  }, []);

  // Listen for real-time plan updates
  useEffect(() => {
    if (isConnected) {
      console.log("🔌 Setting up Socket.IO event listeners");

      // Set up event listeners only once when connected
      onPlanUpdated((data) => {
        console.log("📡 Plan updated via Socket.IO:", data);
        const { planId, plan } = data;
        console.log(`📡 Received update for plan: ${planId}`);

        setPlans((prevPlans) => {
          const updatedPlans = prevPlans.map((p) =>
            p.id === planId ? plan : p
          );
          console.log("📡 Updated plans state:", updatedPlans);
          return updatedPlans;
        });
      });

      onVoteError((error) => {
        console.error("❌ Vote error:", error);
        alert(error.error || "Vote failed");
      });

      onCommentError((error) => {
        console.error("❌ Comment error:", error);
        alert(error.error || "Comment failed");
      });
    }
  }, [isConnected, onPlanUpdated, onVoteError, onCommentError]); // Add callback dependencies

  const handleCommentChange = (planId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [planId]: value }));
  };

  const handleCommentSubmit = async (planId: string) => {
    if (!currentUser || !commentInputs[planId]?.trim()) return;

    setSubmitting((prev) => ({ ...prev, [planId]: true }));

    try {
      if (isConnected) {
        // Use Socket.IO for real-time comments
        joinPlanRoom(planId);
        sendComment(commentInputs[planId], currentUser.id, planId);
        setCommentInputs((prev) => ({ ...prev, [planId]: "" }));
      } else {
        // Fallback to API if Socket.IO is not connected
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: commentInputs[planId],
            userId: currentUser.id,
            planId,
          }),
        });

        if (response.ok) {
          setCommentInputs((prev) => ({ ...prev, [planId]: "" }));
          const updatedPlans = await fetchPlans();
          setPlans(updatedPlans);
        } else {
          const data = await response.json();
          alert(data.error || "Failed to post comment");
        }
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const handleOptionSelect = (planId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [planId]: optionId }));
  };

  const handleVote = async (planId: string, optionId: string) => {
    try {
      if (!currentUser) {
        alert("Please log in to vote");
        return;
      }

      console.log("Voting with:", { userId: currentUser.id, optionId, planId });

      // Optimistic UI update - update the UI immediately
      setPlans((prevPlans) =>
        prevPlans.map((plan) => {
          if (plan.id === planId) {
            return {
              ...plan,
              options: plan.options.map((option) => {
                // Remove user's vote from all options first
                const votesWithoutUser = option.votes.filter(
                  (vote) => vote.userId !== currentUser.id
                );

                if (option.id === optionId) {
                  // Add user's vote to this option
                  return {
                    ...option,
                    votes: [
                      ...votesWithoutUser,
                      { id: `temp-${Date.now()}`, userId: currentUser.id },
                    ],
                  };
                } else {
                  // Keep votes without user's vote
                  return {
                    ...option,
                    votes: votesWithoutUser,
                  };
                }
              }),
            };
          }
          return plan;
        })
      );

      // Use Socket.IO for real-time voting
      if (isConnected) {
        console.log("🚀 Sending vote via Socket.IO");
        console.log("🚀 Vote data:", {
          userId: currentUser.id,
          optionId,
          planId,
        });
        // Join the plan room before voting
        joinPlanRoom(planId);
        sendVote(currentUser.id, optionId, planId);
        console.log("🚀 Vote sent via Socket.IO");
      } else {
        console.log("Socket.IO not connected, using REST API fallback");
        // Fallback to API if Socket.IO is not connected
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            optionId,
            planId,
          }),
        });

        console.log("Vote response status:", response.status);
        const data = await response.json();
        console.log("Vote response data:", data);

        if (!response.ok) {
          // Revert optimistic update on error
          const updatedPlans = await fetchPlans();
          setPlans(updatedPlans);
          alert(data.error || "Failed to vote");
        } else {
          // Refresh data after successful vote
          const updatedPlans = await fetchPlans();
          setPlans(updatedPlans);
        }
      }
    } catch (error) {
      console.error("Error voting:", error);
      // Revert optimistic update on error
      const updatedPlans = await fetchPlans();
      setPlans(updatedPlans);
      alert("Failed to vote");
    }
  };

  const toggleComments = (planId: string) => {
    setShowComments((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const getTotalVotes = (options: PlanOption[]) => {
    return (
      options?.reduce(
        (total, option) => total + (option.votes?.length || 0),
        0
      ) || 0
    );
  };

  const getVotePercentage = (votes: Vote[], totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round(((votes?.length || 0) / totalVotes) * 100);
  };

  const addOptionField = () => {
    setNewPlanOptions((prev) => [...prev, ""]);
  };

  const removeOptionField = (index: number) => {
    if (newPlanOptions.length > 2) {
      setNewPlanOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateOptionField = (index: number, value: string) => {
    setNewPlanOptions((prev) =>
      prev.map((option, i) => (i === index ? value : option))
    );
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !currentUser ||
      !newPlanTitle.trim() ||
      newPlanOptions.some((opt) => !opt.trim())
    ) {
      alert("Please fill in all fields");
      return;
    }

    setCreatingPlan(true);

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newPlanTitle,
          createdById: currentUser.id,
          options: newPlanOptions.filter((opt) => opt.trim()),
        }),
      });

      if (response.ok) {
        setNewPlanTitle("");
        setNewPlanOptions(["", ""]);
        setShowCreateForm(false);
        const updatedPlans = await fetchPlans();
        setPlans(updatedPlans);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create plan");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Failed to create plan");
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/plans?planId=${planId}&userId=${currentUser.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const updatedPlans = await fetchPlans();
        setPlans(updatedPlans);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Failed to delete plan");
    }
  };

  const handleDeleteVote = async (voteId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/votes?voteId=${voteId}&userId=${currentUser.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const updatedPlans = await fetchPlans();
        setPlans(updatedPlans);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete vote");
      }
    } catch (error) {
      console.error("Error deleting vote:", error);
      alert("Failed to delete vote");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/comments?commentId=${commentId}&userId=${currentUser.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const updatedPlans = await fetchPlans();
        setPlans(updatedPlans);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-8">
      <RealTimeStatus />
      <SocketDebug />
      {/* Create Poll Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create New Poll
            </h2>
            <p className="text-gray-600">
              Start a new discussion with your team
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            <span>{showCreateForm ? "Cancel" : "Create New Poll"}</span>
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreatePlan}
            className="space-y-6 bg-gray-50 rounded-xl p-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question
              </label>
              <input
                type="text"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="What would you like to ask?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-3">
                {newPlanOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOptionField(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {newPlanOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOptionField(index)}
                        className="p-3 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOptionField}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
                >
                  <Plus size={16} />
                  <span>Add Option</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={creatingPlan}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {creatingPlan ? "Creating..." : "Create Poll"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Polls Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Recent Polls</h3>
          <div className="text-sm text-gray-500">
            {plans.length} poll{plans.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* WhatsApp-styaaaaaale Polls */}
        <div className="space-y-6">
          {plans.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No polls yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Be the first to create a poll! Start a discussion with your
                  team by creating a new poll.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus size={20} />
                  <span>Create First Poll</span>
                </button>
              </div>
            </div>
          ) : (
            plans.map((plan) => {
              const totalVotes = getTotalVotes(plan.options);
              const selectedOption = selectedOptions[plan.id];
              const isCommentsOpen = showComments[plan.id];
              const hasVoted =
                plan.options?.some((option) =>
                  option.votes?.some((vote) => vote.userId === currentUser?.id)
                ) || false;
              const hasCommented =
                plan.comments?.some(
                  (comment) => comment.user?.id === currentUser?.id
                ) || false;
              const isCreator = plan.createdBy?.id === currentUser?.id;

              return (
                <div key={plan.id} className="flex justify-end">
                  {/* WhatsApp-style Poll Bubble */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-lg relative">
                    {/* Plan Creator Name at Top Right */}
                    <div className="absolute flexs top-4 left-4 text-sm text-gray-600 font-medium">
                      {plan.createdBy?.name || "Unknown"}
                      {/* Timestamp at Top Right */}
                      <div className=" text-xs text-gray-500">
                        {formatDate(plan.createdAt)}
                      </div>
                    </div>

                    {/* Delete Icon for Creator - moved to avoid overlap */}
                    {isCreator && (
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="absolute top-4 right-12 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete poll"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    {/* Poll Question */}
                    <h2 className="text-lg font-bold text-gray-900 mb-6 mt-8">
                      {plan.title}
                    </h2>

                    {/* Options */}
                    <div className="space-y-4 mb-6">
                      {plan.options?.map((option) => {
                        const isSelected = selectedOption === option.id;
                        const votePercentage = getVotePercentage(
                          option.votes,
                          totalVotes
                        );
                        const progressWidth = `${votePercentage}%`;
                        const hasUserVoted =
                          option.votes?.some(
                            (vote) => vote.userId === currentUser?.id
                          ) || false;
                        const userVote = option.votes?.find(
                          (vote) => vote.userId === currentUser?.id
                        );

                        return (
                          <div
                            key={option.id}
                            className="flex items-center space-x-4 cursor-pointer group hover:bg-gray-50 rounded-lg p-3 transition-colors"
                            onClick={() => {
                              if (hasUserVoted && userVote) {
                                // If user already voted on this option, delete the vote
                                handleDeleteVote(userVote.id);
                              } else {
                                // If user hasn't voted on this option, vote on it
                                handleVote(plan.id, option.id);
                              }
                            }}
                          >
                            {/* Radio Button */}
                            <div className="flex-shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                  hasUserVoted
                                    ? "border-green-500 bg-green-500"
                                    : isSelected
                                    ? "border-green-500"
                                    : "border-gray-400 group-hover:border-green-300"
                                }`}
                              >
                                {hasUserVoted && (
                                  <Check size={12} className="text-white" />
                                )}
                              </div>
                            </div>

                            {/* Option Content */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-900 font-medium">
                                  {option.optionText}
                                </span>
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-gray-600 font-medium">
                                    {option.votes?.length || 0}
                                  </span>
                                  {/* Profile Icons */}
                                  <div className="flex -space-x-1">
                                    {option.votes
                                      .slice(0, 3)
                                      .map((vote, index) => (
                                        <div
                                          key={vote.id}
                                          className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                                        >
                                          <span className="text-xs text-white font-bold">
                                            {vote.user?.name
                                              ?.charAt(0)
                                              .toUpperCase() || "A"}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: progressWidth }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center space-x-1">
                            <span>View votes</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              Vote Details - {plan.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {plan.options.map((option) => (
                              <div
                                key={option.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {option.optionText}
                                  </h4>
                                  <span className="text-sm text-gray-500">
                                    {option.votes.length} votes
                                  </span>
                                </div>
                                {option.votes.length > 0 ? (
                                  <div className="space-y-2">
                                    {option.votes.map((vote) => (
                                      <div
                                        key={vote.id}
                                        className="flex items-center space-x-2"
                                      >
                                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-white font-bold">
                                            {vote.user?.name
                                              ?.charAt(0)
                                              .toUpperCase() || "A"}
                                          </span>
                                        </div>
                                        <span className="text-sm text-gray-700">
                                          {vote.user?.name || "Unknown User"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    No votes yet
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      {/* Comments List */}
                      <div className="space-y-4 mb-4">
                        {!plan.comments || plan.comments.length === 0 ? (
                          <p className="text-gray-500 text-sm italic text-left py-4">
                            No comments yet. Be the first to comment!
                          </p>
                        ) : (
                          plan.comments?.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex items-start space-x-3"
                            >
                              {/* User avatar */}
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-white font-bold">
                                  {comment.user?.name
                                    ?.charAt(0)
                                    .toUpperCase() || "A"}
                                </span>
                              </div>

                              {/* Comment body */}
                              <div className="flex-1">
                                {/* User name + delete button */}
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900">
                                    {comment.user?.name || "Anonymous"}
                                  </span>
                                  {comment.user?.id === currentUser?.id && (
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>

                                {/* Fixed comment text alignment */}
                                <div>
                                  {" "}
                                  {/* Removed flex container */}
                                  <span className="text-xs text-gray-500 block mb-1">
                                    {comment.createdAt
                                      ? formatDate(comment.createdAt)
                                      : "Just now"}
                                  </span>
                                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 text-left">
                                    {comment.text}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input */}
                      {!hasCommented && (
                        <div className="flex space-x-3">
                          <input
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Write a comment..."
                            value={commentInputs[plan.id] || ""}
                            onChange={(e) =>
                              handleCommentChange(plan.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleCommentSubmit(plan.id);
                            }}
                            disabled={submitting[plan.id]}
                          />
                          <button
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 text-sm"
                            onClick={() => handleCommentSubmit(plan.id)}
                            disabled={
                              submitting[plan.id] ||
                              !commentInputs[plan.id]?.trim()
                            }
                          >
                            {submitting[plan.id] ? "..." : "Post"}
                          </button>
                        </div>
                      )}

                      {hasCommented && (
                        <p className="text-gray-500 text-sm italic text-center py-2">
                          You have already commented on this poll
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

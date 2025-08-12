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
  Settings,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/lib/socket";

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
    deletePlan,
    onPlanUpdated,
    onPlanDeleted,
    onVoteError,
    onCommentError,
    onPlanDeleteError,
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

      onPlanDeleted((data) => {
        console.log("🗑️ Plan deleted via Socket.IO:", data);
        const { planId, deletedData } = data;
        console.log(
          `🗑️ Plan ${planId} deleted with ${deletedData.optionsCount} options, ${deletedData.votesCount} votes, and ${deletedData.commentsCount} comments`
        );

        setPlans((prevPlans) => {
          const updatedPlans = prevPlans.filter((p) => p.id !== planId);
          console.log("🗑️ Removed plan from state:", planId);
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

      onPlanDeleteError((error) => {
        console.error("❌ Plan delete error:", error);
        alert(error.error || "Failed to delete plan");
      });
    }
  }, [isConnected]); // Only depend on isConnected

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
      if (isConnected) {
        // Use Socket.IO for real-time plan deletion
        console.log("🗑️ Sending plan deletion via Socket.IO");
        console.log("🗑️ Delete data:", { planId, userId: currentUser.id });

        // Join the plan room before deleting
        joinPlanRoom(planId);
        deletePlan(planId, currentUser.id);
        console.log("🗑️ Plan deletion sent via Socket.IO");
      } else {
        // Fallback to API if Socket.IO is not connected
        console.log("Socket.IO not connected, using REST API fallback");
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-xl border-b border-green-600/20 w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <Vote size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-playfair tracking-wide">
                  Krlaangy
                </h1>
                <p className="text-green-400 text-sm">
                  RTVP
                </p>
              </div>
            </div>
   
   
          </div>
        </div>
      </div>

      <main className="w-full bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Create Poll Section */}
          <Card className="bg-black/90 backdrop-blur-xl border-green-600/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Create New Poll
                  </CardTitle>
                  <CardDescription className="text-green-400">
                    Start a new discussion with your team
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                >
                  <Plus size={20} className="mr-2" />
                  {showCreateForm ? "Cancel" : "Create New Poll"}
                </Button>
              </div>
            </CardHeader>

            {showCreateForm && (
              <CardContent>
                <form
                  onSubmit={handleCreatePlan}
                  className="space-y-6 bg-black/50 rounded-xl p-6 border border-green-600/20"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="poll-question"
                      className="text-green-400 text-sm font-medium"
                    >
                      Poll Question
                    </Label>
                    <Input
                      id="poll-question"
                      type="text"
                      value={newPlanTitle}
                      onChange={(e) => setNewPlanTitle(e.target.value)}
                      className="bg-black border-green-600/30 text-white placeholder:text-green-500/50 focus:border-green-500 focus:ring-green-500/20"
                      placeholder="What would you like to ask?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-400 text-sm font-medium">
                      Options
                    </Label>
                    <div className="space-y-3">
                      {newPlanOptions.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <Input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOptionField(index, e.target.value)
                            }
                            className="flex-1 bg-black border-green-600/30 text-white placeholder:text-green-500/50 focus:border-green-500 focus:ring-green-500/20"
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          {newPlanOptions.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionField(index)}
                              className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <X size={16} />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addOptionField}
                        className="text-green-400 hover:text-green-300 border-green-600/30 hover:bg-green-600/10"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      type="submit"
                      disabled={creatingPlan}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                    >
                      {creatingPlan ? "Creating..." : "Create Poll"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="border-green-600/30 text-green-400 hover:bg-green-600/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Polls Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Recent Polls</h3>
            <Badge
              variant="secondary"
              className="bg-green-600/20 text-green-400 border-green-600/30"
            >
              {plans.length} poll{plans.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Professional Poll Cards */}
        <div className="space-y-6">
          {plans.length === 0 ? (
            <div className="text-center py-16">
              <Card className="bg-black/90 backdrop-blur-xl border-green-600/20 p-12">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No polls yet
                </h3>
                <p className="text-green-400 mb-8 max-w-md mx-auto">
                  Be the first to create a poll! Start a discussion with your
                  team by creating a new poll.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                >
                  <Plus size={20} className="mr-2" />
                  Create First Poll
                </Button>
              </Card>
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
                <Card
                  key={plan.id}
                  className="bg-black/90 backdrop-blur-xl border-green-600/20"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {plan.title}
                          </h3>
                          <p className="text-green-400 text-sm">
                            by {plan.createdBy?.name || "Unknown"} •{" "}
                            {formatDate(plan.createdAt)}
                          </p>
                        </div>
                      </div>
                      {isCreator && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          title="Delete poll"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Options */}
                    <div className="space-y-4">
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
                            className="group cursor-pointer"
                            onClick={() => {
                              if (hasUserVoted && userVote) {
                                handleDeleteVote(userVote.id);
                              } else {
                                handleVote(plan.id, option.id);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-4 p-4 rounded-lg border border-green-600/20 hover:border-green-600/40 transition-all duration-200 hover:bg-green-600/5">
                              {/* Radio Button */}
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    hasUserVoted
                                      ? "border-green-500 bg-green-500"
                                      : isSelected
                                      ? "border-green-500"
                                      : "border-green-600/50 group-hover:border-green-400"
                                  }`}
                                >
                                  {hasUserVoted && (
                                    <Check size={12} className="text-white" />
                                  )}
                                </div>
                              </div>

                              {/* Option Content */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-white font-medium">
                                    {option.optionText}
                                  </span>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm text-green-400 font-medium">
                                      {option.votes?.length || 0} votes
                                    </span>
                                    {/* Profile Icons */}
                                    <div className="flex -space-x-2">
                                      {option.votes?.slice(0, 3).map((vote) => (
                                        <div
                                          key={vote.id}
                                          className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full border-2 border-black flex items-center justify-center shadow-sm"
                                        >
                                          <span className="text-xs text-white font-bold">
                                            {vote.user?.name
                                              ?.charAt(0)
                                              .toUpperCase() || "A"}
                                          </span>
                                        </div>
                                      ))}
                                      {option.votes &&
                                        option.votes.length > 3 && (
                                          <div className="w-6 h-6 bg-green-600/50 rounded-full border-2 border-black flex items-center justify-center">
                                            <span className="text-xs text-white font-bold">
                                              +{option.votes.length - 3}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-green-600/20 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: progressWidth }}
                                  ></div>
                                </div>
                                <div className="text-xs text-green-400 mt-1">
                                  {votePercentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Votes & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-green-600/20">
                      <div className="text-sm text-green-400">
                        {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-600/30 text-green-400 hover:bg-green-600/10"
                          >
                            <Eye size={16} className="mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-green-600/20">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              Vote Details - {plan.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {plan.options?.map((option) => (
                              <div
                                key={option.id}
                                className="border border-green-600/20 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-white">
                                    {option.optionText}
                                  </h4>
                                  <span className="text-sm text-green-400">
                                    {option.votes?.length || 0} votes
                                  </span>
                                </div>
                                {option.votes && option.votes.length > 0 ? (
                                  <div className="space-y-2">
                                    {option.votes.map((vote) => (
                                      <div
                                        key={vote.id}
                                        className="flex items-center space-x-2"
                                      >
                                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-white font-bold">
                                            {vote.user?.name
                                              ?.charAt(0)
                                              .toUpperCase() || "A"}
                                          </span>
                                        </div>
                                        <span className="text-sm text-green-400">
                                          {vote.user?.name || "Unknown User"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-green-400/70 italic">
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
                    <div className="pt-4 border-t border-green-600/20">
                      <div className="space-y-4 mb-4">
                        {!plan.comments || plan.comments.length === 0 ? (
                          <p className="text-green-400/70 text-sm italic text-center py-4">
                            No comments yet. Be the first to comment!
                          </p>
                        ) : (
                          plan.comments?.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex items-start space-x-3"
                            >
                              {/* User avatar */}
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-white font-bold">
                                  {comment.user?.name
                                    ?.charAt(0)
                                    .toUpperCase() || "A"}
                                </span>
                              </div>

                              {/* Comment body */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-sm text-white">
                                    {comment.user?.name || "Anonymous"}
                                  </span>
                                  <span className="text-xs text-green-400/70">
                                    {comment.createdAt
                                      ? formatDate(comment.createdAt)
                                      : "Just now"}
                                  </span>
                                  {comment.user?.id === currentUser?.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      className="p-1 h-auto text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  )}
                                </div>
                                <div className="text-sm text-green-400 bg-green-600/10 rounded-lg p-3 border border-green-600/20">
                                  {comment.text}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input */}
                      {!hasCommented && (
                        <div className="flex space-x-3">
                          <Input
                            className="flex-1 bg-black border-green-600/30 text-white placeholder:text-green-500/50 focus:border-green-500 focus:ring-green-500/20"
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
                          <Button
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all duration-200 disabled:opacity-50"
                            onClick={() => handleCommentSubmit(plan.id)}
                            disabled={
                              submitting[plan.id] ||
                              !commentInputs[plan.id]?.trim()
                            }
                          >
                            {submitting[plan.id] ? "..." : "Post"}
                          </Button>
                        </div>
                      )}

                      {hasCommented && (
                        <p className="text-green-400/70 text-sm italic text-center py-2">
                          You have already commented on this poll
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

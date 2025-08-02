import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flag, MapPin, ThumbsUp } from "lucide-react";
import { Issue } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface IssueCardProps {
  issue: Issue;
  onUpdate: () => void;
}

export default function IssueCard({ issue, onUpdate }: IssueCardProps) {
  const { toast } = useToast();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-civic-red text-white";
      case "in_progress":
        return "bg-civic-orange text-white";
      case "resolved":
        return "bg-civic-green text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "reported":
        return "Reported";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "roads":
        return "🛣️";
      case "lighting":
        return "💡";
      case "water":
        return "💧";
      case "cleanliness":
        return "🗑️";
      case "safety":
        return "🛡️";
      case "obstructions":
        return "⚠️";
      default:
        return "📍";
    }
  };

  const flagMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/issues/${issue.id}/flag`, {
        reason: "inappropriate",
      });
    },
    onSuccess: () => {
      toast({
        title: "Issue Flagged",
        description: "Thank you for helping keep the community safe.",
      });
      onUpdate();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to flag issue",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/issues/${issue.id}/vote`);
    },
    onSuccess: () => {
      toast({
        title: "Vote Recorded",
        description: "Your vote helps prioritize community issues.",
      });
      onUpdate();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  const timeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Issue Photo */}
      {issue.photos && issue.photos.length > 0 && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={`/${issue.photos[0]}`}
            alt={issue.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>
      )}

      <CardContent className="p-4">
        {/* Status and Time */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={getStatusColor(issue.status || "reported")}>
            {getStatusLabel(issue.status || "reported")}
          </Badge>
          <span className="text-xs text-gray-500">
            {timeAgo(issue.createdAt?.toString() || "")}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {issue.title}
        </h3>

        {/* Description */}
        <div className="text-sm text-gray-600 mb-3">
          {issue.description.length > 100 && !showFullDescription ? (
            <>
              {issue.description.substring(0, 100)}...
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-civic-blue"
                onClick={() => setShowFullDescription(true)}
              >
                Read more
              </Button>
            </>
          ) : (
            issue.description
          )}
        </div>

        {/* Category and Location */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <span className="mr-1">{getCategoryIcon(issue.category)}</span>
            <span className="capitalize">{issue.category}</span>
            <MapPin className="w-3 h-3 ml-3 mr-1" />
            <span>
              {issue.address ? issue.address.substring(0, 30) : "Location provided"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => voteMutation.mutate()}
              disabled={voteMutation.isPending}
              className="flex items-center space-x-1 text-civic-blue hover:text-blue-700"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{issue.reportCount || 1}</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-civic-red">
                  <Flag className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Flag Issue</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to flag this issue as inappropriate or spam?
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => flagMutation.mutate()}
                      disabled={flagMutation.isPending}
                    >
                      {flagMutation.isPending ? "Flagging..." : "Flag Issue"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

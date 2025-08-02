import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, BarChart3, Eye, EyeOff, Shield, UserX, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Issue } from "@shared/schema";

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // Fetch flagged issues
  const { data: flaggedIssues = [], isLoading: flaggedLoading } = useQuery<Issue[]>({
    queryKey: ["/api/admin/issues/flagged"],
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalIssues: number;
    issuesByCategory: Record<string, number>;
    issuesByStatus: Record<string, number>;
  }>({
    queryKey: ["/api/admin/analytics"],
  });

  // Update issue status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      await apiRequest("PATCH", `/api/admin/issues/${id}/status`, { status, notes });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Issue status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/issues/flagged"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setSelectedIssue(null);
      setStatusNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Hide issue mutation
  const hideIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/admin/issues/${id}/hide`);
    },
    onSuccess: () => {
      toast({
        title: "Issue Hidden",
        description: "Issue has been hidden from public view.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/issues/flagged"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to hide issue",
        variant: "destructive",
      });
    },
  });

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

  return (
    <div className="min-h-screen bg-civic-surface">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-civic-red p-2 rounded-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">CivicTrack Management</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/">Back to App</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="flagged" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flagged" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Flagged Issues</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Flagged Issues Tab */}
          <TabsContent value="flagged" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Flagged Issues</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{flaggedIssues.length} issues require review</span>
              </div>
            </div>

            {flaggedLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civic-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading flagged issues...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {flaggedIssues.map((issue) => (
                  <Card key={issue.id} className="border-l-4 border-l-civic-red">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
                          <div>
                            <CardTitle className="text-lg">{issue.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(issue.status || "reported")}>
                                {getStatusLabel(issue.status || "reported")}
                              </Badge>
                              <Badge variant="destructive">
                                🚩 {issue.flagCount} flags
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {issue.description}
                      </p>
                      
                      {issue.photos && issue.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {issue.photos.slice(0, 3).map((photo, index) => (
                            <img
                              key={index}
                              src={`/${photo}`}
                              alt={`Issue photo ${index + 1}`}
                              className="w-full h-16 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>
                          {issue.reportCount || 1} reports • {issue.address || "Location provided"}
                        </span>
                        <span>
                          {new Date(issue.createdAt || "").toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedIssue(issue)}
                            >
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Issue Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">New Status</label>
                                <Select
                                  onValueChange={(value) => {
                                    if (selectedIssue) {
                                      updateStatusMutation.mutate({
                                        id: selectedIssue.id,
                                        status: value,
                                        notes: statusNotes,
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reported">Reported</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                <Textarea
                                  value={statusNotes}
                                  onChange={(e) => setStatusNotes(e.target.value)}
                                  placeholder="Add notes about the status change..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => hideIssueMutation.mutate(issue.id)}
                          disabled={hideIssueMutation.isPending}
                          className="flex items-center space-x-1"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Hide</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!flaggedLoading && flaggedIssues.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Issues</h3>
                <p className="text-gray-600">All community reports are in good standing.</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civic-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Issues */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalIssues || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Community reports
                    </p>
                  </CardContent>
                </Card>

                {/* Issues by Status */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Issues by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics?.issuesByStatus || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(status)}>
                              {getStatusLabel(status)}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Issues by Category */}
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Issues by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(analytics?.issuesByCategory || {}).map(([category, count]) => (
                        <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl mb-2">{getCategoryIcon(category)}</div>
                          <div className="font-medium capitalize">{category}</div>
                          <div className="text-2xl font-bold text-civic-blue">{count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

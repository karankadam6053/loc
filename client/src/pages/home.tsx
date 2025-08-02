import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Shield, User, Search } from "lucide-react";
import IssueCard from "@/components/IssueCard";
import IssueMap from "@/components/IssueMap";
import ReportForm from "@/components/ReportForm";
import { useQuery } from "@tanstack/react-query";
import { Issue } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState("issues");
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    radius: "5",
    search: "",
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Location access denied or failed:", error.message);
          // Fallback to demo location (San Francisco downtown)
          setLocation({ lat: 37.7749, lng: -122.4194 });
        },
        {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      // Fallback for browsers without geolocation
      setLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // Fetch nearby issues
  const { data: issues = [], isLoading, refetch } = useQuery<Issue[]>({
    queryKey: [
      "/api/issues/nearby",
      location?.lat,
      location?.lng,
      filters.radius,
      filters.category === "all" ? undefined : filters.category,
      filters.status === "all" ? undefined : filters.status,
    ],
    enabled: !!location,
  });

  const filteredIssues = issues.filter((issue) =>
    filters.search === "" ||
    issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    issue.description.toLowerCase().includes(filters.search.toLowerCase())
  );

  const categoryButtons = [
    { id: "roads", label: "Roads", icon: "🛣️", color: "text-civic-blue" },
    { id: "lighting", label: "Lighting", icon: "💡", color: "text-civic-orange" },
    { id: "water", label: "Water", icon: "💧", color: "text-blue-500" },
    { id: "cleanliness", label: "Cleanliness", icon: "🗑️", color: "text-green-500" },
    { id: "safety", label: "Safety", icon: "🛡️", color: "text-civic-red" },
    { id: "obstructions", label: "Blocked", icon: "⚠️", color: "text-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-civic-surface">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-civic-blue p-2 rounded-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CivicTrack</h1>
                <p className="text-xs text-gray-500">Downtown District</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
                <span className="absolute -mt-2 ml-2 bg-civic-red text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
              {(user as any)?.isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/admin">Admin</a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="issues" className="flex-1">
                <span className="text-base">📋 Issues</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex-1">
                <span className="text-base">🗺️ Map</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex-1">
                <span className="text-base">➕ Report</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search issues..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="lighting">Lighting</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="cleanliness">Cleanliness</SelectItem>
                      <SelectItem value="safety">Public Safety</SelectItem>
                      <SelectItem value="obstructions">Obstructions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.radius}
                    onValueChange={(value) => setFilters({ ...filters, radius: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 km</SelectItem>
                      <SelectItem value="3">3 km</SelectItem>
                      <SelectItem value="5">5 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Category Quick Access */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {categoryButtons.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      category: filters.category === category.id ? "all" : category.id,
                    })
                  }
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs font-medium">{category.label}</span>
                </Button>
              ))}
            </div>

            {/* Issues Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civic-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading issues...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} onUpdate={refetch} />
                ))}
              </div>
            )}

            {filteredIssues.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-600">No issues found in your area.</p>
                <Button
                  className="mt-4 bg-civic-blue hover:bg-blue-700"
                  onClick={() => setActiveTab("report")}
                >
                  Report the First Issue
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <IssueMap issues={filteredIssues} userLocation={location} />
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report">
            <ReportForm userLocation={location} onSuccess={refetch} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 sm:hidden">
        <div className="flex justify-around">
          <Button 
            variant={activeTab === "issues" ? "default" : "ghost"} 
            size="sm" 
            className="flex flex-col items-center py-2"
            onClick={() => setActiveTab("issues")}
          >
            <span className="text-xl mb-1">📋</span>
            <span className="text-xs">Issues</span>
          </Button>
          <Button 
            variant={activeTab === "map" ? "default" : "ghost"} 
            size="sm" 
            className="flex flex-col items-center py-2"
            onClick={() => setActiveTab("map")}
          >
            <span className="text-xl mb-1">🗺️</span>
            <span className="text-xs">Map</span>
          </Button>
          <Button 
            variant={activeTab === "report" ? "default" : "ghost"} 
            size="sm" 
            className="flex flex-col items-center py-2"
            onClick={() => setActiveTab("report")}
          >
            <span className="text-xl mb-1">➕</span>
            <span className="text-xs">Report</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center py-2"
            onClick={() => window.location.href = '/api/logout'}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

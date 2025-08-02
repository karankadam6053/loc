import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Issue } from "@shared/schema";
import { MapPin, Crosshair } from "lucide-react";

interface IssueMapProps {
  issues: Issue[];
  userLocation: { lat: number; lng: number } | null;
}

export default function IssueMap({ issues, userLocation }: IssueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "#D32F2F"; // civic-red
      case "in_progress":
        return "#F57C00"; // civic-orange
      case "resolved":
        return "#388E3C"; // civic-green
      default:
        return "#666";
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

  const statusCounts = issues.reduce((acc, issue) => {
    const status = issue.status || "reported";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    // In a real implementation, this would initialize a map library like Leaflet or Mapbox
    // For now, we simulate a map interface
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div class="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-6xl text-gray-400 mb-4">🗺️</div>
              <p class="text-gray-600 font-medium">Interactive Map View</p>
              <p class="text-sm text-gray-500 mt-2">
                ${issues.length} issues in your area
              </p>
            </div>
          </div>
          ${issues.map((issue, index) => `
            <div class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                 style="top: ${20 + (index % 3) * 25}%; left: ${25 + (index % 4) * 20}%;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                   style="background-color: ${getStatusColor(issue.status || 'reported')};"
                   title="${issue.title}">
                ${getCategoryIcon(issue.category)}
              </div>
            </div>
          `).join('')}
          ${userLocation ? `
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            </div>
          ` : ''}
        </div>
      `;
    }
  }, [issues, userLocation]);

  return (
    <Card className="overflow-hidden">
      <div ref={mapRef}></div>
      
      <CardContent className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-civic-red rounded-full mr-2"></div>
              <span>Reported ({statusCounts.reported || 0})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-civic-orange rounded-full mr-2"></div>
              <span>In Progress ({statusCounts.in_progress || 0})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-civic-green rounded-full mr-2"></div>
              <span>Resolved ({statusCounts.resolved || 0})</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    // In real implementation, this would center the map on user location
                    console.log("User location:", position.coords);
                  },
                  (error) => {
                    console.error("Error getting location:", error);
                  }
                );
              }
            }}
          >
            <Crosshair className="w-4 h-4" />
            <span>My Location</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

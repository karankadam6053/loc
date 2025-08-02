import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Flag, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-civic-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-civic-blue p-2 rounded-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CivicTrack</h1>
                <p className="text-xs text-gray-500">Empowering Communities</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-civic-blue hover:bg-blue-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Report Local Issues, Build Better Communities
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Empower citizens to easily report local issues such as road damage, garbage, and water leaks. 
            Seamlessly track the resolution of these issues and foster effortless engagement within your local community.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-civic-blue hover:bg-blue-700 px-8 py-3 text-lg"
          >
            Get Started Today
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MapPin className="w-12 h-12 text-civic-blue mx-auto mb-2" />
              <CardTitle className="text-lg">Location-Based</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Only see issues within 3-5km of your location for relevant community engagement.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Flag className="w-12 h-12 text-civic-orange mx-auto mb-2" />
              <CardTitle className="text-lg">Easy Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Report issues with photos, descriptions, and categories. Anonymous reporting supported.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-civic-green mx-auto mb-2" />
              <CardTitle className="text-lg">Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Vote on issues, flag inappropriate content, and engage with your neighbors.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-12 h-12 text-civic-red mx-auto mb-2" />
              <CardTitle className="text-lg">Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor issue resolution with status updates and transparent change logs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Issue Categories */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Supported Issue Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-civic-blue/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🛣️</span>
              </div>
              <p className="font-medium">Roads</p>
              <p className="text-xs text-gray-500">Potholes, obstructions</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-civic-orange/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💡</span>
              </div>
              <p className="font-medium">Lighting</p>
              <p className="text-xs text-gray-500">Broken lights</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💧</span>
              </div>
              <p className="font-medium">Water</p>
              <p className="text-xs text-gray-500">Leaks, low pressure</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🗑️</span>
              </div>
              <p className="font-medium">Cleanliness</p>
              <p className="text-xs text-gray-500">Overflowing bins</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-civic-red/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🛡️</span>
              </div>
              <p className="font-medium">Safety</p>
              <p className="text-xs text-gray-500">Open manholes</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="font-medium">Obstructions</p>
              <p className="text-xs text-gray-500">Fallen trees</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Make a Difference?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of citizens working together to improve their communities.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-civic-blue hover:bg-blue-700 px-8 py-3 text-lg"
          >
            Start Reporting Issues
          </Button>
        </div>
      </main>
    </div>
  );
}

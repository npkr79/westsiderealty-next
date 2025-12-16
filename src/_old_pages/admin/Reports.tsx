
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Home, 
  MessageSquare,
  Download,
  Calendar,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const reportData = {
    leads: {
      total: 234,
      growth: 12.5,
      trend: "up"
    },
    properties: {
      total: 127,
      growth: 8.3,
      trend: "up"
    },
    agents: {
      active: 23,
      growth: -2.1,
      trend: "down"
    },
    conversions: {
      rate: 18.5,
      growth: 5.2,
      trend: "up"
    }
  };

  const topAgents = [
    { name: "Rajesh Kumar", leads: 45, conversions: 12, revenue: "₹2.1 Cr" },
    { name: "Priya Sharma", leads: 38, conversions: 10, revenue: "₹1.8 Cr" },
    { name: "Amit Patel", leads: 32, conversions: 8, revenue: "₹1.5 Cr" },
    { name: "Sneha Reddy", leads: 28, conversions: 7, revenue: "₹1.2 Cr" }
  ];

  const propertyTrends = [
    { area: "Kokapet", listings: 25, avgPrice: "₹1.2 Cr", growth: 15.2 },
    { area: "Gachibowli", listings: 32, avgPrice: "₹95 L", growth: 8.7 },
    { area: "Financial District", listings: 18, avgPrice: "₹2.1 Cr", growth: -3.2 },
    { area: "Madhapur", listings: 22, avgPrice: "₹1.5 Cr", growth: 12.1 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-blue-600">{reportData.leads.total}</p>
                  <div className="flex items-center mt-2">
                    {reportData.leads.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${reportData.leads.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {reportData.leads.growth}%
                    </span>
                  </div>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Properties Listed</p>
                  <p className="text-3xl font-bold text-green-600">{reportData.properties.total}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">
                      {reportData.properties.growth}%
                    </span>
                  </div>
                </div>
                <Home className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-3xl font-bold text-purple-600">{reportData.agents.active}</p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-500">
                      {Math.abs(reportData.agents.growth)}%
                    </span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{reportData.conversions.rate}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">
                      {reportData.conversions.growth}%
                    </span>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Agents */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
              <CardDescription>Agent performance this {selectedPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-gray-600">{agent.leads} leads • {agent.conversions} conversions</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">{agent.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Market Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Property Market Trends</CardTitle>
              <CardDescription>Area-wise property performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyTrends.map((trend) => (
                  <div key={trend.area} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{trend.area}</p>
                      <p className="text-sm text-gray-600">{trend.listings} listings • Avg: {trend.avgPrice}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {trend.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${trend.growth > 0 ? "text-green-500" : "text-red-500"}`}>
                        {Math.abs(trend.growth)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;

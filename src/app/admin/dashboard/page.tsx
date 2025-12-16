
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Home, 
  TrendingUp, 
  MessageSquare, 
  Plus,
  Settings,
  BarChart3,
  UserPlus,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import AddAgentModal from "@/components/admin/AddAgentModal";

const AdminDashboard = () => {
  const [stats] = useState({
    totalProperties: 127,
    activeAgents: 23,
    totalLeads: 89,
    pendingApprovals: 5
  });

  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);

  const recentActivities = [
    { id: 1, type: 'property', message: 'New property listed in Kokapet', time: '2 hours ago' },
    { id: 2, type: 'agent', message: 'Agent Priya Sharma updated profile', time: '4 hours ago' },
    { id: 3, type: 'lead', message: 'New lead for villa in Gachibowli', time: '6 hours ago' },
    { id: 4, type: 'approval', message: 'Property approval pending review', time: '1 day ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setIsAddAgentModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
              <Link to="/admin/settings">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalProperties}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeAgents}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalLeads}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your platform efficiently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/admin/agents">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Agents
                </Button>
              </Link>
              <Link to="/admin/properties">
                <Button className="w-full justify-start" variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Review Properties
                </Button>
              </Link>
              <Link to="/admin/blog">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Blog
                </Button>
              </Link>
              <Link to="/admin/reports">
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest platform activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant={
                        activity.type === 'property' ? 'default' :
                        activity.type === 'agent' ? 'secondary' :
                        activity.type === 'lead' ? 'outline' : 'destructive'
                      }>
                        {activity.type}
                      </Badge>
                      <p className="text-sm text-gray-600">{activity.message}</p>
                    </div>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal 
        isOpen={isAddAgentModalOpen} 
        onClose={() => setIsAddAgentModalOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;

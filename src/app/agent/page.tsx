"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks, User, LogOut } from "lucide-react";
import Layout from "@/components/layout/Layout";
import AgentPerformanceCard from "@/components/agent/AgentPerformanceCard";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profile_completed?: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      loadAgentProfile(user.id);
    }
  }, [user]);

  const loadAgentProfile = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, email, phone, profile_completed")
        .eq("id", agentId)
        .single();

      if (error) throw error;

      if (data) {
        setAgentProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          profile_completed: data.profile_completed,
        });
      }
    } catch (error) {
      console.error("Error loading agent profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !agentProfile) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-semibold mb-4">Not Logged In</h1>
              <p className="text-gray-600">Please log in to access the dashboard.</p>
              <Link href="/login">
                <Button className="mt-4">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {agentProfile.name}!
                </h1>
                <p className="text-gray-600">
                  Manage your listings and profile here.
                </p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add New Property Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-start">
                <div className="text-blue-700 mb-4">
                  <Plus className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Add New Property
                </h2>
                <p className="text-gray-600 mb-4">
                  List a new property for sale or rent.
                </p>
                <Link href="/agent/add-property">
                  <Button>Add Property</Button>
                </Link>
              </CardContent>
            </Card>

            {/* My Listings Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-start">
                <div className="text-green-700 mb-4">
                  <ListChecks className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  My Listings
                </h2>
                <p className="text-gray-600 mb-4">
                  View and manage your existing property listings.
                </p>
                <Link href="/agent/listings">
                  <Button>View Listings</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Edit Profile Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-start">
                <div className="text-orange-700 mb-4">
                  <User className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Edit Profile
                </h2>
                <p className="text-gray-600 mb-4">
                  Update your profile information and settings.
                </p>
                <Link href="/agent/profile">
                  <Button>Edit Profile</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Performance Overview Card */}
            <AgentPerformanceCard agent={{ id: user.id, name: agentProfile.name }} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

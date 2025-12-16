"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PropertyData {
  id?: string;
  title: string;
  price: number;
  area: number;
  bedrooms: string;
  location: string;
  images: string[];
  status: string;
}

export default function MyListings() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyProperties = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          router.push("/login");
          return;
        }

        let query = supabase
          .from("hyderabad_properties")
          .select("*")
          .eq("agent_id", user.id);

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        const fetchedProperties = (data || []).map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          price: prop.price,
          area: prop.area_sqft || prop.area,
          bedrooms: prop.bhk_config || prop.bedrooms,
          location: prop.location,
          images: prop.image_gallery || [prop.main_image_url].filter(Boolean),
          status: prop.status || "draft",
        }));

        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: "Failed to load your properties.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyProperties();
  }, [searchQuery, router, toast, user, supabase]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const { error } = await supabase
        .from("hyderabad_properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      toast({
        title: "Property deleted",
        description: "Property has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "inactive":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else {
      return `₹${(price / 100000).toFixed(0)} L`;
    }
  };

  const safeImageSrc = (src?: string) => (src && src.trim() ? src : "/placeholder.svg");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading your properties...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/agent">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            </div>
            <Link href="/agent/add-property">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search your properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="relative">
                  <Image
                    src={safeImageSrc(property.images[0])}
                    alt={property.title}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                  <Badge
                    className="absolute top-3 left-3"
                    variant={getStatusColor(property.status) as any}
                  >
                    {property.status}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {formatPrice(property.price)}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <span>{property.area} sq ft</span>
                    <span>{property.bedrooms}</span>
                    <span className="col-span-2">{property.location}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Link
                        href={`/agent/edit-property/${property.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/property/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="text-center py-12">
            <CardContent>
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "No properties match your search."
                  : "Start by adding your first property listing"}
              </p>
              <Link href="/agent/add-property">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

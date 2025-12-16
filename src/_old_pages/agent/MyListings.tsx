
import { useState, useEffect } from "react";
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
  MoreVertical,
  Home
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { propertyService, userService } from "@/services";
import type { PropertyData } from "@/services";
import { useToast } from "@/hooks/use-toast";

const MyListings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyProperties = async () => {
      setIsLoading(true);
      try {
        const currentUser = userService.getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }

        const filters = {
          agentId: currentUser.id,
          searchQuery: searchQuery || undefined
        };

        const fetchedProperties = await propertyService.getProperties(filters);
        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: "Failed to load your properties.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyProperties();
  }, [searchQuery, navigate, toast]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      await propertyService.deleteProperty(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      toast({
        title: "Property deleted",
        description: "Property has been successfully deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else {
      return `₹${(price / 100000).toFixed(0)} L`;
    }
  };

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
              <Link to="/agent/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            </div>
            <Link to="/agent/add-property">
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
                  <img 
                    src={property.images[0] || "/placeholder.svg"} 
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge 
                    className="absolute top-3 left-3" 
                    variant={getStatusColor(property.status)}
                  >
                    {property.status}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{property.title}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(property.price)}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <span>{property.area} sq ft</span>
                    <span>{property.bedrooms}</span>
                    <span className="col-span-2">{property.location}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Link to={`/agent/edit-property/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/property/${property.id}`} className="flex-1">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? "No properties match your search." : "Start by adding your first property listing"}
              </p>
              <Link to="/agent/add-property">
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
};

export default MyListings;

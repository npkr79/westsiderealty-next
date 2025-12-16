import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Plus,
  Upload
} from "lucide-react";
import { Link } from "react-router-dom";
import { locationPropertyService } from "@/services/locationPropertyService";
import { goaHolidayPropertyService } from "@/services/goaHolidayPropertyService";
import { toast } from "sonner";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import BulkPropertyUploadUpdate from "@/components/admin/BulkPropertyUploadUpdate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddGoaPropertyModal } from "@/components/admin/AddGoaPropertyModal";
import { GoaSEOContentGenerator } from "@/components/admin/GoaSEOContentGenerator";

const Properties = () => {
  const [addGoaPropertyOpen, setAddGoaPropertyOpen] = useState(false);
  const [editGoaProperty, setEditGoaProperty] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; property: any | null }>({
    isOpen: false,
    property: null,
  });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      
      // Load Hyderabad and Dubai properties (Goa excluded from locationPropertyService)
      const regularProps = await locationPropertyService.getAllPropertiesForAdmin();
      const nonGoaProps = regularProps.filter(p => {
        const location = locationPropertyService.getPropertyLocation(p);
        return location !== 'goa';
      });
      
      // Load all Goa properties from goa_holiday_properties ONLY
      const goaHolidayProps = await goaHolidayPropertyService.getProperties({});
      
      // Merge and mark source
      const allProperties = [
        ...nonGoaProps.map((p: any) => ({ ...p, _source: 'regular' })),
        ...goaHolidayProps.map((p: any) => ({ ...p, _source: 'goa_holiday', _location: 'goa', slug: p.seo_slug || p.id }))
      ];
      
      setProperties(allProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'sold': return 'destructive';
      default: return 'outline';
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.property) return;
    
    setIsDeleting(true);
    try {
      const property = deleteModal.property;
      
      if ((property as any)._source === 'goa_holiday') {
        await goaHolidayPropertyService.deleteProperty(property.id);
      } else {
        const location = locationPropertyService.getPropertyLocation(property);
        await locationPropertyService.deleteProperty(property.id, location);
      }
      
      toast.success('Property deleted successfully');
      setDeleteModal({ isOpen: false, property: null });
      loadProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle status comparison (normalize to lowercase for comparison)
    const propertyStatus = property.status?.toLowerCase();
    const matchesStatus = statusFilter === 'all' || propertyStatus === statusFilter || 
                          (statusFilter === 'active' && propertyStatus === 'active') ||
                          (statusFilter === 'inactive' && propertyStatus === 'draft');
    
    // Get location - for goa_holiday properties, it's marked in _location
    const propertyLocation = property._location || locationPropertyService.getPropertyLocation(property);
    const matchesCity = cityFilter === 'all' || propertyLocation === cityFilter;
    
    return matchesSearch && matchesStatus && matchesCity;
  });

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
              <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setAddGoaPropertyOpen(true)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goa Property
              </Button>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="goa">Goa</SelectItem>
                  <SelectItem value="dubai">Dubai</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              
              <Link to="/admin/add-property">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Bulk Upload/Update Component */}
        <div className="mb-6">
          <BulkPropertyUploadUpdate onUploadComplete={loadProperties} />
        </div>

        {/* Goa SEO Content Generator */}
        <div className="mb-6">
          <GoaSEOContentGenerator />
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-8">Loading properties...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const propertyLocation = property._location || locationPropertyService.getPropertyLocation(property);
              return (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative">
                    <img 
                      src={(property as any).main_image_url || (property as any).hero_image_url || "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=300&h=200&fit=crop"} 
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant={getStatusColor(property.status)}>
                        {property.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize bg-white">
                        {propertyLocation}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold line-clamp-2 mb-2">{property.title}</h3>
                    {property._source === 'goa_holiday' && (
                      <Badge className="mb-2 bg-blue-500 hover:bg-blue-600">Goa Holiday</Badge>
                    )}
                    <p className="text-2xl font-bold text-primary mb-2">
                      {property.price_display || `₹${property.price?.toLocaleString()}`}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      <span>{property.area_sqft || property.sq_ft} sq ft</span>
                      <span>{property.bedrooms} Beds</span>
                      <span className="col-span-2 truncate">{property.location || 'No location'}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Link 
                        to={`/properties/${propertyLocation}/${property.slug}`} 
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {property._source === 'goa_holiday' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setEditGoaProperty(property)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <Link 
                          to={`/admin/edit-property/${property.id}?location=${propertyLocation}`} 
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDeleteModal({ isOpen: true, property })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, property: null })}
        onConfirm={handleDelete}
        propertyTitle={deleteModal.property?.title || ''}
        propertyImage={deleteModal.property?.main_image_url}
        isDeleting={isDeleting}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />

      {/* Add Goa Property Modal */}
      <AddGoaPropertyModal
        isOpen={addGoaPropertyOpen}
        onClose={() => setAddGoaPropertyOpen(false)}
        onSuccess={() => {
          setAddGoaPropertyOpen(false);
          loadProperties();
          toast.success('Goa property added successfully!');
        }}
      />

      {/* Edit Goa Property Modal */}
      {editGoaProperty && (
        <AddGoaPropertyModal
          key={editGoaProperty.id}
          isOpen={!!editGoaProperty}
          onClose={() => setEditGoaProperty(null)}
          onSuccess={() => {
            setEditGoaProperty(null);
            loadProperties();
            toast.success('Goa property updated successfully!');
          }}
          property={editGoaProperty}
        />
      )}
    </div>
  );
};

export default Properties;

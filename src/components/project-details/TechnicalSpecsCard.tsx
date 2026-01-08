import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Home, 
  Layers, 
  Key, 
  Building, 
  Eye, 
  Car 
} from "lucide-react";

interface SpecItem {
  label: string;
  value: string | number;
  icon?: string;
}

interface TechnicalSpecsCardProps {
  projectSnapshot?: any;
}

const iconMap: Record<string, React.ReactNode> = {
  status: <Building2 className="h-5 w-5" />,
  units: <Home className="h-5 w-5" />,
  area: <Layers className="h-5 w-5" />,
  ownership: <Key className="h-5 w-5" />,
  towers: <Building className="h-5 w-5" />,
  floors: <Building className="h-5 w-5" />,
  view: <Eye className="h-5 w-5" />,
  parking: <Car className="h-5 w-5" />,
};

export default function TechnicalSpecsCard({ projectSnapshot }: TechnicalSpecsCardProps) {
  if (!projectSnapshot) return null;

  // Handle different formats
  let specs: SpecItem[] = [];
  
  if (Array.isArray(projectSnapshot)) {
    specs = projectSnapshot.map((item: any) => ({
      label: item.label || item.name || "",
      value: item.value || item.text || "",
      icon: item.icon || "",
    })).filter((item: SpecItem) => item.label && item.value);
  } else if (typeof projectSnapshot === 'object') {
    // Extract common fields from object
    const commonFields = [
      { key: 'status', label: 'Project Status' },
      { key: 'total_units', label: 'No. of Units' },
      { key: 'project_area', label: 'Project Area' },
      { key: 'ownership', label: 'Ownership' },
      { key: 'total_towers', label: 'Towers' },
      { key: 'total_floors', label: 'Floors' },
      { key: 'property_view', label: 'Property View' },
      { key: 'parking', label: 'Parking' },
    ];

    specs = commonFields
      .map((field): SpecItem | null => {
        const value = projectSnapshot[field.key] || projectSnapshot[field.key.toLowerCase()];
        if (!value) return null;
        return {
          label: field.label,
          value: String(value),
          icon: field.key.toLowerCase(),
        };
      })
      .filter((item): item is SpecItem => item !== null);
  }

  if (specs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specs.map((spec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="text-primary flex-shrink-0">
                {iconMap[spec.icon?.toLowerCase() || 'building'] || <Building2 className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground">{spec.label}</div>
                <div className="text-base font-semibold text-foreground mt-1">{spec.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

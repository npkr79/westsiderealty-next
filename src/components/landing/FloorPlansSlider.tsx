"use client";

interface FloorPlan {
  title?: string;
  imageUrl?: string;
  image_url?: string;
  plan_title?: string;
  [key: string]: any; // Allow additional properties from LandingPageFloorPlan
}

interface FloorPlansSliderProps {
  floorPlans?: FloorPlan[] | any[];
  isUltraLuxury?: boolean;
  onImageClick?: (images: string[], initialIndex: number) => void | ((index: number) => void);
}

export default function FloorPlansSlider({ floorPlans, isUltraLuxury, onImageClick }: FloorPlansSliderProps) {
  if (!floorPlans || floorPlans.length === 0) return null;

  // Normalize floor plans to handle different formats
  const normalizedPlans = floorPlans.map((plan: any) => ({
    title: plan.title || plan.plan_title || plan.name,
    imageUrl: plan.imageUrl || plan.image_url || plan.image,
  }));

  return (
    <section className="py-8">
      <div className="container mx-auto max-w-5xl px-4 space-y-4">
        <h2 className="text-2xl font-bold">Floor Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {normalizedPlans.map((plan, idx) => (
            <div 
              key={idx} 
              className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                if (onImageClick) {
                  // Check if it expects (images, index) or just (index)
                  if (onImageClick.length === 2) {
                    const imageUrls = normalizedPlans.map(p => p.imageUrl).filter(Boolean) as string[];
                    (onImageClick as unknown as (images: string[], initialIndex: number) => void)(imageUrls, idx);
                  } else {
                    (onImageClick as unknown as (index: number) => void)(idx);
                  }
                }
              }}
            >
              {plan.imageUrl && (
                // Using regular img here; landing pages are client components, and these images are likely from Supabase
                <img
                  src={plan.imageUrl}
                  alt={plan.title || `Floor plan ${idx + 1}`}
                  className="mb-2 h-40 w-full rounded-md object-cover"
                />
              )}
              {plan.title && (
                <p className="text-sm font-medium text-foreground">{plan.title}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



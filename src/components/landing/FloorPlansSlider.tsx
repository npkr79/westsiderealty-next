"use client";

interface FloorPlan {
  title?: string;
  imageUrl?: string;
}

interface FloorPlansSliderProps {
  floorPlans?: FloorPlan[];
}

export default function FloorPlansSlider({ floorPlans }: FloorPlansSliderProps) {
  if (!floorPlans || floorPlans.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto max-w-5xl px-4 space-y-4">
        <h2 className="text-2xl font-bold">Floor Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {floorPlans.map((plan, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-3">
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



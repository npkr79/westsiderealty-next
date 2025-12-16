import { CheckCircle2, Building2, MapPin, Calendar, Shield } from 'lucide-react';

interface TrustStripProps {
  reraId?: string | null;
  developerName?: string | null;
  developerYears?: number | null;
  landArea?: string | null;
  keyFeature?: string | null;
  possession?: string | null;
}

export default function TrustStrip({
  reraId,
  developerName,
  developerYears,
  landArea,
  keyFeature,
  possession
}: TrustStripProps) {
  const trustItems = [
    reraId && { icon: Shield, text: `RERA ${reraId}` },
    developerName && developerYears && { icon: Building2, text: `${developerName} ${developerYears}+ Years` },
    landArea && { icon: MapPin, text: landArea },
    keyFeature && { icon: CheckCircle2, text: keyFeature },
    possession && { icon: Calendar, text: `Possession ${possession}` }
  ].filter(Boolean) as { icon: typeof CheckCircle2; text: string }[];

  if (trustItems.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mt-8 relative z-10 px-4 md:px-6 lg:px-8">
      <div className="inline-flex items-center gap-3 md:gap-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/50 dark:to-blue-950/50 p-3 md:p-4 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20 min-w-max">
        {trustItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-emerald-800 dark:text-emerald-300 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

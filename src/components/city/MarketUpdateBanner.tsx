"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, ExternalLink } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface MarketUpdateBannerProps {
  citySlug: string;
  microMarketSlug?: string;
}

interface MarketUpdate {
  date?: string;
  title?: string;
  content?: string;
  neopolis_update?: string;
  latest_news?: string;
  infographic_url?: string;
}

export default function MarketUpdateBanner({
  citySlug,
  microMarketSlug,
}: MarketUpdateBannerProps) {
  const [update, setUpdate] = useState<MarketUpdate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdate = async () => {
      try {
        const supabase = createClient();
        // Try to fetch from a market_updates table or use city data
        const { data, error } = await supabase
          .from('cities')
          .select('market_update_json')
          .eq('url_slug', citySlug)
          .maybeSingle();

        if (!error && data?.market_update_json) {
          setUpdate(data.market_update_json as MarketUpdate);
        }
      } catch (error) {
        console.error('Error fetching market update:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug === 'hyderabad') {
      fetchUpdate();
    } else {
      setLoading(false);
    }
  }, [citySlug]);

  if (loading) return null;

  // Default content for Hyderabad if no data
  const defaultUpdate: MarketUpdate = {
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    title: "Weekly Market Update",
    neopolis_update: "Neopolis auction updates: Plot prices range from ₹15,000-25,000/sqft",
    latest_news: "Latest real estate trends and investment opportunities",
    infographic_url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/news-images/weekly-market-update.jpg"
  };

  const displayUpdate = update || (citySlug === 'hyderabad' ? defaultUpdate : null);

  if (!displayUpdate) return null;

  return (
    <section className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-y border-amber-200 py-6">
      <div className="container mx-auto px-4">
        <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Date Badge */}
              {displayUpdate.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-700" />
                  <Badge variant="outline" className="border-amber-300 text-amber-900">
                    {displayUpdate.date}
                  </Badge>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-700" />
                  <h3 className="font-semibold text-amber-900">
                    {displayUpdate.title || "Weekly Market Update"}
                  </h3>
                </div>
                
                {displayUpdate.neopolis_update && (
                  <p className="text-sm text-amber-900">
                    <strong>Neopolis:</strong> {displayUpdate.neopolis_update}
                  </p>
                )}
                
                {displayUpdate.latest_news && (
                  <p className="text-sm text-amber-800">
                    {displayUpdate.latest_news}
                  </p>
                )}
              </div>

              {/* Infographic */}
              {displayUpdate.infographic_url && (
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border border-amber-200">
                  <Image
                    src={displayUpdate.infographic_url}
                    alt="Market Update Infographic"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}




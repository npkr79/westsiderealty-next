import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, TrendingUp } from "lucide-react";

interface City {
  id: string;
  city_name: string;
  country: string;
  average_price_sqft: number;
  hero_hook: string;
}

interface MicroMarket {
  id: string;
  micro_market_name: string;
  city_id: string;
}

interface Developer {
  id: string;
  developer_name: string;
}

interface MarketDeveloper {
  developer_id: string;
  market_id: string;
}

export default function CityExplorer() {
  const navigate = useNavigate();
  const [currentCityId, setCurrentCityId] = useState<string>("");
  const [cities, setCities] = useState<City[]>([]);
  const [allMicroMarkets, setAllMicroMarkets] = useState<MicroMarket[]>([]);
  const [allDevelopers, setAllDevelopers] = useState<Developer[]>([]);
  const [marketDevelopers, setMarketDevelopers] = useState<MarketDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [citiesRes, marketsRes, devsRes, marketDevsRes] = await Promise.all([
          supabase.from("cities").select("*").order("city_name"),
          supabase.from("micro_markets").select("*"),
          supabase.from("developers").select("*").order("developer_name"),
          supabase.from("market_developers").select("*"),
        ]);

        if (citiesRes.data) setCities(citiesRes.data);
        if (marketsRes.data) setAllMicroMarkets(marketsRes.data);
        if (devsRes.data) setAllDevelopers(devsRes.data);
        if (marketDevsRes.data) setMarketDevelopers(marketDevsRes.data);

        // Set default city (Hyderabad)
        if (citiesRes.data && citiesRes.data.length > 0) {
          setCurrentCityId(citiesRes.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentCity = cities.find((c) => c.id === currentCityId);
  const cityMicroMarkets = allMicroMarkets.filter((mm) => mm.city_id === currentCityId);
  const topMicroMarkets = cityMicroMarkets.slice(0, 5);

  // Get developers active in current city's micro-markets
  const cityMicroMarketIds = cityMicroMarkets.map((mm) => mm.id);
  const activeDeveloperIds = new Set(
    marketDevelopers
      .filter((md) => cityMicroMarketIds.includes(md.market_id))
      .map((md) => md.developer_id)
  );
  const cityDevelopers = allDevelopers
    .filter((dev) => activeDeveloperIds.has(dev.id))
    .slice(0, 6);

  const stats = {
    totalMicroMarkets: cityMicroMarkets.length,
    avgPriceSqft: currentCity?.average_price_sqft || 0,
    topDevelopers: cityDevelopers.length,
  };

  const handleMicroMarketClick = (microMarketName: string) => {
    if (!currentCity) return;
    
    const cityRoute = `/${currentCity.city_name.toLowerCase()}`;
    const params = new URLSearchParams({ microMarket: microMarketName });
    navigate(`${cityRoute}?${params.toString()}`);
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const getColor = (index: number) => {
    const colors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-indigo-600",
      "bg-cyan-600",
      "bg-emerald-600",
      "bg-teal-600",
      "bg-amber-600",
      "bg-orange-600",
      "bg-rose-600",
      "bg-pink-600",
      "bg-fuchsia-600",
      "bg-violet-600",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>City Explorer - Premium Real Estate Across Hyderabad, Goa & Dubai</title>
        <meta
          name="description"
          content="Explore luxury real estate opportunities across Hyderabad, Goa, and Dubai. Discover top micro-markets, premium developers, and investment insights."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white antialiased">
        {/* Header Section */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 mb-4">
              <Building2 className="w-10 h-10 text-cyan-400" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Real Estate Explorer
              </h1>
            </div>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              {currentCity?.hero_hook || "Discover premium properties across India's fastest-growing cities"}
            </p>
          </div>
        </header>

        {/* City Tabs Navigation */}
        <nav className="container mx-auto px-4 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-2 max-w-2xl mx-auto border border-white/10">
            <div className="flex justify-around items-center gap-2">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setCurrentCityId(city.id)}
                  className={`flex-1 px-4 md:px-6 py-3 font-semibold rounded-xl transition-all duration-300 ${
                    currentCityId === city.id
                      ? "text-white border-2 border-cyan-400 bg-cyan-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <span className="block md:hidden">{city.city_name.substring(0, 3).toUpperCase()}</span>
                  <span className="hidden md:block">{city.city_name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content Container */}
        <main className="container mx-auto px-4 pb-16">
          {/* Statistics Cards Section */}
          <section className="mb-12 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Card 1: Total Micro-Markets */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                <div className="text-4xl md:text-5xl font-extrabold text-cyan-400">{stats.totalMicroMarkets}</div>
                <div className="text-gray-400 mt-2 text-sm md:text-base">Micro-Markets</div>
              </div>

              {/* Card 2: Avg Price/SqFt */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                <div className="text-4xl md:text-5xl font-extrabold text-amber-400">
                  {currentCity?.country === "UAE" ? "AED" : "₹"} {stats.avgPriceSqft.toLocaleString()}
                </div>
                <div className="text-gray-400 mt-2 text-sm md:text-base">Avg. Price/Sq.Ft</div>
              </div>

              {/* Card 3: Top Developers */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                <div className="text-4xl md:text-5xl font-extrabold text-emerald-400">{stats.topDevelopers}+</div>
                <div className="text-gray-400 mt-2 text-sm md:text-base">Top Developers</div>
              </div>
            </div>
          </section>

          {/* Micro-Markets List Section */}
          <section className="mb-12 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Top Micro-Markets</h2>
              <span className="text-cyan-400 text-sm md:text-base">Most Active</span>
            </div>
            <div className="space-y-3">
              {topMicroMarkets.length > 0 ? (
                topMicroMarkets.map((mm, index) => (
                  <div
                    key={mm.id}
                    onClick={() => handleMicroMarketClick(mm.micro_market_name)}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-5 hover:bg-white/10 transition-all transform hover:scale-105 cursor-pointer border border-white/10 animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                          {index + 1}
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white">{mm.micro_market_name}</h3>
                      </div>
                      <span className="bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                        Active Location
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">No micro-markets available for this city.</p>
              )}
            </div>
          </section>

          {/* Featured Developers Section */}
          <section className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Featured Developers</h2>
              <span className="text-amber-400 text-sm md:text-base">Premium Partners</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {cityDevelopers.length > 0 ? (
                cityDevelopers.map((dev, index) => (
                  <div
                    key={dev.id}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/10 transition-all transform hover:scale-110 cursor-pointer border border-white/10 animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`${getColor(index)} w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg`}
                    >
                      {getInitial(dev.developer_name)}
                    </div>
                    <h3 className="text-white font-semibold text-sm md:text-base">{dev.developer_name}</h3>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8 col-span-full">No developers available for this city.</p>
              )}
            </div>
          </section>
        </main>

        {/* Footer Section */}
        <footer className="container mx-auto px-4 py-8 mt-12 border-t border-white/10">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Explore premium real estate opportunities across multiple cities</p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-semibold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all transform hover:scale-105"
            >
              Contact Our Advisors
            </a>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

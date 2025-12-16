import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin, TrendingUp, Shield, Clock, Award, Building2, Maximize2, Sun, Users, Zap, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/common/SEO";
import { toast } from "@/hooks/use-toast";
import { kollurLeadService } from "@/services/kollurLeadService";

interface KollurContent {
  hero_image_url: string;
  hero_subtitle: string;
  hero_title: string;
  hero_title_highlight: string;
  hero_description: string;
  hero_cta_text: string;
  valuation_title: string;
  valuation_subtitle: string;
  launch_price_per_sqft: number;
  resale_price_per_sqft: number;
  appreciation_percentage: number;
  possession_months: number;
  possession_quarter: string;
  positioning_title: string;
  positioning_subtitle: string;
  orr_distance: string;
  orr_connectivity: string;
  infrastructure_description: string;
  growth_corridor_description: string;
  proximity_data: Array<{ label: string; distance: string }>;
  landowner_title: string;
  landowner_description: string;
  landowner_detail: string;
  cta_badge_text: string;
  cta_title: string;
  cta_description: string;
  cta_primary_button: string;
  cta_secondary_button: string;
  cta_hours_info: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

const KollurInvestment = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [content, setContent] = useState<KollurContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    requirements_message: ""
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from("kollur_investment_content")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const content = data as any;
        setContent({
          ...content,
          proximity_data: content.proximity_data as Array<{ label: string; distance: string }>
        });
      }
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      await kollurLeadService.submitLead(formData);
      
      toast({
        title: "Success!",
        description: "Your request has been submitted. We'll contact you shortly.",
      });

      setFormData({
        full_name: "",
        email: "",
        phone: "",
        requirements_message: ""
      });
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const jsonLdRealEstate = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": "Pre Launch Kollur Investment 2025 | Direct Landowner ORR Hyderabad",
    "description": content.seo_description,
    "url": "https://www.westsiderealty.in/kollur-investment",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kollur",
      "addressRegion": "Hyderabad",
      "addressCountry": "IN"
    },
    "offers": {
      "@type": "Offer",
      "price": content.launch_price_per_sqft,
      "priceCurrency": "INR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": content.launch_price_per_sqft,
        "priceCurrency": "INR",
        "unitText": "per square foot"
      },
      "availability": "https://schema.org/PreOrder",
      "validFrom": new Date().toISOString()
    }
  };

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Westside Realty",
    "url": "https://www.westsiderealty.in",
    "logo": "https://www.westsiderealty.in/lovable-uploads/remax-logo.jpg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXX-XXX-XXXX",
      "contactType": "Sales",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi", "Telugu"]
    }
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.westsiderealty.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Kollur Investment Opportunity",
        "item": "https://www.westsiderealty.in/kollur-investment"
      }
    ]
  };

  return (
    <>
      <SEO 
        title="Pre Launch Kollur Investment 2025 | ₹4,000/sft ORR Hyderabad | Direct Landowner"
        description="Exclusive pre-launch Kollur investment at ₹4,000/sft on Outer Ring Road Hyderabad. Direct landowner opportunity with 47% early-bird advantage. Limited access - enquire now!"
        keywords={content.seo_keywords}
        canonicalUrl="https://www.westsiderealty.in/kollur-investment"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [jsonLdRealEstate, jsonLdOrganization, jsonLdBreadcrumb]
        }}
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[90vh] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={content.hero_image_url || "/lovable-uploads/tribhuja-hero.jpg"}
              alt="Pre-launch Kollur real estate investment opportunity on ORR Hyderabad with direct landowner advantage"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
          </div>
          
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
            <div className="max-w-3xl">
              <div className="text-yellow-400 text-sm font-semibold tracking-widest mb-4">
                {content.hero_subtitle}
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Pre Launch Kollur Investment at <span className="text-yellow-400">₹4,000/sft</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
                {content.hero_description.split('.')[0]}.<br />
                <span className="text-primary font-semibold">{content.hero_description.split('.')[1]}.</span>
              </p>
              <Button 
                size="lg" 
                onClick={() => setIsFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
              >
                <Phone className="mr-2 h-5 w-5" />
                {content.hero_cta_text}
              </Button>
            </div>
          </div>
        </section>

        {/* The Valuation Advantage */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              47% Early-Bird Investment Advantage in Kollur
            </h2>
            <p className="text-center text-muted-foreground mb-16 text-lg">
              {content.valuation_subtitle}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="pt-8 pb-8 text-center">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-primary mb-2">₹{content.launch_price_per_sqft.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mb-4">per sft early investment price</div>
                  <div className="text-2xl font-semibold mb-2">vs ₹{content.resale_price_per_sqft.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Phase 1 launch price</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="pt-8 pb-8 text-center">
                  <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-primary mb-2">{content.appreciation_percentage}%</div>
                  <div className="text-sm text-muted-foreground mb-4">price appreciation vs Phase 1</div>
                  <div className="text-2xl font-semibold mb-2">Smart Early-Bird</div>
                  <p className="text-sm text-muted-foreground">Advantage</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="pt-8 pb-8 text-center">
                  <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-primary mb-2">{content.possession_months} Months</div>
                  <div className="text-sm text-muted-foreground mb-4">possession timeline</div>
                  <div className="text-2xl font-semibold mb-2">{content.possession_quarter}</div>
                  <p className="text-sm text-muted-foreground">strategic hold period</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Exclusive Project Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h3 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Exclusive Project Features: Defining Ultra-Luxury High-Rise Living
            </h3>
            <p className="text-center text-muted-foreground mb-12 text-lg max-w-4xl mx-auto">
              Discover an unparalleled residential opportunity designed for exclusivity, space, and superior investment potential. Our project establishes a new benchmark for premium high-rise living, featuring low-density structures and world-class design standards that maximize natural light and privacy.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              {/* Architecture & Design Excellence */}
              <div>
                <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  Signature Architecture & Design Excellence
                </h4>
                <p className="text-muted-foreground mb-6">
                  The project's architecture is rooted in spaciousness and intelligent design, ensuring a superior quality of life for every resident. Designed by an international architecture company, every detail promotes comfort and elegance.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Sky-High Structures</p>
                      <p className="text-sm text-muted-foreground">Four magnificent towers, each soaring Ground + 37 floors, defining the city skyline with breathtaking panoramic views.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Low-Density Advantage</p>
                      <p className="text-sm text-muted-foreground">Maximum exclusivity with only four spacious flats per floor, fostering a quiet and private community environment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Maximize2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Expansive Residences</p>
                      <p className="text-sm text-muted-foreground">Ranging from 1700 to 3195 square feet, designed to accommodate families seeking voluminous, contemporary living spaces.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Architectural Privacy</p>
                      <p className="text-sm text-muted-foreground">20-foot wide corridor distance between flats, significantly enhancing privacy and minimizing noise transfer.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sun className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Maximum Natural Light</p>
                      <p className="text-sm text-muted-foreground">All units meticulously designed to ensure maximum sunlight and ventilation throughout the day.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Enhanced Vertical Mobility</p>
                      <p className="text-sm text-muted-foreground">High-speed elevators ensure quick and efficient floor access at all times.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Investment Security */}
              <div>
                <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-primary" />
                  Strategic Location & Investment Security
                </h4>
                <p className="text-muted-foreground mb-6">
                  This project is not just a home; it is a secured, high-growth investment positioned in a prime real estate micro-market with exceptional liquidity.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Premium Neighborhood</p>
                      <p className="text-sm text-muted-foreground">Strategically located adjacent to established ultra-luxury developments, including My Home and Rajapushpa projects, securing its position within an exclusive residential corridor.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Guaranteed Appreciation</p>
                      <p className="text-sm text-muted-foreground">Prime location advantage and low-density design ensure strong future appreciation potential exceeding current market trends.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Flexible Investment Exit</p>
                      <p className="text-sm text-muted-foreground">Exceptional liquidity clause allowing investors the flexibility to exit the investment anytime after 18 months, providing financial agility and minimizing lock-in risk.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Positioning */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prime ORR Hyderabad Location with Infrastructure Maturity
            </h2>
            <p className="text-muted-foreground mb-12 text-lg">
              {content.positioning_subtitle}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <div className="flex items-start mb-6">
                  <MapPin className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-semibold mb-2">ORR Access</h4>
                    <p className="text-muted-foreground">
                      {content.orr_distance}. {content.orr_connectivity}
                    </p>
                  </div>
                </div>

                <div className="flex items-start mb-6">
                  <MapPin className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Infrastructure Maturity</h4>
                    <p className="text-muted-foreground">
                      {content.infrastructure_description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Growth Corridor</h4>
                    <p className="text-muted-foreground">
                      {content.growth_corridor_description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-8 rounded-lg">
                <h4 className="text-2xl font-bold mb-6">Proximity Advantages</h4>
                <div className="space-y-4">
                  {content.proximity_data.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex justify-between items-center ${index < content.proximity_data.length - 1 ? 'border-b border-border pb-3' : ''}`}
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Direct Landowner Advantage */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Direct Landowner Deal - Zero Middlemen, Maximum Value
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {content.landowner_description}
            </p>
            <div className="bg-background p-8 rounded-lg shadow-lg">
              <p className="text-lg text-muted-foreground">
                {content.landowner_detail}
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-muted/30 border-t border-primary/20">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              {content.cta_badge_text}
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Secure Your Pre Launch Kollur Investment Today
            </h3>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {content.cta_description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setIsFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
              >
                <Phone className="mr-2 h-5 w-5" />
                {content.cta_primary_button}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setIsFormOpen(true)}
                className="border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6 h-auto"
              >
                {content.cta_secondary_button}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {content.cta_hours_info}
            </p>
          </div>
        </section>

        {/* Contact Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full p-8 relative">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
              <h4 className="text-2xl font-bold mb-6">Request Access</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name *" 
                  className="w-full p-3 border border-border rounded-md bg-background"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number *" 
                  className="w-full p-3 border border-border rounded-md bg-background"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email Address *" 
                  className="w-full p-3 border border-border rounded-md bg-background"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <select 
                  className="w-full p-3 border border-border rounded-md bg-background"
                  value={formData.requirements_message}
                  onChange={(e) => setFormData({ ...formData, requirements_message: e.target.value })}
                >
                  <option value="">Investment Timeline</option>
                  <option value="Immediate (within 30 days)">Immediate (within 30 days)</option>
                  <option value="Near-term (1-3 months)">Near-term (1-3 months)</option>
                  <option value="Researching (3+ months)">Researching (3+ months)</option>
                </select>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default KollurInvestment;

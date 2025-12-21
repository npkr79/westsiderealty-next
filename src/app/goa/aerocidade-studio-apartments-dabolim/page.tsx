import { Metadata } from "next";
import { JsonLd } from "@/components/common/SEO";
import { buildMetadata } from "@/components/common/SEO";
import AerocidadeHero from "@/components/goa-property/AerocidadeHero";
import InvestmentHighlights from "@/components/goa-property/InvestmentHighlights";
import PriceTable from "@/components/goa-property/PriceTable";
import LocationAdvantages from "@/components/goa-property/LocationAdvantages";
import DeveloperSection from "@/components/goa-property/DeveloperSection";
import SouthGoaComparison from "@/components/goa-property/SouthGoaComparison";
import AerocidadeFAQ from "@/components/goa-property/AerocidadeFAQ";
import AmenitiesGrid from "@/components/goa-property/AmenitiesGrid";
import StickyCTA from "@/components/goa-property/StickyCTA";

// Project Data
const projectData = {
  projectName: "Aerocidade",
  tagline: "Vive la Goa",
  headline: "Premium Studio Apartments Near Dabolim International Airport, Goa",
  subheadline: "Invest Where the World Vacations – A blend of holiday comfort & profitable investment",
  
  developer: {
    name: "Devika Group",
    legacy: "70+ Years of Building Excellence Since 1954",
    stats: {
      areaDelivered: "6+ Million Sq. Ft.",
      happyCustomers: "14,000+",
      yearsLegacy: "71 Years",
      projectsDelivered: "46+"
    },
    locations: "Delhi, Uttar Pradesh, Goa"
  },
  
  location: {
    micromarket: "Dabolim",
    city: "Goa",
    district: "South Goa",
    taluka: "Mormugao",
    coordinates: {
      lat: 15.3818,
      lng: 73.8301
    }
  },
  
  unitConfig: {
    type: "Studio Apartment",
    size: "582 sq.ft",
    builtUpArea: "348.65 sq.ft",
    rate: "₹9,500/sq.ft",
    totalPrice: "₹55.29 Lakhs*",
    monthlyRental: "Up to ₹26,000/month",
    totalUnits: 36,
    floors: 3
  },
  
  paymentPlan: [
    { stage: "Booking", percentage: "50%" },
    { stage: "On Construction", percentage: "25%" },
    { stage: "On Possession", percentage: "25%" }
  ],
  
  rera: {
    number: "PRGO07242254",
    validFrom: "15-Jul-2024",
    validUntil: "31-Dec-2027",
    authority: "Goa Real Estate Regulatory Authority"
  },
  
  nearbyPlaces: [
    { name: "Dabolim International Airport", distance: "2.7 km", icon: "Plane" },
    { name: "Bogmalo Beach", distance: "2.6 km", icon: "Waves" },
    { name: "Vasco Market & City Centre", distance: "2.5 km", icon: "ShoppingBag" },
    { name: "Cansaulim Beach", distance: "5.8 km", icon: "Umbrella" },
    { name: "Naval Aviation Museum", distance: "3.8 km", icon: "Museum" },
    { name: "Majorda Beach", distance: "8.0 km", icon: "Sun" },
    { name: "Vasco da Gama Railway Station", distance: "8.7 km", icon: "Train" }
  ],
  
  amenities: [
    { name: "Cafeteria", icon: "Coffee" },
    { name: "Swimming Pool", icon: "Waves" },
    { name: "Gym & Fitness Zone", icon: "Dumbbell" },
    { name: "Café & Lounge Area", icon: "Sofa" },
    { name: "Landscaped Green Courtyard", icon: "TreePine" },
    { name: "Kids' Play Zone", icon: "Baby" },
    { name: "24x7 Security", icon: "Shield" },
    { name: "Parking", icon: "Car" },
    { name: "Power Backup", icon: "Zap" },
    { name: "Sewage Treatment Plant", icon: "Droplets" }
  ],
  
  investmentHighlights: [
    {
      icon: "TrendingUp",
      title: "10.5% Tourism Growth",
      subtitle: "Goa tourism up by 10.5% in 2025 – booming footfall"
    },
    {
      icon: "Building2",
      title: "₹350 Cr Investment",
      subtitle: "Backed by 'Goa Beyond Beaches' tourism transformation plan"
    },
    {
      icon: "MapPin",
      title: "Prime Airport Proximity",
      subtitle: "Just 2.7 km from Dabolim International Airport"
    },
    {
      icon: "Wallet",
      title: "Strong ROI Potential",
      subtitle: "8-10% rental yield in South Goa region"
    },
    {
      icon: "Sparkles",
      title: "Fully Furnished",
      subtitle: "Resort-style maintenance = zero hassle investment"
    },
    {
      icon: "Home",
      title: "Multiple Use Cases",
      subtitle: "Perfect for Self Use | Airbnb | Long-term Rental"
    }
  ],
  
  southGoaAdvantages: [
    { param: "Property Price", value: "₹6,000-12,000/sq.ft (High potential)" },
    { param: "Rental Yield", value: "8-10% (Premium, steady)" },
    { param: "Target Audience", value: "HNIs, NRIs, Retirees, Global tourists" },
    { param: "Lifestyle", value: "Serenity, Wellness, Pristine beaches" },
    { param: "Appreciation", value: "High due to limited supply" }
  ],
  
  specifications: {
    projectType: "Exclusive 12-unit per floor resort-style apartments",
    structure: "G+3 floors",
    corridorWidth: "1.8m wide corridors",
    construction: "Modern eco-friendly construction"
  },
  
  faqs: [
    {
      question: "What is the starting price of studio apartments at Aerocidade?",
      answer: "Studio apartments at Aerocidade start at ₹55.29 Lakhs (582 sq.ft at ₹9,500/sq.ft). The project offers a flexible 50-25-25 payment plan."
    },
    {
      question: "Is Aerocidade RERA approved?",
      answer: "Yes, Aerocidade is fully RERA registered with registration number PRGO07242254, valid until 31-Dec-2027 under Goa Real Estate Regulatory Authority."
    },
    {
      question: "How far is Aerocidade from Dabolim Airport?",
      answer: "Aerocidade is strategically located just 2.7 km from Dabolim International Airport, making it ideal for holiday home investors and frequent travelers."
    },
    {
      question: "What is the rental income potential at Aerocidade?",
      answer: "Studio apartments at Aerocidade can generate rental income up to ₹26,000/month through Airbnb or long-term rentals, with South Goa offering 8-10% rental yields."
    },
    {
      question: "Are the apartments fully furnished?",
      answer: "Yes, all studio apartments come fully furnished with modern fitouts, resort-style design, and comprehensive maintenance support for hassle-free investment."
    },
    {
      question: "What amenities are available at Aerocidade?",
      answer: "Aerocidade features premium amenities including swimming pool, gym, cafeteria, landscaped courtyards, kids' play zone, 24x7 security, and power backup."
    },
    {
      question: "Who is the developer of Aerocidade?",
      answer: "Aerocidade is developed by Devika Group, a trusted developer with 70+ years of legacy since 1954, having delivered 46+ projects across 6+ million sq.ft."
    },
    {
      question: "What are the nearby beaches?",
      answer: "Aerocidade is close to Bogmalo Beach (2.6 km), Cansaulim Beach (5.8 km), and Majorda Beach (8.0 km) – all pristine South Goa beaches."
    }
  ]
};

// Generate SEO Metadata
export const metadata: Metadata = buildMetadata({
  title: "Aerocidade | Premium Studio Apartments in Dabolim, Goa | ₹55 Lakhs*",
  description: "Invest in Aerocidade Studio Apartments near Dabolim Airport, Goa. 582 sq.ft fully furnished units at ₹9,500/sq.ft. RERA approved. Rentals up to ₹26,000/month. By Devika Group.",
  canonicalUrl: "https://www.westsiderealty.in/goa/aerocidade-studio-apartments-dabolim",
  imageUrl: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
  type: "website",
  keywords: "Aerocidade Goa, Studio apartments Dabolim, Goa property investment, Airbnb Goa, Devika Group Goa, South Goa apartments, Dabolim airport property, Holiday home Goa, RERA approved Goa"
});

// Generate JSON-LD Structured Data
function generateStructuredData() {
  const { projectName, location, unitConfig, rera, faqs } = projectData;
  const priceInLakhs = parseFloat(unitConfig.totalPrice.replace(/[₹,\s*Lakhs*]/g, ''));
  const priceInRupees = priceInLakhs * 100000;

  // RealEstateListing Schema
  const realEstateListing = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": `${projectName} - ${projectData.headline}`,
    "description": projectData.subheadline,
    "url": "https://www.westsiderealty.in/goa/aerocidade-studio-apartments-dabolim",
    "image": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Dabolim",
      "addressLocality": location.micromarket,
      "addressRegion": location.district,
      "postalCode": "403802",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": location.coordinates.lat,
      "longitude": location.coordinates.lng
    },
    "offers": {
      "@type": "Offer",
      "name": `${unitConfig.type} at ${projectName}`,
      "description": `${unitConfig.type} - ${unitConfig.size} at ₹${unitConfig.rate}/sq.ft`,
      "price": priceInRupees,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31",
      "itemOffered": {
        "@type": "Apartment",
        "name": `${unitConfig.type} - ${projectName}`,
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": unitConfig.size.replace(' sq.ft', ''),
          "unitCode": "FTK"
        }
      }
    },
    "provider": {
      "@type": "RealEstateAgent",
      "@id": "https://www.westsiderealty.in/#organization",
      "name": "RE/MAX Westside Realty",
      "url": "https://www.westsiderealty.in",
      "telephone": "+919866085831",
      "email": "info@westsiderealty.in"
    }
  };

  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
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
        "name": "Goa",
        "item": "https://www.westsiderealty.in/goa"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Properties",
        "item": "https://www.westsiderealty.in/goa/properties"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": projectName,
        "item": "https://www.westsiderealty.in/goa/aerocidade-studio-apartments-dabolim"
      }
    ]
  };

  // Organization Schema for Devika Group
  const developerSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Devika Group",
    "description": "70+ Years of Building Excellence Since 1954. Delivered 46+ projects across 6+ million sq.ft.",
    "url": "https://www.devikagroup.com",
    "foundingDate": "1954",
    "areaServed": [
      {
        "@type": "City",
        "name": "Delhi"
      },
      {
        "@type": "City",
        "name": "Goa"
      },
      {
        "@type": "State",
        "name": "Uttar Pradesh"
      }
    ]
  };

  return [realEstateListing, faqSchema, breadcrumbSchema, developerSchema];
}

export default function AerocidadePage() {
  const structuredData = generateStructuredData();

  return (
    <>
      {/* JSON-LD Structured Data */}
      {structuredData.map((schema, index) => (
        <JsonLd key={index} jsonLd={schema} />
      ))}

      {/* Hidden SEO content for crawlers */}
      <div className="sr-only">
        <h1>{projectData.headline}</h1>
        <p>{projectData.subheadline}</p>
        <p>Price: {projectData.unitConfig.totalPrice}</p>
        <p>Size: {projectData.unitConfig.size}</p>
        <p>Location: {projectData.location.micromarket}, {projectData.location.city}</p>
        <p>RERA Number: {projectData.rera.number}</p>
      </div>

      {/* Hero Section */}
      <AerocidadeHero data={projectData} />

      {/* Key Stats Strip */}
      <section className="py-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-y border-teal-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-teal-700">{projectData.unitConfig.totalPrice}</p>
              <p className="text-sm text-gray-600">Starting Price</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-700">{projectData.unitConfig.size}</p>
              <p className="text-sm text-gray-600">Carpet Area</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-700">{projectData.unitConfig.monthlyRental}</p>
              <p className="text-sm text-gray-600">Rental Potential</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-700">50-25-25</p>
              <p className="text-sm text-gray-600">Payment Plan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Highlights */}
      <InvestmentHighlights highlights={projectData.investmentHighlights} />

      {/* Project Overview */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-900">
            {projectData.tagline} - {projectData.projectName}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center mb-8">
            {projectData.subheadline}
          </p>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {projectData.projectName} by Devika Group offers premium studio apartments in the heart of South Goa, 
              just 2.7 km from Dabolim International Airport. This resort-style development combines holiday comfort 
              with profitable investment potential, featuring fully furnished units designed for self-use, Airbnb rentals, 
              or long-term leasing.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              With South Goa's tourism growth at 10.5% and backed by the 'Goa Beyond Beaches' transformation plan, 
              {projectData.projectName} presents a unique opportunity to invest where the world vacations. 
              Experience the serenity of pristine beaches, wellness lifestyle, and premium rental yields of 8-10%.
            </p>
          </div>
        </div>
      </section>

      {/* Unit Configuration & Pricing */}
      <PriceTable data={projectData} />

      {/* Location Advantages */}
      <LocationAdvantages 
        location={projectData.location}
        nearbyPlaces={projectData.nearbyPlaces}
      />

      {/* South Goa vs North Goa Comparison */}
      <SouthGoaComparison advantages={projectData.southGoaAdvantages} />

      {/* Amenities Grid */}
      <AmenitiesGrid amenities={projectData.amenities} />

      {/* Developer Section */}
      <DeveloperSection developer={projectData.developer} />

      {/* FAQ Section */}
      <AerocidadeFAQ faqs={projectData.faqs} />

      {/* Sticky CTA */}
      <StickyCTA data={projectData} />
    </>
  );
}


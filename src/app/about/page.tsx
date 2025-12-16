import { Metadata } from "next";
import { JsonLd, buildMetadata } from "@/components/common/SEO";
import AboutPage from "@/components/pages/AboutPage";

const ABOUT_PAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About RE/MAX Westside Realty",
  description:
    "Learn about RE/MAX Westside Realty - your trusted real estate advisory partner for premium properties in Hyderabad, Goa, and Dubai.",
  url: "https://www.westsiderealty.in/about",
  mainEntity: {
    "@type": "RealEstateAgent",
    name: "RE/MAX Westside Realty",
    description:
      "Premier real estate advisory specializing in resale properties, investment opportunities, and holiday homes across Hyderabad, Goa & Dubai.",
    url: "https://www.westsiderealty.in",
    logo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    telephone: "+91-9866085831",
    email: "npkr79@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Hyderabad" },
      { "@type": "City", name: "Goa" },
      { "@type": "City", name: "Dubai" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
    },
  },
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "RE/MAX Westside Realty",
  url: "https://www.westsiderealty.in",
  logo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  image: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  telephone: "+91 9866085831",
  address: {
    "@type": "PostalAddress",
    streetAddress: "415, 4th Floor, Kokapet Terminal, Kokapet, Hyderabad – 500075",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500075",
    addressCountry: "IN",
  },
  description:
    "Award-winning property agents for Hyderabad, Goa, and Dubai. Specializing in resale, investment & holiday homes with a focus on trust, service, and global expertise.",
};

export const metadata: Metadata = buildMetadata({
  title: "About Us - RE/MAX Westside Realty | Your Trusted Real Estate Partner",
  description:
    "Discover the story of RE/MAX Westside Realty, Hyderabad's trusted expert in resale, investment, and holiday properties. Learn about our global network, values, and award-winning service.",
  canonicalUrl: "https://www.westsiderealty.in/about",
  keywords:
    "about remax hyderabad, real estate agents, resale properties hyderabad, goa investment homes, dubai realty, trusted property advisor",
});

export default function Page() {
  return (
    <>
      <JsonLd jsonLd={[ABOUT_PAGE_SCHEMA, ORG_SCHEMA]} />
      <AboutPage />
    </>
  );
}
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Users, 
  MapPin, 
  TrendingUp, 
  Shield, 
  Handshake,
  Phone,
  ArrowRight,
  Star,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import FooterSection from "@/components/home/FooterSection";
import { siteImagesService, locationSettingsService } from "@/services/adminService";
import { convertYouTubeToEmbed } from "@/utils/urlConverters";

const About = () => {
  const [siteImages, setSiteImages] = useState<any>({});
  const [locationSettings, setLocationSettings] = useState<any>({});

  useEffect(() => {
    setSiteImages(siteImagesService.getSiteImages());
    setLocationSettings(locationSettingsService.getLocationSettings());
  }, []);

  // Organization structured data
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About RE/MAX Westside Realty",
    "description": "Learn about RE/MAX Westside Realty - your trusted real estate advisory partner for premium properties in Hyderabad, Goa, and Dubai.",
    "url": "https://www.westsiderealty.in/about",
    "mainEntity": {
      "@type": "RealEstateAgent",
      "name": "RE/MAX Westside Realty",
      "description": "Premier real estate advisory specializing in resale properties, investment opportunities, and holiday homes across Hyderabad, Goa & Dubai.",
      "url": "https://www.westsiderealty.in",
      "logo": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
      "telephone": "+91-9866085831",
      "email": "npkr79@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hyderabad",
        "addressRegion": "Telangana",
        "addressCountry": "IN"
      },
      "areaServed": [
        { "@type": "City", "name": "Hyderabad" },
        { "@type": "City", "name": "Goa" },
        { "@type": "City", "name": "Dubai" }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150",
        "bestRating": "5"
      }
    }
  };

  const values = [
    {
      icon: Handshake,
      title: "Integrity",
      description: "We uphold the highest ethical standards in all our dealings."
    },
    {
      icon: Shield,
      title: "Trust",
      description: "Building lasting relationships based on transparency and reliability."
    },
    {
      icon: TrendingUp,
      title: "Excellence",
      description: "Commitment to providing exceptional service and expertise."
    }
  ];

  const achievements = [
    {
      icon: Award,
      title: "Global Network",
      value: "140,000+ agents worldwide"
    },
    {
      icon: Users,
      title: "Happy Clients",
      value: "500+"
    },
    {
      icon: Star,
      title: "Years in Business",
      value: "10+"
    }
  ];

  const handleWhatsAppContact = () => {
    window.open('https://wa.me/919866085831', '_blank');
  };

  const videoUrl = convertYouTubeToEmbed("https://www.youtube.com/watch?v=ZOfoEr-D04k");

  const orgStructuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "RE/MAX Westside Realty",
    "url": "https://www.westsiderealty.in",
    "logo": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
    "image": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
    "telephone": "+91 9866085831",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "415, 4th Floor, Kokapet Terminal, Kokapet, Hyderabad – 500075",
      "addressLocality": "Hyderabad",
      "addressRegion": "Telangana",
      "postalCode": "500075",
      "addressCountry": "IN"
    },
    "description":
      "Award-winning property agents for Hyderabad, Goa, and Dubai. Specializing in resale, investment & holiday homes with a focus on trust, service, and global expertise."
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Us - RE/MAX Westside Realty | Your Trusted Real Estate Partner</title>
        <meta name="description" content="Discover the story of RE/MAX Westside Realty, Hyderabad's trusted expert in resale, investment, and holiday properties. Learn about our global network, values, and award-winning service." />
        <link rel="canonical" href="https://www.westsiderealty.in/about" />
        <meta name="keywords" content="about remax hyderabad, real estate agents, resale properties hyderabad, goa investment homes, dubai realty, trusted property advisor" />
        <script type="application/ld+json">
          {JSON.stringify(aboutPageSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(orgStructuredData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-remax-blue/10 to-remax-red/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Us
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover our story, values, and commitment to excellence in real estate.
          </p>
        </div>
      </section>

      {/* Our Story Section with Video */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                RE/MAX Westside Realty was founded with a vision to redefine the real estate experience. 
                With over 10 years of experience, we've grown to become a trusted name in Hyderabad, Goa, and Dubai. 
                Our commitment to integrity, trust, and excellence drives everything we do.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We believe in building lasting relationships with our clients, guiding them through every step of their property journey. 
                Whether you're buying, selling, or investing, we're here to provide expert advice and personalized service.
              </p>
            </div>
            <div>
              <div className="rounded-lg shadow-lg w-full h-56 flex items-center justify-center bg-gray-50 overflow-hidden">
                <iframe
                  title="History of RE/MAX"
                  src={videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Guiding principles that shape our approach to real estate
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <value.icon className="h-12 w-12 text-remax-red mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                  <p className="text-gray-700">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Key Achievements</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Numbers that reflect our success and impact
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <achievement.icon className="h-12 w-12 text-remax-red mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-4">{achievement.title}</h3>
                  <p className="text-gray-700">{achievement.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visit Our Office */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Visit Our Office</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {locationSettings.locationDescription || "Located in the heart of Kokapet, Hyderabad - easily accessible from all major areas"}
            </p>
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-lg mb-8">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.7238359893885!2d78.32729527516557!3d17.38511598359169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb95ee5b2ab6e9%3A0x5e0b4a7a89b65c76!2sRE%2FMAX%20Westside%20Realty!5e0!3m2!1sen!2sin!4v1703680800000!5m2!1sen!2sin"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="RE/MAX Westside Realty Office Location"
              className="rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-remax-red mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Prime Location</h3>
              <p className="text-gray-600">Easily accessible from all major areas</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-remax-red mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Open 6 Days a Week</h3>
              <p className="text-gray-600">Monday to Saturday, 9 AM to 7 PM</p>
            </div>
            <div className="text-center">
              <Handshake className="h-8 w-8 text-remax-red mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Expert Assistance</h3>
              <p className="text-gray-600">Personalized guidance for all your needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-remax-red text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Property Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Contact us today for expert advice and personalized service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="w-full sm:w-auto">
              <Button 
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-remax-red bg-white border-white hover:bg-gray-100 hover:text-remax-red"
              >
                <Phone className="h-5 w-5 mr-2" />
                Schedule Consultation
              </Button>
            </Link>
            <Button 
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto text-remax-red bg-white border-white hover:bg-gray-100 hover:text-remax-red"
              onClick={handleWhatsAppContact}
            >
              WhatsApp Us
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      <FooterSection />
    </div>
  );
};

export default About;

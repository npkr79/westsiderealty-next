import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, Mail, MapPin } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommercialProperty {
  id: string;
  project_name: string;
  location: string;
  description: string;
  image_url?: string;
}

interface SiteContent {
  id: number;
  element_name: string;
  content_text?: string;
  content_image_url?: string;
}

const HyderabadCommercial = () => {
  const [properties, setProperties] = useState<CommercialProperty[]>([]);
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [articleData, setArticleData] = useState<{
    title: string;
    body: string;
    imageUrl: string;
  }>({
    title: '',
    body: '',
    imageUrl: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    businessEmail: '',
    businessPhone: '',
    businessIndustry: '',
    locationInHyderabad: '',
    requirements: ''
  });

  useEffect(() => {
    fetchProperties();
    fetchSiteContent();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('commercial_properties')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchSiteContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .in('element_name', ['hero_image', 'why_hyderabad_article_title', 'why_hyderabad_article_body']);

      if (error) throw error;

      const siteContent = data || [];
      const heroImage = siteContent.find((item: SiteContent) => item.element_name === 'hero_image');
      const articleTitle = siteContent.find((item: SiteContent) => item.element_name === 'why_hyderabad_article_title');
      const articleBody = siteContent.find((item: SiteContent) => item.element_name === 'why_hyderabad_article_body');

      if (heroImage?.content_image_url) {
        setHeroImageUrl(heroImage.content_image_url);
      }

      setArticleData({
        title: articleTitle?.content_text || '',
        body: articleBody?.content_text || '',
        imageUrl: articleBody?.content_image_url || ''
      });
    } catch (error) {
      console.error('Error fetching site content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('commercial_leads')
        .insert([{
          full_name: formData.name,
          business_email: formData.businessEmail,
          business_phone: formData.businessPhone || null,
          business_industry: formData.businessIndustry,
          preferred_location: formData.locationInHyderabad,
          requirements: formData.requirements
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your inquiry has been submitted successfully. We will contact you soon.',
      });

      setFormData({
        name: '',
        businessEmail: '',
        businessPhone: '',
        businessIndustry: '',
        locationInHyderabad: '',
        requirements: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit inquiry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Grade A Commercial Office Spaces in Hyderabad | Premium Leasing"
        description="Discover exclusive Grade A office spaces in Hyderabad's Hi-Tech City and Financial District. Join Fortune 500 companies in India's fastest-growing tech corridor."
        keywords="commercial office space Hyderabad, Grade A office leasing, Hi-Tech City office, Financial District Hyderabad, business park leasing"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${heroImageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'}')`
            }}
          />
          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Hyderabad: Your Global Hub for <span className="text-white">Business Excellence</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
              Discover exclusive Grade A office spaces and Global Capability Centers in India's fastest-growing tech corridor.
            </p>
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Inquire Now
            </Button>
          </div>
        </section>

        {/* Why Hyderabad Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
              Why Hyderabad?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-8 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Global Talent Hub</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Access a massive pool of skilled tech and business professionals in one of India's leading IT destinations.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-8 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Thriving Ecosystem</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Join Fortune 500 companies like Google, Microsoft, Amazon, and hundreds of other global enterprises.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-8 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Cost-Effective Scalability</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Achieve operational excellence with competitive leasing and operational costs compared to global markets.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Hyderabad Article Section */}
        {articleData.title && (
          <section className="py-20">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-4xl font-bold mb-6 text-foreground">
                      {articleData.title}
                    </h2>
                    <div className="prose prose-lg text-muted-foreground leading-relaxed">
                      {articleData.body}
                    </div>
                  </div>
                  {articleData.imageUrl && (
                    <div className="relative">
                      <img
                        src={articleData.imageUrl}
                        alt="Hyderabad business district"
                        className="w-full h-80 object-cover rounded-lg shadow-xl"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Featured Properties Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
              Featured Properties
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}
                      alt={property.project_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-foreground line-clamp-1">
                        {property.project_name}
                      </h3>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact-form" className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4 text-foreground">
                Connect with our commercial leasing experts to find the perfect office space for your global operations.
              </h2>
              
              <Card className="p-8 mt-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="businessEmail" className="block text-sm font-medium mb-2">
                        Business Email *
                      </label>
                      <Input
                        id="businessEmail"
                        name="businessEmail"
                        type="email"
                        required
                        value={formData.businessEmail}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Enter business email"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="businessPhone" className="block text-sm font-medium mb-2">
                        Business Phone Number
                      </label>
                      <Input
                        id="businessPhone"
                        name="businessPhone"
                        type="tel"
                        value={formData.businessPhone}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="businessIndustry" className="block text-sm font-medium mb-2">
                        Business Industry *
                      </label>
                      <Input
                        id="businessIndustry"
                        name="businessIndustry"
                        type="text"
                        required
                        value={formData.businessIndustry}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="e.g., Technology, Finance, Healthcare"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="locationInHyderabad" className="block text-sm font-medium mb-2">
                      Location in Hyderabad *
                    </label>
                    <Input
                      id="locationInHyderabad"
                      name="locationInHyderabad"
                      type="text"
                      required
                      value={formData.locationInHyderabad}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="e.g., Hi-Tech City, Financial District, etc."
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="requirements" className="block text-sm font-medium mb-2">
                      Your Requirements *
                    </label>
                    <Textarea
                      id="requirements"
                      name="requirements"
                      rows={4}
                      required
                      value={formData.requirements}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Ex: Need 50,000 sq ft for our GCC in Hi-Tech City"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg font-semibold"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <img 
                      src="/lovable-uploads/remax-logo.jpg"
                      alt="RE/MAX Logo"
                      className="h-8 w-auto"
                    />
                    <h3 className="text-2xl font-bold">Westside Realty</h3>
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Premium real estate advisory in Hyderabad, Goa & Dubai. Specializing in resale homes, holiday investments, global properties, and <strong>Grade A commercial office space leasing in Hyderabad</strong> with trusted RE/MAX expertise.
                  </p>
                  <div className="space-y-2 text-gray-300">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      415, Kokapet Terminal, Kokapet, Hyderabad, 500075
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <a 
                        href="mailto:info@westsiderealty.in" 
                        className="hover:text-white transition-colors"
                      >
                        info@westsiderealty.in
                      </a>
                    </p>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Our Services</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>
                      <a href="/services" className="hover:text-white transition-colors">
                        Resale Properties
                      </a>
                    </li>
                    <li>
                      <a href="/goa-villa" className="hover:text-white transition-colors">
                        Goa Investments
                      </a>
                    </li>
                    <li>
                      <a href="/properties" className="hover:text-white transition-colors">
                        Dubai Properties
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="hover:text-white transition-colors">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Locations */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Locations</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>Hyderabad</li>
                    <li>Goa</li>
                    <li>Dubai</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-700 mt-12 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
                  <p>&copy; 2024 RE/MAX Westside Realty. All rights reserved.</p>
                  <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="/privacy-policy" className="hover:text-white transition-colors">
                      Privacy Policy
                    </a>
                    <a href="/about" className="hover:text-white transition-colors">
                      About Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HyderabadCommercial;
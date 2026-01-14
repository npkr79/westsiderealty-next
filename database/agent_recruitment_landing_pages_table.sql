-- Agent Recruitment Landing Pages Table
-- Stores all content for the agent recruitment landing page (/join_us)
-- All content can be updated via this table without code changes

CREATE TABLE IF NOT EXISTS agent_recruitment_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hero Section
  hero_headline TEXT NOT NULL DEFAULT 'Join RE/MAX Westside Realty',
  hero_subheadline TEXT,
  hero_description TEXT,
  hero_image_url TEXT,
  hero_cta_primary_text TEXT DEFAULT 'Apply Now',
  hero_cta_secondary_text TEXT DEFAULT 'Learn More',
  hero_trust_indicator TEXT DEFAULT 'Join 100+ Successful Agents',
  
  -- Why Join Us Section
  why_join_title TEXT DEFAULT 'Why Join Us',
  why_join_subtitle TEXT,
  
  -- Value Pillars (stored as JSONB array)
  value_pillars JSONB DEFAULT '[]'::jsonb,
  -- Example structure: [{"icon": "Award", "title": "High Commission", "description": "Competitive commission structure"}]
  
  -- Success Stories Section
  success_stories_title TEXT DEFAULT 'Success Stories',
  success_stories_subtitle TEXT,
  success_stories JSONB DEFAULT '[]'::jsonb,
  -- Example structure: [{"name": "John Doe", "photo_url": "...", "testimonial": "...", "metrics": {"earnings": "₹50L+", "deals": "100+", "years": "5"}}]
  
  -- What We Offer Section
  what_we_offer_title TEXT DEFAULT 'What We Offer',
  what_we_offer_subtitle TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  -- Example structure: [{"icon": "DollarSign", "title": "Competitive Commission", "description": "..."}]
  
  -- Requirements Section
  requirements_title TEXT DEFAULT 'Requirements & Qualifications',
  requirements_subtitle TEXT,
  requirements_list JSONB DEFAULT '[]'::jsonb,
  -- Example structure: ["Minimum 2 years experience", "Valid real estate license", ...]
  what_we_look_for TEXT,
  application_process_steps JSONB DEFAULT '[]'::jsonb,
  -- Example structure: [{"step": 1, "title": "Submit Application", "description": "..."}]
  
  -- FAQ Section
  faq_title TEXT DEFAULT 'Frequently Asked Questions',
  faq_subtitle TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  -- Example structure: [{"question": "...", "answer": "..."}]
  
  -- Contact/CTA Section
  final_cta_title TEXT DEFAULT 'Ready to Start Your Journey?',
  final_cta_description TEXT,
  final_cta_button_text TEXT DEFAULT 'Apply Now',
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  
  -- SEO Fields
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  
  -- Status
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_agent_recruitment_status 
ON agent_recruitment_landing_pages(status) 
WHERE status = 'published';

-- Add comment to table
COMMENT ON TABLE agent_recruitment_landing_pages IS 'Stores all content for agent recruitment landing page (/join_us). All content can be updated via this table.';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_recruitment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_recruitment_updated_at_trigger
BEFORE UPDATE ON agent_recruitment_landing_pages
FOR EACH ROW
EXECUTE FUNCTION update_agent_recruitment_updated_at();

-- Insert default content (can be updated later)
INSERT INTO agent_recruitment_landing_pages (
  hero_headline,
  hero_subheadline,
  hero_description,
  hero_cta_primary_text,
  hero_cta_secondary_text,
  hero_trust_indicator,
  why_join_title,
  why_join_subtitle,
  value_pillars,
  success_stories_title,
  what_we_offer_title,
  requirements_title,
  faq_title,
  final_cta_title,
  status
) VALUES (
  'Join RE/MAX Westside Realty',
  'Build Your Real Estate Career with India''s Premier Brokerage',
  'Join a team of successful real estate professionals and unlock your potential with industry-leading support, technology, and commission structures.',
  'Apply Now',
  'Learn More',
  'Join 100+ Successful Agents',
  'Why Join Us',
  'Discover what makes RE/MAX Westside Realty the best choice for your real estate career',
  '[
    {"icon": "DollarSign", "title": "High Commission Structure", "description": "Competitive commission rates that reward your success"},
    {"icon": "GraduationCap", "title": "Training & Support", "description": "Comprehensive training programs and ongoing support"},
    {"icon": "Award", "title": "Brand Recognition", "description": "Leverage the power of the RE/MAX brand"},
    {"icon": "Laptop", "title": "Technology Tools", "description": "Access to cutting-edge real estate technology"},
    {"icon": "TrendingUp", "title": "Marketing Support", "description": "Professional marketing materials and lead generation"},
    {"icon": "Users", "title": "Career Growth", "description": "Clear path for career advancement and growth"}
  ]'::jsonb,
  'Success Stories',
  'What We Offer',
  'Requirements & Qualifications',
  'Frequently Asked Questions',
  'Ready to Start Your Journey?',
  'published'
) ON CONFLICT DO NOTHING;

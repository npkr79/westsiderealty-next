-- Create landowner_share_projects table
CREATE TABLE IF NOT EXISTS landowner_share_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  project_name TEXT NOT NULL,
  developer_name TEXT,
  micro_market TEXT,
  share_type TEXT CHECK (share_type IN ('landowner', 'investor', 'both')),
  available_units INTEGER,
  price_range_text TEXT,
  discount_percentage DECIMAL,
  bhk_configurations TEXT[],
  hero_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create landowner_page_content table for CMS
CREATE TABLE IF NOT EXISTS landowner_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  h1_title TEXT,
  hero_description TEXT,
  what_is_landowner_share TEXT,
  what_is_investor_share TEXT,
  why_buy_content TEXT,
  benefits_json JSONB,
  faqs_json JSONB,
  schema_markup_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_landowner_share_projects_is_active ON landowner_share_projects(is_active);
CREATE INDEX IF NOT EXISTS idx_landowner_share_projects_display_order ON landowner_share_projects(display_order);
CREATE INDEX IF NOT EXISTS idx_landowner_share_projects_share_type ON landowner_share_projects(share_type);
CREATE INDEX IF NOT EXISTS idx_landowner_page_content_city_slug ON landowner_page_content(city_slug);

-- Add RLS policies (if using Row Level Security)
-- ALTER TABLE landowner_share_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landowner_page_content ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
-- CREATE POLICY "Allow public read access" ON landowner_share_projects FOR SELECT USING (is_active = true);
-- CREATE POLICY "Allow public read access" ON landowner_page_content FOR SELECT USING (true);


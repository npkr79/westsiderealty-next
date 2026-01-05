-- Hero Banner Offers Table
-- Stores promotional offers/slides for the home page hero banner (max 3 slides)
CREATE TABLE IF NOT EXISTS hero_banner_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  offer_headline TEXT,
  rera_number TEXT,
  rera_link TEXT,
  location_text TEXT,
  location_highlight TEXT,
  configurations JSONB, -- Array of config objects: { bhk, sqft, sqm, price, location }
  cta_text TEXT DEFAULT 'Explore Now',
  cta_link TEXT NOT NULL,
  background_image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_hero_banner_offers_active_order 
ON hero_banner_offers(is_active, display_order) 
WHERE is_active = true;

-- Add comment to table
COMMENT ON TABLE hero_banner_offers IS 'Stores promotional offers/slides for home page hero banner (max 3 slides)';

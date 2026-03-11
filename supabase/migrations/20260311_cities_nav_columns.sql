-- Add navigation control columns to cities table
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Set display order for existing cities
UPDATE cities SET display_order = 1 WHERE url_slug = 'hyderabad';
UPDATE cities SET display_order = 2 WHERE url_slug = 'goa';

-- Add is_featured column to micro_markets table
ALTER TABLE micro_markets
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Mark featured Hyderabad micro-markets
UPDATE micro_markets SET is_featured = true
WHERE url_slug IN ('gachibowli', 'financial-district', 'kokapet')
  AND city_slug = 'hyderabad';

-- Mark featured Goa micro-markets
UPDATE micro_markets SET is_featured = true
WHERE url_slug IN ('calangute', 'assagao')
  AND city_slug = 'goa';

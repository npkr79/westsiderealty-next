-- SQL Script to Insert Aerocidade Studio Apartments Landing Page Data
-- Run this in your Supabase SQL Editor
-- This script uses a DO block to handle the landing page ID automatically

DO $$
DECLARE
  landing_page_id_var UUID;
BEGIN
  -- Step 1: Insert into landing_pages table
  INSERT INTO landing_pages (
    uri,
    title,
    headline,
    subheadline,
    rich_description,
    location_info,
    whatsapp_number,
    whatsapp_message,
    show_google_map,
    map_latitude,
    map_longitude,
    map_zoom,
    map_type,
    hero_image_url,
    status,
    seo_title,
    seo_description,
    show_faq,
    template_type,
    project_total_floors,
    project_total_flats,
    rera_number,
    rera_link,
    created_at,
    updated_at
  ) VALUES (
    'aerocidade-studio-apartments-dabolim',
    'Aerocidade',
    'Premium Studio Apartments Near Dabolim International Airport, Goa',
    'Invest Where the World Vacations – A blend of holiday comfort & profitable investment',
    '<div class="prose prose-lg max-w-none">
      <h2>Vive la Goa - Aerocidade</h2>
      <p>Aerocidade by Devika Group offers premium studio apartments in the heart of South Goa, just 2.7 km from Dabolim International Airport. This resort-style development combines holiday comfort with profitable investment potential, featuring fully furnished units designed for self-use, Airbnb rentals, or long-term leasing.</p>
      <p>With South Goa''s tourism growth at 10.5% and backed by the ''Goa Beyond Beaches'' transformation plan, Aerocidade presents a unique opportunity to invest where the world vacations. Experience the serenity of pristine beaches, wellness lifestyle, and premium rental yields of 8-10%.</p>
      <h3>Project Specifications</h3>
      <ul>
        <li>Exclusive 12-unit per floor resort-style apartments</li>
        <li>G+3 floors structure</li>
        <li>1.8m wide corridors</li>
        <li>Modern eco-friendly construction</li>
      </ul>
    </div>',
    'Dabolim, South Goa, Goa',
    '919866085831',
    'Hi, I''m interested in Aerocidade Studio Apartments in Dabolim, Goa. Please share more details.',
    true,
    15.3818,
    73.8301,
    14,
    'satellite',
    'https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg',
    'published',
    'Aerocidade | Premium Studio Apartments in Dabolim, Goa | ₹55 Lakhs*',
    'Invest in Aerocidade Studio Apartments near Dabolim Airport, Goa. 582 sq.ft fully furnished units at ₹9,500/sq.ft. RERA approved. Rentals up to ₹26,000/month. By Devika Group.',
    true,
    'standard',
    '3',
    '36',
    'PRGO07242254',
    'https://rera.goa.gov.in/',
    NOW(),
    NOW()
  ) RETURNING id INTO landing_page_id_var;

  -- Step 2: Insert Highlights (Investment Highlights)
  INSERT INTO landing_page_highlights (landing_page_id, icon_name, title, subtitle, display_order, created_at, updated_at)
  VALUES
    (landing_page_id_var, 'TrendingUp', '10.5% Tourism Growth', 'Goa tourism up by 10.5% in 2025 – booming footfall', 1, NOW(), NOW()),
    (landing_page_id_var, 'Building2', '₹350 Cr Investment', 'Backed by ''Goa Beyond Beaches'' tourism transformation plan', 2, NOW(), NOW()),
    (landing_page_id_var, 'MapPin', 'Prime Airport Proximity', 'Just 2.7 km from Dabolim International Airport', 3, NOW(), NOW()),
    (landing_page_id_var, 'Wallet', 'Strong ROI Potential', '8-10% rental yield in South Goa region', 4, NOW(), NOW()),
    (landing_page_id_var, 'Sparkles', 'Fully Furnished', 'Resort-style maintenance = zero hassle investment', 5, NOW(), NOW()),
    (landing_page_id_var, 'Home', 'Multiple Use Cases', 'Perfect for Self Use | Airbnb | Long-term Rental', 6, NOW(), NOW());

  -- Step 3: Insert Configurations (Unit Pricing)
  INSERT INTO landing_page_configurations (landing_page_id, unit_type, size_min, size_max, starting_price, price_display, display_order, created_at, updated_at)
  VALUES
    (landing_page_id_var, 'Studio Apartment', 348.65, 348.65, 5529000, '₹55.29 Lakhs*', 1, NOW(), NOW());

  -- Step 4: Insert Location Points (Nearby Places)
  INSERT INTO landing_page_location_points (landing_page_id, landmark_name, landmark_type, distance, description, icon_name, display_order, created_at, updated_at)
  VALUES
    (landing_page_id_var, 'Dabolim International Airport', 'Airport', '2.7 km', 'Nearest international airport', 'Plane', 1, NOW(), NOW()),
    (landing_page_id_var, 'Bogmalo Beach', 'Beach', '2.6 km', 'Pristine South Goa beach', 'Waves', 2, NOW(), NOW()),
    (landing_page_id_var, 'Vasco Market & City Centre', 'Shopping', '2.5 km', 'Local market and city center', 'ShoppingBag', 3, NOW(), NOW()),
    (landing_page_id_var, 'Cansaulim Beach', 'Beach', '5.8 km', 'Popular beach destination', 'Umbrella', 4, NOW(), NOW()),
    (landing_page_id_var, 'Naval Aviation Museum', 'Museum', '3.8 km', 'Aviation history museum', 'Landmark', 5, NOW(), NOW()),
    (landing_page_id_var, 'Majorda Beach', 'Beach', '8.0 km', 'Famous beach with resorts', 'Sun', 6, NOW(), NOW()),
    (landing_page_id_var, 'Vasco da Gama Railway Station', 'Transport', '8.7 km', 'Nearest railway station', 'Train', 7, NOW(), NOW());

  -- Step 5: Insert FAQs
  INSERT INTO landing_page_faqs (landing_page_id, category, question, answer, display_order, created_at, updated_at)
  VALUES
    (landing_page_id_var, 'Pricing', 'What is the starting price of studio apartments at Aerocidade?', 'Studio apartments at Aerocidade start at ₹55.29 Lakhs (582 sq.ft at ₹9,500/sq.ft). The project offers a flexible 50-25-25 payment plan.', 1, NOW(), NOW()),
    (landing_page_id_var, 'Legal', 'Is Aerocidade RERA approved?', 'Yes, Aerocidade is fully RERA registered with registration number PRGO07242254, valid until 31-Dec-2027 under Goa Real Estate Regulatory Authority.', 2, NOW(), NOW()),
    (landing_page_id_var, 'Location', 'How far is Aerocidade from Dabolim Airport?', 'Aerocidade is strategically located just 2.7 km from Dabolim International Airport, making it ideal for holiday home investors and frequent travelers.', 3, NOW(), NOW()),
    (landing_page_id_var, 'Investment', 'What is the rental income potential at Aerocidade?', 'Studio apartments at Aerocidade can generate rental income up to ₹26,000/month through Airbnb or long-term rentals, with South Goa offering 8-10% rental yields.', 4, NOW(), NOW()),
    (landing_page_id_var, 'Features', 'Are the apartments fully furnished?', 'Yes, all studio apartments come fully furnished with modern fitouts, resort-style design, and comprehensive maintenance support for hassle-free investment.', 5, NOW(), NOW()),
    (landing_page_id_var, 'Amenities', 'What amenities are available at Aerocidade?', 'Aerocidade features premium amenities including swimming pool, gym, cafeteria, landscaped courtyards, kids'' play zone, 24x7 security, and power backup.', 6, NOW(), NOW()),
    (landing_page_id_var, 'Developer', 'Who is the developer of Aerocidade?', 'Aerocidade is developed by Devika Group, a trusted developer with 70+ years of legacy since 1954, having delivered 46+ projects across 6+ million sq.ft.', 7, NOW(), NOW()),
    (landing_page_id_var, 'Location', 'What are the nearby beaches?', 'Aerocidade is close to Bogmalo Beach (2.6 km), Cansaulim Beach (5.8 km), and Majorda Beach (8.0 km) – all pristine South Goa beaches.', 8, NOW(), NOW());

  -- Step 6: Insert Specifications
  INSERT INTO landing_page_specifications (landing_page_id, category, specification_key, specification_value, display_order, created_at, updated_at)
  VALUES
    (landing_page_id_var, 'Structure', 'Project Type', 'Exclusive 12-unit per floor resort-style apartments', 1, NOW(), NOW()),
    (landing_page_id_var, 'Structure', 'Building Structure', 'G+3 floors', 2, NOW(), NOW()),
    (landing_page_id_var, 'Structure', 'Corridor Width', '1.8m wide corridors', 3, NOW(), NOW()),
    (landing_page_id_var, 'Construction', 'Construction Type', 'Modern eco-friendly construction', 4, NOW(), NOW());

  -- Step 7: Insert Amenities
  INSERT INTO landing_page_amenities (landing_page_id, title, icon, display_order, created_at, updated_at)
  VALUES
    (landing_page_id_var, 'Cafeteria', 'Coffee', 1, NOW(), NOW()),
    (landing_page_id_var, 'Swimming Pool', 'Waves', 2, NOW(), NOW()),
    (landing_page_id_var, 'Gym & Fitness Zone', 'Dumbbell', 3, NOW(), NOW()),
    (landing_page_id_var, 'Café & Lounge Area', 'Sofa', 4, NOW(), NOW()),
    (landing_page_id_var, 'Landscaped Green Courtyard', 'TreePine', 5, NOW(), NOW()),
    (landing_page_id_var, 'Kids'' Play Zone', 'Baby', 6, NOW(), NOW()),
    (landing_page_id_var, '24x7 Security', 'Shield', 7, NOW(), NOW()),
    (landing_page_id_var, 'Parking', 'Car', 8, NOW(), NOW()),
    (landing_page_id_var, 'Power Backup', 'Zap', 9, NOW(), NOW()),
    (landing_page_id_var, 'Sewage Treatment Plant', 'Droplets', 10, NOW(), NOW());

  RAISE NOTICE 'Landing page created successfully with ID: %', landing_page_id_var;
END $$;

-- Verification Queries (run after the DO block to verify data)
-- Quick check: Verify the page exists and is published
SELECT 
  id, 
  uri, 
  title, 
  status, 
  created_at 
FROM landing_pages 
WHERE uri = 'aerocidade-studio-apartments-dabolim';

-- Full data verification
SELECT 'landing_pages' as table_name, COUNT(*) as count FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim'
UNION ALL
SELECT 'landing_page_highlights', COUNT(*) FROM landing_page_highlights WHERE landing_page_id IN (SELECT id FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim')
UNION ALL
SELECT 'landing_page_configurations', COUNT(*) FROM landing_page_configurations WHERE landing_page_id IN (SELECT id FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim')
UNION ALL
SELECT 'landing_page_location_points', COUNT(*) FROM landing_page_location_points WHERE landing_page_id IN (SELECT id FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim')
UNION ALL
SELECT 'landing_page_faqs', COUNT(*) FROM landing_page_faqs WHERE landing_page_id IN (SELECT id FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim')
UNION ALL
SELECT 'landing_page_amenities', COUNT(*) FROM landing_page_amenities WHERE landing_page_id IN (SELECT id FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim');


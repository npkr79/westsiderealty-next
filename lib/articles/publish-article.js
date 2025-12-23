#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://imqlfztriragzypplbqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWxmenRyaXJhZ3p5cHBsYnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg1NTQxMCwiZXhwIjoyMDYyNDMxNDEwfQ.YKK-usj8GIwOY6sZD203lY1FauidsZX6o_pH4xs_gTg';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Gemini response data (parsed from the provided format)
const geminiResponse = {
  'parts': [{
    'text': '```json\n{\n  "slug": "where-to-invest-in-hyderabad-in-2026",\n  "title": "Hyderabad Investment Guide 2026: Top Micro-Markets & Trends to Watch",\n  "content": "<p>Hyderabad, often dubbed the \'City of Pearls\' and increasingly, the \'Silicon Valley of India\', continues its phenomenal growth trajectory, making it an irresistible magnet for real estate investors. As we approach 2026, the city\'s dynamic landscape, fueled by robust infrastructure development, a thriving IT sector, and proactive government policies, promises even more lucrative opportunities. For those looking to capitalize on this boom, understanding the key trends and identifying the most promising micro-markets is crucial.</p>\\n\\n<h2>Why Hyderabad Remains a Top Investment Destination for 2026</h2>\\n<p>Hyderabad\'s real estate market has consistently outperformed many other Indian metros. Several factors contribute to its sustained appeal:</p>\\n<ul>\\n    <li><strong>Economic Stability & Growth:</strong> A resilient economy driven by IT, Pharma, Biotech, and manufacturing sectors ensures job creation and a steady influx of migrants, driving housing demand.</li>\\n    <li><strong>Infrastructure Development:</strong> Ongoing projects like the Outer Ring Road (ORR), Radial Roads, Metro Rail expansion, and strategic flyovers enhance connectivity and reduce commute times, opening up new growth corridors.</li>\\n    <li><strong>Pro-Business Government Policies:</strong> The Telangana government\'s investor-friendly policies, including the TS-iPASS single-window clearance system and the GRID (Growth in Dispersion) policy, encourage industrial and IT growth beyond traditional hubs.</li>\\n    <li><strong>Quality of Life:</strong> Hyderabad consistently ranks high in livability indices, offering a blend of modern amenities, cultural heritage, and affordable living compared to other major metros.</li>\\n    <li><strong>Affordability:</strong> While property values are appreciating, Hyderabad still offers relatively more affordable options across segments compared to Mumbai or Bengaluru.</li>\\n</ul>\\n\\n<h2>Key Real Estate Investment Trends for Hyderabad in 2026</h2>\\n<p>Looking ahead to 2026, several trends will shape Hyderabad\'s investment landscape:</p>\\n\\n<h3>1. Residential Real Estate: Demand for Integrated Living</h3>\\n<ul>\\n    <li><strong>Mid-Segment & Luxury Apartments:</strong> Demand will remain strong for well-designed apartments, particularly in gated communities offering amenities. The mid-segment (₹60 lakhs - ₹1.5 Cr) will see consistent absorption.</li>\\n    <li><strong>Plotted Developments & Villas:</strong> The desire for independent living, especially post-pandemic, will continue to fuel demand for plotted developments and villas in peri-urban and suburban areas, offering better space and lifestyle.</li>\\n    <li><strong>Smart Homes & Sustainable Living:</strong> Buyers are increasingly looking for homes equipped with smart technology and sustainable features, pushing developers to integrate these aspects.</li>\\n</ul>\\n\\n<h3>2. Commercial Real Estate: Expanding Horizons</h3>\\n<ul>\\n    <li><strong>Grade A Office Spaces:</strong> Hyderabad\'s IT/ITeS sector will continue to drive demand for premium office spaces, with a focus on flexible workspaces and employee-centric designs.</li>\\n    <li><strong>Retail Expansion:</strong> As new residential corridors develop, so too will the need for retail infrastructure, including malls, high-street retail, and local shopping complexes.</li>\\n    <li><strong>Co-working Spaces:</strong> The hybrid work model ensures sustained demand for flexible and managed office spaces, catering to startups, freelancers, and large corporates alike.</li>\\n</ul>\\n\\n<h3>3. Alternative Asset Classes: Niche Opportunities</h3>\\n<ul>\\n    <li><strong>Warehousing & Logistics:</strong> The e-commerce boom and Hyderabad\'s strategic location as a logistics hub will drive significant investment in warehousing and industrial parks along the ORR.</li>\\n    <li><strong>Data Centers:</strong> With increasing digitalization and cloud adoption, Hyderabad is emerging as a preferred location for data centers, attracting significant foreign and domestic investment.</li>\\n    <li><strong>Co-living Spaces:</strong> The influx of students and young professionals will bolster demand for affordable, managed co-living accommodations near educational institutions and IT hubs.</li>\\n</ul>\\n\\n<h2>Hyderabad\'s Trending Micro-Markets for Investment in 2026</h2>\\n<p>Identifying the right micro-market is paramount for maximizing returns. Here are some of the top areas to watch:</p>\\n\\n<h3>1. The Western IT Corridor & Beyond (Continued Dominance)</h3>\\n<ul>\\n    <li><strong>Kokapet:</strong> Known for its high-rise luxury apartments and proximity to the Financial District, Kokapet offers premium living and excellent appreciation potential due to limited land parcels.</li>\\n    <li><strong>Nanakramguda & Financial District:</strong> These areas remain the heart of commercial activity and high-end residential living. Investment here promises strong rental yields and capital appreciation, albeit at a higher entry point.</li>\\n    <li><strong>Gachibowli:</strong> A mature market, Gachibowli continues to attract investors due to its established infrastructure, connectivity, and consistent demand from the IT workforce.</li>\\n    <li><strong>Manikonda & Puppalaguda:</strong> Adjacent to the IT corridor, these areas offer a mix of mid-segment and luxury apartments, benefiting from spillover demand and ongoing infrastructure upgrades.</li>\\n</ul>\\n\\n<h3>2. The North-West Growth Corridor (Emerging Hotspots)</h3>\\n<ul>\\n    <li><strong>Tellapur & Kollur:</strong> Located along the ORR, these areas are witnessing large-scale plotted developments and gated communities. Their proximity to the IT hub and future connectivity projects make them ideal for long-term appreciation.</li>\\n    <li><strong>Mokila & Shankarpally:</strong> Offering a serene environment with excellent connectivity to the ORR and IT hubs, these areas are becoming popular for villas and plotted developments, attracting those seeking a quieter yet connected lifestyle.</li>\\n</ul>\\n\\n<h3>3. The Northern Corridor (Connectivity & Lifestyle)</h3>\\n<ul>\\n    <li><strong>Kompally & Medchal:</strong> These northern suburbs offer a blend of affordability, good connectivity (NH-44), and established social infrastructure. They are popular for plotted developments, villas, and mid-segment apartments, appealing to families.</li>\\n    <li><strong>Bachupally & Miyapur:</strong> While more developed, these areas continue to offer investment opportunities due to their robust social infrastructure, metro connectivity, and proximity to educational institutions and commercial centers.</li>\\n</ul>\\n\\n<h3>4. The South-East Corridor (Future Growth Hubs)</h3>\\n<ul>\\n    <li><strong>Adibatla:</strong> Home to the Aerospace Park and TCS SEZ, Adibatla is poised for significant growth. Its proximity to the ORR and industrial clusters makes it attractive for both residential and commercial investments, especially for those with a long-term vision.</li>\\n    <li><strong>Pharma City (Mucherla area):</strong> While a long-term play, the upcoming Hyderabad Pharma City, one of the world\'s largest pharma clusters, will eventually create massive demand for residential and commercial spaces in its vicinity, making early investment strategic.</li>\\n</ul>\\n\\n<h2>Factors to Consider Before Investing in Hyderabad</h2>\\n<p>To make an informed investment decision, always consider the following:</p>\\n<ul>\\n    <li><strong>Location & Connectivity:</strong> Assess proximity to workplaces, essential services, and major transport arteries (ORR, Metro).</li>\\n    <li><strong>Infrastructure Development:</strong> Look for areas with planned or ongoing infrastructure projects that will enhance future value.</li>\\n    <li><strong>Social Amenities:</strong> Access to schools, hospitals, shopping centers, and entertainment zones is crucial for livability and rental demand.</li>\\n    <li><strong>Developer Reputation:</strong> Invest with reputable developers who have a proven track record of timely delivery and quality construction.</li>\\n    <li><strong>Legal Due Diligence:</strong> Ensure all property documents are clear and legally sound.</li>\\n    <li><strong>Future Growth Potential:</strong> Research upcoming government projects, industrial corridors, and employment hubs that could impact the area\'s appreciation.</li>\\n</ul>\\n\\n<h2>Conclusion</h2>\\n<p>Hyderabad\'s real estate market in 2026 is set to offer a plethora of opportunities for discerning investors. From the premium high-rises of Kokapet to the sprawling plotted developments of Tellapur, and the industrial growth of Adibatla, the city caters to diverse investment appetites. By staying informed about the latest trends and focusing on high-growth micro-markets, investors can unlock significant returns in one of India\'s most promising real estate destinations. Always conduct thorough research and consider consulting with local real estate experts like Westside Realty to navigate the market effectively.</p>",\n  "description": "Planning to invest in Hyderabad in 2026? This expert guide reveals the hottest property trends, emerging growth corridors, and lucrative opportunities in the city\'s dynamic real estate market.",\n  "author": "Westside Realty",\n  "date": "2025-12-23",\n  "status": "published",\n  "category": "Real Estate Investment",\n  "seo_title": "Hyderabad Real Estate Investment Guide 2026: Top Micro-Markets & Trends",\n  "seo_description": "Planning to invest in Hyderabad in 2026? This expert guide reveals the hottest property trends, emerging growth corridors, and lucrative opportunities in the city\'s dynamic real estate market.",\n  "read_time": "6 min",\n  "topic_cluster": "Real Estate Investment",\n  "is_pillar_article": false\n}\n```'
  }],
  'role': 'model'
};

// Cover image URL - using a high-quality stock image for Hyderabad real estate
const COVER_IMAGE_URL = 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80';

/**
 * Parse JSON from Gemini response format
 */
function parseGeminiJSON(geminiResponse) {
  try {
    const textContent = geminiResponse.parts[0].text;
    // Extract JSON from markdown code block - handle both \n and actual newlines
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const jsonString = jsonMatch[1];
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing Gemini JSON:', error);
    console.error('Text content:', geminiResponse.parts[0].text.substring(0, 200) + '...');
    throw error;
  }
}

/**
 * Download image from URL and return as Buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload image to Supabase storage
 */
async function uploadImageToSupabase(imageBuffer, fileName) {
  try {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Insert article into blog_articles table
 */
async function insertArticle(articleData, imageUrl) {
  try {
    const { data, error } = await supabase
      .from('blog_articles')
      .insert({
        slug: articleData.slug,
        title: articleData.title,
        content: articleData.content,
        description: articleData.description,
        author: articleData.author,
        date: articleData.date,
        status: articleData.status,
        image_url: imageUrl,
        seo_title: articleData.seo_title,
        seo_description: articleData.seo_description,
        read_time: articleData.read_time,
        topic_cluster: articleData.topic_cluster,
        is_pillar_article: articleData.is_pillar_article,
        related_article_ids: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      throw new Error(`Failed to insert article: ${error.message}`);
    }

    return data[0];
  } catch (error) {
    console.error('Error inserting article:', error);
    throw error;
  }
}

/**
 * Main function to publish the article
 */
async function publishArticle() {
  try {
    console.log('🚀 Starting article publication process...');

    // Step 1: Parse Gemini JSON data
    console.log('📝 Parsing article data from Gemini response...');
    const articleData = parseGeminiJSON(geminiResponse);
    console.log(`✅ Parsed article: "${articleData.title}"`);

    // Step 2: Download and upload cover image
    console.log('🖼️  Processing cover image...');
    const imageBuffer = await downloadImage(COVER_IMAGE_URL);
    const fileName = `${articleData.slug}-cover-${Date.now()}.jpg`;
    const imageUrl = await uploadImageToSupabase(imageBuffer, fileName);
    console.log(`✅ Image uploaded successfully: ${imageUrl}`);

    // Step 3: Insert article into database
    console.log('💾 Inserting article into database...');
    const insertedArticle = await insertArticle(articleData, imageUrl);
    console.log(`✅ Article published successfully with ID: ${insertedArticle.id}`);

    console.log('\\n🎉 Article publication completed!');
    console.log(`📄 Title: ${insertedArticle.title}`);
    console.log(`🔗 Slug: ${insertedArticle.slug}`);
    console.log(`📅 Date: ${insertedArticle.date}`);
    console.log(`🏷️  Category: ${articleData.category}`);

    return insertedArticle;

  } catch (error) {
    console.error('❌ Error publishing article:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  publishArticle();
}

module.exports = { publishArticle, parseGeminiJSON };
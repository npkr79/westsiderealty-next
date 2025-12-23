#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://imqlfztriragzypplbqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWxmenRyaXJhZ3p5cHBsYnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg1NTQxMCwiZXhwIjoyMDYyNDMxNDEwfQ.YKK-usj8GIwOY6sZD203lY1FauidsZX6o_pH4xs_gTg';

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Gemini response data (as provided, but completed due to MAX_TOKENS truncation)
const geminiResponse = {
  content: {
    parts: [{
      text: '```json\n{\n  "slug": "beyond-the-at-symbol-unpacking-the-significance-of-your-email-address",\n  "title": "Beyond the @ Symbol: Unpacking the Significance of Your Email Address",\n  "content": "<p>In our increasingly digital world, few pieces of information are as ubiquitous and fundamental as the email address. It\'s the digital equivalent of a home address, a phone number, and a passport all rolled into one. From signing up for social media to receiving vital work communications, your email address is the central hub of your online life. Yet, for something so critical, its true significance and the best practices surrounding its use are often overlooked. Let\'s delve into what an email address truly represents and why choosing the right one matters more than you might think.</p><p>Your email address is more than just a string of characters separated by an @ symbol. It\'s your digital identity, your professional brand, and often the first impression you make in the online world. Whether you\'re applying for a job, networking with colleagues, or simply signing up for a service, your email address speaks volumes about your professionalism and attention to detail.</p><p>The anatomy of an email address is simple yet significant. The local part (before the @) represents you, while the domain (after the @) represents your chosen email provider or organization. This combination creates a unique identifier that follows you throughout your digital journey. Understanding this structure is crucial for making informed decisions about your online presence.</p><p>When choosing an email address, consider longevity, professionalism, and memorability. Avoid using numbers, special characters, or references that might become outdated. Your email address should be something you\'re comfortable sharing in professional settings and something that will remain relevant for years to come.</p>"\n}\n```'
    }],
    role: 'model'
  },
  finishReason: 'MAX_TOKENS',
  index: 0
};

// Sample cover image URL (using a working placeholder service)
const coverImageUrl = 'https://picsum.photos/800/600';

/**
 * Download image from URL
 */
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
      file.on('error', (err) => {
        fs.unlink(filename, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse Gemini JSON response
 */
function parseGeminiResponse(response) {
  try {
    // Extract the JSON from the text content
    const jsonText = response.content.parts[0].text;
    
    // Remove the ```json wrapper if present
    const cleanJsonText = jsonText.replace(/```json\n?/, '').replace(/```$/, '');
    
    // Parse the JSON
    const articleData = JSON.parse(cleanJsonText);
    
    console.log('✅ Successfully parsed Gemini response');
    console.log('Article slug:', articleData.slug);
    console.log('Article title:', articleData.title);
    
    return articleData;
  } catch (error) {
    console.error('❌ Error parsing Gemini response:', error);
    throw error;
  }
}

/**
 * Create bucket if it doesn't exist
 */
async function ensureBucketExists() {
  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('⚠️ Could not list buckets:', listError.message);
    } else {
      console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', '));
    }
    
    // Try to create the bucket
    const { data, error } = await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && !error.message.includes('already exists')) {
      console.log('⚠️ Could not create bucket:', error.message);
    } else if (!error) {
      console.log('✅ Bucket created successfully');
    } else {
      console.log('ℹ️ Bucket already exists');
    }
  } catch (error) {
    console.log('⚠️ Error with bucket operations:', error);
  }
}

/**
 * Upload image to Supabase storage
 */
async function uploadCoverImage(imagePath, slug) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = `${slug}-cover.jpg`;
    
    console.log('📤 Uploading cover image to Supabase storage...');
    
    // Ensure bucket exists first
    await ensureBucketExists();
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(`${fileName}`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${fileName}`);

    console.log('✅ Image uploaded successfully');
    console.log('Image URL:', publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
}

/**
 * Insert article into blog_articles table
 */
async function insertArticle(articleData, imageUrl) {
  try {
    console.log('📝 Inserting article into database...');
    
    // Calculate estimated read time (assuming 200 words per minute)
    const wordCount = articleData.content.split(' ').length;
    const readTime = Math.ceil(wordCount / 200);
    
    // Generate SEO description from content
    const seoDescription = articleData.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 160) + '...'; // Limit to 160 characters
    
    const articleRecord = {
      slug: articleData.slug,
      title: articleData.title,
      content: articleData.content,
      description: seoDescription,
      author: 'Admin', // Default author
      date: new Date().toISOString().split('T')[0], // Today's date
      status: 'published',
      category: 'Technology', // Default category
      image_url: imageUrl,
      seo_title: articleData.title,
      seo_description: seoDescription,
      read_time: readTime,
      topic_cluster: 'Digital Communication',
      is_pillar_article: false,
      related_article_ids: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('blog_articles')
      .insert([articleRecord])
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ Article inserted successfully');
    console.log('Article ID:', data[0].id);
    console.log('Article slug:', data[0].slug);
    
    return data[0];
  } catch (error) {
    console.error('❌ Error inserting article:', error);
    throw error;
  }
}

/**
 * Main function to publish the article
 */
async function publishArticle() {
  try {
    console.log('🚀 Starting article publishing process...\n');
    
    // Step 1: Parse Gemini response
    console.log('1️⃣ Parsing Gemini response...');
    const articleData = parseGeminiResponse(geminiResponse);
    
    // Step 2: Download cover image
    console.log('\n2️⃣ Downloading cover image...');
    const tempImagePath = path.join(__dirname, 'temp-cover-image.jpg');
    await downloadImage(coverImageUrl, tempImagePath);
    console.log('✅ Image downloaded successfully');
    
    // Step 3: Upload image to Supabase
    console.log('\n3️⃣ Uploading image to Supabase...');
    const imageUrl = await uploadCoverImage(tempImagePath, articleData.slug);
    
    // Step 4: Insert article into database
    console.log('\n4️⃣ Inserting article into database...');
    const insertedArticle = await insertArticle(articleData, imageUrl);
    
    // Step 5: Cleanup temp file
    console.log('\n5️⃣ Cleaning up temporary files...');
    fs.unlinkSync(tempImagePath);
    console.log('✅ Temporary files cleaned up');
    
    console.log('\n🎉 Article published successfully!');
    console.log('📄 Article Details:');
    console.log(`   • Title: ${insertedArticle.title}`);
    console.log(`   • Slug: ${insertedArticle.slug}`);
    console.log(`   • Status: ${insertedArticle.status}`);
    console.log(`   • Read Time: ${insertedArticle.read_time} minutes`);
    console.log(`   • Image URL: ${insertedArticle.image_url}`);
    
    return insertedArticle;
    
  } catch (error) {
    console.error('\n💥 Error publishing article:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  publishArticle();
}

export { publishArticle, parseGeminiResponse };
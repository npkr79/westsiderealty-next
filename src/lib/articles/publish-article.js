const { supabase } = require('./supabase-server');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Article data extracted from Gemini JSON
const articleData = {
  "slug": "understanding-sample-user-example-com-more-than-just-a-placeholder",
  "title": "Understanding `sample.user@example.com`: More Than Just a Placeholder",
  "content": "<p>Ever filled out an online form, read a tutorial, or browsed documentation and come across the email address <code>sample.user@example.com</code>? While it might seem like a random string, this specific email address, along with others ending in <code>@example.com</code>, <code>@example.org</code>, and <code>@example.net</code>, plays a crucial role in the digital world. It's far more than just a placeholder; it's a standard defined to enhance privacy, facilitate testing, and improve clarity in online communications.</p>\n\n<h2>The Purpose Behind <code>sample.user@example.com</code></h2>\n<p>At its core, <code>sample.user@example.com</code> serves as a universal, non-functional email address. It's part of a set of domain names (<code>example.com</code>, <code>example.org</code>, <code>example.net</code>) specifically reserved by the Internet Assigned Numbers Authority (IANA) for use in documentation, examples, and testing. This reservation ensures that these domains will never be registered to a real entity, preventing accidental emails from being sent to someone's personal inbox or causing confusion.</p>\n\n<h3>Enhancing Privacy and Security</h3>\n<ul>\n    <li><strong>Protecting Real Users:</strong> Imagine if every tutorial used a real person's email address. That person would be bombarded with test emails and potentially exposed to spam. Using <code>sample.user@example.com</code> prevents this, safeguarding the privacy of individuals.</li>\n    <li><strong>Avoiding Data Leaks:</strong> In development or testing environments, using real user data, even for email addresses, can lead to security vulnerabilities. Sample addresses allow developers to demonstrate functionality without compromising sensitive information.</li>\n</ul>\n\n<h3>Facilitating Education and Documentation</h3>\n<ul>\n    <li><strong>Clear Examples:</strong> When explaining how to set up an email client, demonstrate a registration process, or illustrate a database schema, using <code>sample.user@example.com</code> provides a clear, unambiguous example. Users understand it's illustrative and not a live address.</li>\n    <li><strong>Standardization:</strong> Its widespread recognition as a non-working address makes it a universally understood symbol for \"email address example,\" streamlining communication across different platforms and languages.</li>\n</ul>\n\n<h3>Aiding Development and Testing</h3>\n<ul>\n    <li><strong>Sandbox Environments:</strong> Developers often use these addresses in testing environments to simulate user interactions without affecting live systems or sending out unintended notifications.</li>\n    <li><strong>Code Examples:</strong> From coding tutorials to API documentation, <code>sample.user@example.com</code> is a staple for demonstrating email-related functions, such as validation, parsing, or sending mechanisms, without needing a legitimate email server.</li>\n</ul>\n\n<h2>Where You'll Encounter <code>sample.user@example.com</code></h2>\n<p>You'll find this ubiquitous email address in a variety of contexts:</p>\n<ul>\n    <li><strong>Software Documentation:</strong> Manuals for web applications, operating systems, and developer tools frequently use it to show how email fields should be formatted or how email-related features work.</li>\n    <li><strong>Online Tutorials and Guides:</strong> Step-by-step instructions for setting up accounts, configuring services, or demonstrating form submissions often feature it.</li>\n    <li><strong>Web Development Examples:</strong> Front-end and back-end code snippets, especially those involving user authentication or contact forms, commonly employ <code>sample.user@example.com</code>.</li>\n    <li><strong>Academic Papers and Technical Specifications:</strong> When discussing internet protocols or data structures, it serves as a neutral example.</li>\n</ul>\n\n<h2>Best Practices and What Not to Do</h2>\n<p>While <code>sample.user@example.com</code> is incredibly useful, it's vital to understand its limitations:</p>\n<ul>\n    <li><strong>Do Not Send Real Emails To It:</strong> Remember, emails sent to <code>@example.com</code> addresses will simply vanish. They are not delivered to anyone.</li>\n    <li><strong>Do Not Use It for Real Registrations:</strong> Never use <code>sample.user@example.com</code> when signing up for actual services, newsletters, or accounts. You won't receive confirmation emails, password resets, or important notifications, rendering the account unusable.</li>\n    <li><strong>Recognize Its Purpose:</strong> Always interpret <code>sample.user@example.com</code> as an indicator that the email address shown is for illustrative purposes only.</li>\n</ul>\n\n<h2>Conclusion</h2>\n<p>The humble <code>sample.user@example.com</code> is a testament to thoughtful internet design. By providing a universally recognized, non-functional email address, it enables clearer communication, protects user privacy, and streamlines development and testing processes across the digital landscape. Next time you see it, you'll know it's not just a random placeholder, but a deliberate tool designed to make our online world a little bit safer and a lot more understandable.</p>",
  "description": "Discover the crucial role of `sample.user@example.com` in the digital world, from protecting privacy and facilitating testing to enhancing clarity in documentation and online tutorials.",
  "author": "Westside Realty",
  "date": "2023-10-27",
  "status": "published",
  "category": "sample.user@example.com",
  "seo_title": "Sample.user@example.com: Purpose, Privacy, & Use Cases",
  "seo_description": "Learn why sample.user@example.com is crucial for privacy, testing, and documentation. Understand its role in web development, tutorials, and online safety.",
  "read_time": "3 min",
  "topic_cluster": "Digital Literacy & Web Standards",
  "is_pillar_article": false
};

// Function to download image from URL (placeholder for now since URL is just text)
async function downloadImage(url, filename) {
  // Since the provided URL is just "sample.user@example.com" (not a valid image URL),
  // we'll create a placeholder image or skip this step
  console.log(`Note: Cover image URL "${url}" is not a valid image URL. Skipping image upload.`);
  return null;
}

// Function to upload image to Supabase storage
async function uploadImageToSupabase(imageBuffer, filename) {
  try {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(`public/${filename}`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`public/${filename}`);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    return null;
  }
}

// Function to insert article into database
async function insertArticle(articleData, imageUrl = null) {
  try {
    const articleRecord = {
      slug: articleData.slug,
      title: articleData.title,
      content: articleData.content,
      description: articleData.description,
      author: articleData.author,
      date: articleData.date,
      status: articleData.status,
      category: articleData.category,
      image_url: imageUrl,
      seo_title: articleData.seo_title,
      seo_description: articleData.seo_description,
      read_time: articleData.read_time,
      topic_cluster: articleData.topic_cluster,
      is_pillar_article: articleData.is_pillar_article,
      related_article_ids: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('blog_articles')
      .insert([articleRecord])
      .select();

    if (error) {
      console.error('Error inserting article:', error);
      throw error;
    }

    console.log('Article inserted successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error in insertArticle:', error);
    throw error;
  }
}

// Main function to publish article
async function publishArticle() {
  try {
    console.log('Starting article publication process...');
    
    console.log('Article data loaded:', articleData.title);

    // Handle cover image (skip for now since URL is not valid)
    console.log('Handling cover image...');
    const coverImageUrl = "sample.user@example.com"; // This is not a valid image URL
    let imageUrl = null;
    
    if (coverImageUrl && coverImageUrl.startsWith('http')) {
      // Only attempt to download if it's a valid URL
      const imageBuffer = await downloadImage(coverImageUrl, `${articleData.slug}-cover.jpg`);
      if (imageBuffer) {
        imageUrl = await uploadImageToSupabase(imageBuffer, `${articleData.slug}-cover.jpg`);
      }
    } else {
      console.log('Skipping image upload - no valid image URL provided');
    }

    // Insert article into database
    console.log('Inserting article into database...');
    const insertedArticle = await insertArticle(articleData, imageUrl);

    console.log('\n✅ Article published successfully!');
    console.log(`📝 Title: ${insertedArticle.title}`);
    console.log(`🔗 Slug: ${insertedArticle.slug}`);
    console.log(`📅 Date: ${insertedArticle.date}`);
    console.log(`🏷️ Category: ${insertedArticle.category}`);
    console.log(`📊 Status: ${insertedArticle.status}`);
    
    return insertedArticle;
  } catch (error) {
    console.error('❌ Error publishing article:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  publishArticle()
    .then(() => {
      console.log('\n🎉 Article publication completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { publishArticle };
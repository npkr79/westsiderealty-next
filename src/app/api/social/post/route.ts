import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { post_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { post_id } = body;
  const supabase = createServiceClient();

  const { data: post, error: fetchError } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', post_id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const platforms: string[] = post.platforms ?? [];
  const results: Record<string, boolean> = { facebook: false, instagram: false, linkedin: false };

  const fbPageId = process.env.FACEBOOK_PAGE_ID;
  const fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const liClientId = process.env.LINKEDIN_CLIENT_ID;
  const liClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const liCompanyId = process.env.LINKEDIN_COMPANY_ID;

  // ── Facebook ──
  if (platforms.includes('Facebook') && fbPageId && fbToken) {
    try {
      if (post.image_url) {
        const res = await fetch(`https://graph.facebook.com/v18.0/${fbPageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: post.image_url, caption: post.caption_facebook, access_token: fbToken }),
        });
        results.facebook = res.ok;
      } else {
        const res = await fetch(`https://graph.facebook.com/v18.0/${fbPageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: post.caption_facebook, access_token: fbToken }),
        });
        results.facebook = res.ok;
      }
    } catch (e) {
      console.error('[social/post] Facebook error:', e);
    }
  }

  // ── Instagram ──
  if (platforms.includes('Instagram') && fbPageId && fbToken && post.image_url) {
    try {
      // Get IG account ID
      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${fbPageId}?fields=instagram_business_account&access_token=${fbToken}`
      );
      const igData = await igRes.json();
      const igAccountId = igData?.instagram_business_account?.id;

      if (igAccountId) {
        // Step 1: Create container
        const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: post.image_url, caption: post.caption_instagram, access_token: fbToken }),
        });
        const containerData = await containerRes.json();
        const creationId = containerData?.id;

        // Step 2: Publish
        if (creationId) {
          const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: creationId, access_token: fbToken }),
          });
          results.instagram = publishRes.ok;
        }
      }
    } catch (e) {
      console.error('[social/post] Instagram error:', e);
    }
  }

  // ── LinkedIn ──
  if (platforms.includes('LinkedIn') && liClientId && liClientSecret && liCompanyId) {
    try {
      // Get access token
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: liClientId,
          client_secret: liClientSecret,
        }),
      });
      const tokenData = await tokenRes.json();
      const liToken: string = tokenData?.access_token;

      if (liToken) {
        const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${liToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            author: `urn:li:organization:${liCompanyId}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: post.caption_linkedin },
                shareMediaCategory: post.image_url ? 'IMAGE' : 'NONE',
                media: post.image_url
                  ? [{ status: 'READY', originalUrl: post.image_url }]
                  : [],
              },
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
          }),
        });
        results.linkedin = postRes.ok;
      }
    } catch (e) {
      console.error('[social/post] LinkedIn error:', e);
    }
  }

  // ── Update post status ──
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { status: 'published' };
  if (platforms.includes('Facebook')) updates.posted_facebook_at = now;
  if (platforms.includes('Instagram')) updates.posted_instagram_at = now;
  if (platforms.includes('LinkedIn')) updates.posted_linkedin_at = now;

  await supabase.from('social_posts').update(updates).eq('id', post_id);

  return NextResponse.json({ success: true, results });
}

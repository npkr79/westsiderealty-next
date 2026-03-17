import { createServiceClient } from '@/lib/supabase/serviceClient';

function captionWithHashtags(caption: string, hashtags: string[] | null): string {
  if (!hashtags?.length) return caption;
  return caption + '\n\n' + hashtags.map((h) => '#' + h).join(' ');
}

interface SocialPost {
  id: string;
  platform: string;
  content_type?: string;
  caption?: string;
  hashtags?: string[];
  image_url?: string;
  article_title?: string;
  article_body?: string;
  title?: string;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  platform_post_id: string | null;
  error: string | null;
}

export async function publishPost(post: SocialPost): Promise<PublishResult> {
  const fbPageId = process.env.FACEBOOK_PAGE_ID;
  const fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const liClientId = process.env.LINKEDIN_CLIENT_ID;
  const liClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const liCompanyId = process.env.LINKEDIN_COMPANY_ID;

  let platform_post_id: string | null = null;
  let post_error: string | null = null;
  let success = false;

  // ── Facebook ──
  if (post.platform === 'Facebook' && fbPageId && fbToken) {
    try {
      const message = captionWithHashtags(post.caption ?? '', post.hashtags ?? null);
      let res: Response;
      if (post.image_url) {
        res = await fetch(`https://graph.facebook.com/v18.0/${fbPageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: post.image_url, caption: message, access_token: fbToken }),
        });
      } else {
        res = await fetch(`https://graph.facebook.com/v18.0/${fbPageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, access_token: fbToken }),
        });
      }
      const resData = await res.json();
      if (res.ok && resData.id) {
        platform_post_id = resData.id;
        success = true;
      } else {
        post_error = resData.error?.message ?? 'Facebook post failed';
      }
    } catch (e) {
      post_error = e instanceof Error ? e.message : 'Facebook post failed';
      console.error('[publishPost] Facebook error:', e);
    }
  }

  // ── Instagram ──
  if (post.platform === 'Instagram' && fbPageId && fbToken && post.image_url) {
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${fbPageId}?fields=instagram_business_account&access_token=${fbToken}`
      );
      const igData = await igRes.json();
      const igAccountId = igData?.instagram_business_account?.id;

      if (!igAccountId) {
        post_error = 'No Instagram account connected';
      } else {
        const caption = captionWithHashtags(post.caption ?? '', post.hashtags ?? null);
        const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: post.image_url, caption, access_token: fbToken }),
        });
        const containerData = await containerRes.json();
        const creationId = containerData?.id;

        if (!creationId) {
          post_error = containerData.error?.message ?? 'Instagram container creation failed';
        } else {
          const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: creationId, access_token: fbToken }),
          });
          const publishData = await publishRes.json();
          if (publishRes.ok && publishData.id) {
            platform_post_id = publishData.id;
            success = true;
          } else {
            post_error = publishData.error?.message ?? 'Instagram publish failed';
          }
        }
      }
    } catch (e) {
      post_error = e instanceof Error ? e.message : 'Instagram post failed';
      console.error('[publishPost] Instagram error:', e);
    }
  }

  // ── LinkedIn ──
  if (post.platform === 'LinkedIn' && liClientId && liClientSecret && liCompanyId) {
    try {
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

      if (!liToken) {
        post_error = 'LinkedIn token fetch failed';
      } else if (post.content_type === 'article') {
        const articleRes = await fetch('https://api.linkedin.com/v2/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${liToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            author: `urn:li:organization:${liCompanyId}`,
            title: post.article_title,
            content: { contentEntities: [], description: post.article_body },
            distribution: { linkedInDistributionTarget: {} },
            subject: post.article_title,
            text: { text: post.article_body },
          }),
        });
        const articleData = await articleRes.json();
        if (articleRes.ok) {
          platform_post_id = articleData.id ?? null;
          success = true;
        } else {
          post_error = articleData.message ?? 'LinkedIn article post failed';
        }
      } else {
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
                shareCommentary: { text: post.caption },
                shareMediaCategory: post.image_url ? 'IMAGE' : 'NONE',
                media: post.image_url
                  ? [{ status: 'READY', originalUrl: post.image_url, title: { text: post.title ?? '' } }]
                  : [],
              },
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
          }),
        });
        const postData = await postRes.json();
        if (postRes.ok) {
          platform_post_id = postData.id ?? null;
          success = true;
        } else {
          post_error = postData.message ?? 'LinkedIn post failed';
        }
      }
    } catch (e) {
      post_error = e instanceof Error ? e.message : 'LinkedIn post failed';
      console.error('[publishPost] LinkedIn error:', e);
    }
  }

  // Update social_posts record
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  await supabase
    .from('social_posts')
    .update({
      status: success ? 'published' : 'draft',
      posted_at: success ? now : null,
      platform_post_id: platform_post_id ?? null,
      post_error: post_error ?? null,
      updated_at: now,
    })
    .eq('id', post.id);

  return { success, platform: post.platform, platform_post_id, error: post_error };
}

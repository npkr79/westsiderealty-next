import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { applyBoldUnicode } from '@/lib/social/publishPost';

// POST /api/social/share-article
// Body: { article_id: string, platform: 'Facebook' | 'LinkedIn' }
// Posts the article directly to the company/organisation page using
// existing credentials — no social_posts queue record needed.

export async function POST(request: NextRequest) {
  let body: { article_id: string; platform: 'Facebook' | 'LinkedIn' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { article_id, platform } = body;
  if (!article_id || !platform) {
    return NextResponse.json({ error: 'article_id and platform required' }, { status: 400 });
  }

  // Fetch article
  const supabase = createServiceClient();
  const { data: article, error: fetchError } = await supabase
    .from('generated_articles')
    .select('slug, seo_headline, meta_description, city, micro_market, image_url')
    .eq('id', article_id)
    .single();

  if (fetchError || !article || !article.slug) {
    return NextResponse.json({ error: 'Article not found or not published' }, { status: 404 });
  }

  const articleUrl = `https://www.westsiderealty.in/news-articles/${article.slug}`;

  // Build caption
  const tags = buildHashtags(article.city, article.micro_market);
  const caption = `${article.seo_headline}\n\n${article.meta_description}\n\nRead more: ${articleUrl}\n\n${tags}`;
  const text = applyBoldUnicode(caption);

  // ── Facebook Page ──────────────────────────────────────────────────────────
  if (platform === 'Facebook') {
    const fbPageId = process.env.FACEBOOK_PAGE_ID;
    const fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!fbPageId || !fbToken) {
      return NextResponse.json({ error: 'Facebook credentials not configured' }, { status: 500 });
    }

    try {
      let res: Response;
      if (article.image_url) {
        // Post with image
        res = await fetch(`https://graph.facebook.com/v18.0/${fbPageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: article.image_url, caption: text, access_token: fbToken }),
        });
      } else {
        // Text + link post
        res = await fetch(`https://graph.facebook.com/v18.0/${fbPageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, link: articleUrl, access_token: fbToken }),
        });
      }

      const data = await res.json();
      if (res.ok && data.id) {
        return NextResponse.json({ success: true, platform_post_id: data.id });
      }
      return NextResponse.json({ error: data.error?.message ?? 'Facebook post failed' }, { status: 500 });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Facebook post failed' }, { status: 500 });
    }
  }

  // ── LinkedIn Organisation Page ────────────────────────────────────────────
  if (platform === 'LinkedIn') {
    const liAccessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const liCompanyId = process.env.LINKEDIN_COMPANY_ID;

    if (!liAccessToken) {
      return NextResponse.json({ error: 'LinkedIn access token not configured' }, { status: 500 });
    }
    if (!liCompanyId) {
      return NextResponse.json({ error: 'LINKEDIN_COMPANY_ID not configured' }, { status: 500 });
    }

    try {
      const orgUrn = `urn:li:organization:${liCompanyId}`;

      const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${liAccessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: orgUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text },
              shareMediaCategory: 'ARTICLE',
              media: [
                {
                  status: 'READY',
                  originalUrl: articleUrl,
                  title: { text: article.seo_headline },
                  description: { text: article.meta_description ?? '' },
                },
              ],
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });

      const postData = await postRes.json();
      if (postRes.ok) {
        return NextResponse.json({ success: true, platform_post_id: postData.id ?? null });
      }

      // If org posting failed due to permissions, try personal profile as fallback
      const errMsg: string = postData.message ?? JSON.stringify(postData);
      const isPermissionError =
        postData.status === 403 ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('not authorized') ||
        errMsg.toLowerCase().includes('w_organization_social');

      if (isPermissionError) {
        return NextResponse.json({
          error: `LinkedIn company page posting requires the w_organization_social scope. Current token only supports personal profile posting. Please update the LinkedIn access token with organisation permissions.`,
        }, { status: 403 });
      }

      return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'LinkedIn post failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CITY_LABELS: Record<string, string> = {
  hyderabad: 'Hyderabad', goa: 'Goa', mumbai: 'Mumbai', delhi_ncr: 'DelhiNCR',
  bengaluru: 'Bengaluru', pune: 'Pune', chennai: 'Chennai', kolkata: 'Kolkata',
  ahmedabad: 'Ahmedabad', kochi: 'Kochi', navi_mumbai_thane: 'NaviMumbai',
  maharashtra: 'Maharashtra', india: 'India',
};

function buildHashtags(city: string, microMarket: string): string {
  const tags = new Set<string>(['RealEstate', 'REMAX', 'WestsideRealty']);
  const cityLabel = CITY_LABELS[city];
  if (cityLabel) tags.add(cityLabel);
  if (microMarket) {
    const clean = microMarket.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '');
    if (clean.length > 1) tags.add(clean);
  }
  return Array.from(tags).map((t) => `#${t}`).join(' ');
}

const CANVA_API_BASE = "https://api.canva.com/rest/v1";

async function getAccessToken(): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${siteUrl}/api/canva/token`);
  const data = await res.json() as { valid: boolean; access_token?: string; error?: string };
  if (!data.valid || !data.access_token) {
    throw new Error(data.error ?? "Canva token not available — connect Canva first");
  }
  return data.access_token;
}

export async function uploadAudioAsset(
  audioUrl: string,
  filename: string
): Promise<string> {
  const token = await getAccessToken();

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Failed to fetch audio from ${audioUrl}`);
  const audioBuffer = await audioRes.arrayBuffer();

  const res = await fetch(`${CANVA_API_BASE}/assets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Asset-Name": filename,
      "Asset-Parent-Folder-Id": process.env.CANVA_UPLOAD_FOLDER_ID!,
    },
    body: audioBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Canva asset upload failed: ${err}`);
  }

  const data = await res.json() as { asset: { id: string } };
  return data.asset.id;
}

export async function createDesignFromTemplate(
  title: string
): Promise<{ design_id: string; edit_url: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${CANVA_API_BASE}/designs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_type: { type: "preset", name: "InstagramReel" },
      title,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Canva design creation failed: ${err}`);
  }

  const data = await res.json() as { design: { id: string; urls: { edit_url: string } } };
  return {
    design_id: data.design.id,
    edit_url: data.design.urls.edit_url,
  };
}

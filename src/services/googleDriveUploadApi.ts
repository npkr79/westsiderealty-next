
export async function uploadFileToGoogleDriveViaEdge(file: File): Promise<{url: string; id: string; name: string; mimeType: string}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    "https://imqlfztriragzypplbqa.functions.supabase.co/google-drive-upload", {
      method: "POST",
      body: formData
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to upload file");
  }
  return await res.json();
}

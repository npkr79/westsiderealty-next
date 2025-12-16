
export async function uploadImageToGoogleDrive(file: File, folderId: string, accessToken: string): Promise<string> {
  const metadata = {
    name: file.name,
    parents: [folderId]
  };
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
      body: form
    }
  );

  if (!res.ok) throw new Error("Google Drive upload failed");

  const data = await res.json();
  const fileId = data.id;

  // Set the file as public-read
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone"
    })
  });

  // Return the direct view link
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

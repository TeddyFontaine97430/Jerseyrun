"use client";

import { upload } from "@vercel/blob/client";

export async function uploadImageClient(file: File, folder: string): Promise<string> {
  const blob = await upload(`${folder}/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}

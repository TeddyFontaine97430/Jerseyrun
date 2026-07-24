import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {}

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Format d'image non supporté (JPEG, PNG, WEBP ou GIF requis).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadError("L'image dépasse la taille maximale de 5 Mo.");
  }

  const extension = EXTENSION_BY_TYPE[file.type];
  const pathname = `${folder}/${crypto.randomUUID()}.${extension}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}

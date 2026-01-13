// lib/uploadBase64ToFirebase.ts
import { v4 as uuidv4 } from "uuid";
import { bucket } from "./firebaseAdmin";

function stripDataUrl(b64: string): string {
  return b64.startsWith("data:") ? b64.split(",")[1] : b64;
}
function normalizeMime(m?: string): string {
  const clean = (m || "").split(";")[0].trim().toLowerCase();
  if (!clean) return "application/octet-stream";
  if (clean === "audio/opus") return "audio/ogg";
  return clean;
}
function safeObjectPath(p: string): string {
  return p.replace(/[^a-z0-9/_\-.]/gi, "_");
}

export async function uploadBase64ToFirebase(
  base64: string,
  objectPath: string,
  contentType: string
): Promise<string> {
  const cleanB64 = stripDataUrl(base64);
  const buffer = Buffer.from(cleanB64, "base64");
  if (buffer.byteLength < 1024) {
    throw new Error(`Conteúdo muito pequeno (${buffer.byteLength} bytes).`);
  }

  const mime = normalizeMime(contentType);
  const path = safeObjectPath(objectPath);
  const token = uuidv4();

  const file = bucket.file(path);
  await file.save(buffer, {
    resumable: false,
    validation: "md5",
    metadata: {
      contentType: mime,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return `https://firebasestorage.googleapis.com/v0/b/${
    bucket.name
  }/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

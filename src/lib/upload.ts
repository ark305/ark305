"use client";

import { archie } from "./archie/browser";

// Achica la foto en el teléfono (máx. 1600 px, JPG) y la sube al almacenamiento de Archie.
async function shrink(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85));
}

export async function uploadPhoto(file: File, uid: string, kind: string): Promise<string> {
  const blob = await shrink(file);
  const files = archie().files;
  const res = await files.upload(blob, { filename: `${kind}-${uid}-${Date.now()}.jpg`, contentType: "image/jpeg" });
  const url = res.url ?? (await files.getUrl(res.fileId));
  if (!url) throw new Error("upload_url");
  return url;
}

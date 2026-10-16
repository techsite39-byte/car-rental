import { createHash } from "node:crypto";

export const MAX_VEHICLE_IMAGE_BYTES = 5 * 1024 * 1024;

export class ImageStorageConfigurationError extends Error {
  constructor() {
    super("Vehicle image storage is not configured. Add the Cloudinary server credentials.");
    this.name = "ImageStorageConfigurationError";
  }
}

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export function supportedVehicleImage(file: File) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const allowedExtensions = /\.(jpe?g|png|webp)$/i;
  return allowedTypes.has(file.type.toLowerCase()) || allowedExtensions.test(file.name);
}

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return isJpeg || isPng || isWebp;
}

export async function uploadVehicleImage(file: File) {
  if (!supportedVehicleImage(file)) {
    throw new ImageUploadError("Choose a JPG, JPEG, PNG, or WebP image.");
  }
  if (file.size < 1 || file.size > MAX_VEHICLE_IMAGE_BYTES) {
    throw new ImageUploadError("Images must be smaller than 5 MB.");
  }
  if (!(await hasValidImageSignature(file))) {
    throw new ImageUploadError("The selected file is not a valid supported image.");
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ImageStorageConfigurationError();
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "epicdrive/fleet";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(30_000) },
    );
  } catch {
    throw new ImageUploadError("Cloudinary could not be reached. Try again.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof payload !== "object" || payload === null) {
    throw new ImageUploadError("Cloudinary could not store this image. Try again.");
  }
  const url = "secure_url" in payload ? payload.secure_url : undefined;
  if (typeof url !== "string" || !url.startsWith("https://")) {
    throw new ImageUploadError("Image storage returned an invalid image URL.");
  }
  return url;
}
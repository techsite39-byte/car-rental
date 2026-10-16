import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";
import {
  ImageStorageConfigurationError,
  ImageUploadError,
  MAX_VEHICLE_IMAGE_BYTES,
  uploadVehicleImage,
} from "@/lib/vehicle-image-storage";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_VEHICLE_IMAGE_BYTES + 64_000) {
    return NextResponse.json({ error: "Images must be smaller than 5 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  try {
    const image = await uploadVehicleImage(file);
    return NextResponse.json({ image }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ImageStorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof ImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: "The image could not be uploaded." }, { status: 502 });
  }
}
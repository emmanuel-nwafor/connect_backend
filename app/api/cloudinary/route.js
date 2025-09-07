import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const text = await req.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { file, folder } = body;
    if (!file) return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });

    // Use resource_type: "auto" to handle images & videos
    const uploaded = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "auto",
      upload_preset: process.env.CLOUDINARY_UNSIGNED_PRESET, // optional if using unsigned
    });

    return new Response(JSON.stringify({ url: uploaded.secure_url }), { status: 200 });
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

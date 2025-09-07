import cloudinary from "cloudinary";

// Configure Cloudinary using server-side secret
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { file, folder } = req.body;

    if (!file) return res.status(400).json({ error: "No file provided" });

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.v2.uploader.upload(file, {
      folder: folder || "uploads",
    });

    return res.status(200).json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}

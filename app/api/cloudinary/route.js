import { IncomingForm } from "formidable";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false, // Important for file uploads
  },
};

export async function POST(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return resolve(new Response(JSON.stringify({ error: "Form parse failed" }), { status: 500 }));
      }

      try {
        const file = files.file; // The uploaded file
        const folder = fields.folder || "default";

        const uploaded = await cloudinary.v2.uploader.upload(file.filepath, { folder });
        resolve(new Response(JSON.stringify({ url: uploaded.secure_url }), { status: 200 }));
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        resolve(new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 }));
      }
    });
  });
}

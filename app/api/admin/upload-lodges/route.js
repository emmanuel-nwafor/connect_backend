import { IncomingForm } from 'formidable';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false, // Important: disable default body parser
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    try {
      const { title, description, rentFee } = fields;

      if (!title || !description || !rentFee) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      const uploadedFiles = [];

      const fileArray = Array.isArray(files.files) ? files.files : [files.files];

      for (const file of fileArray) {
        const result = await cloudinary.uploader.upload(file.filepath, {
          resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
          folder: 'lodges', // optional: store all uploads in 'lodges' folder
        });

        uploadedFiles.push({
          url: result.secure_url,
          type: file.mimetype,
        });

        // delete temp file
        fs.unlinkSync(file.filepath);
      }

      // Normally, save lodge info in DB here (title, description, rentFee, uploadedFiles)
      // For demo, we return a lodgeId and uploaded URLs
      return res.status(200).json({
        lodgeId: Math.floor(Math.random() * 1000000),
        files: uploadedFiles,
      });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}

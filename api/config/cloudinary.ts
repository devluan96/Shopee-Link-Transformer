import { v2 as cloudinary } from "cloudinary";

try {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } else {
    console.warn("⚠️ Cloudinary Config Missing");
  }
} catch (err) {
  console.error("❌ Cloudinary config error:", err);
}

export { cloudinary };

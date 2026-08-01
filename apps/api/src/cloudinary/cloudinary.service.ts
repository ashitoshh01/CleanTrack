import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET");

    if (
      cloudName &&
      apiKey &&
      apiSecret &&
      !cloudName.includes("your_cloud")
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log("Cloudinary initialized successfully");
    } else {
      this.logger.warn(
        "Cloudinary credentials not set or using placeholders. Mock image upload fallback enabled.",
      );
    }
  }

  async uploadImage(
    fileBuffer: Buffer,
    folder = "cleancity/complaints",
  ): Promise<{ url: string; publicId: string }> {
    if (this.isConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              this.logger.error("Cloudinary upload failed", error);
              return reject(error || new Error("Cloudinary upload error"));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          },
        );
        uploadStream.end(fileBuffer);
      });
    }

    // Fallback: Generate a high quality realistic waste report image placeholder
    const sampleImages = [
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop", // Plastic bottles
      "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop", // Garbage bin overflow
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop", // Waste pile
      "https://images.unsplash.com/photo-1558583082-409143c794ca?w=800&auto=format&fit=crop", // Electronic waste
    ];
    const randomImage =
      sampleImages[Math.floor(Math.random() * sampleImages.length)];

    return {
      url: randomImage,
      publicId: `mock_upload_${Date.now()}`,
    };
  }

  async uploadBase64(
    base64Data: string,
    folder = "cleancity/complaints",
  ): Promise<{ url: string; publicId: string }> {
    if (this.isConfigured) {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: "image",
      });
      return { url: result.secure_url, publicId: result.public_id };
    }

    return this.uploadImage(Buffer.from([]), folder);
  }
}

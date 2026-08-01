import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cleancity/ui", "@cleancity/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;

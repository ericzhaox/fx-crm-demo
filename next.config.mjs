/** @type {import('next').NextConfig} */
const pages = process.env.GITHUB_PAGES === "1";
const basePath = pages ? "/fx-crm-demo" : "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(pages ? { basePath, assetPrefix: basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

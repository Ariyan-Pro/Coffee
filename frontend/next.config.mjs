import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  // Anchor tracing to this app — the parent workspace holds other
  // lockfiles (backend, reports) that Next otherwise mis-infers as root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

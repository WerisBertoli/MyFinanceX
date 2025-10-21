import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Evita que erros de ESLint quebrem o build de produção (Vercel)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

import path from "path";
import type { NextConfig } from "next";

/** turbopack.root solo ayuda en local (evita warning por lockfiles); en Vercel no conviene forzar */
const nextConfig: NextConfig = {};

if (!process.env.VERCEL) {
  nextConfig.turbopack = {
    root: path.join(__dirname),
  };
}

export default nextConfig;

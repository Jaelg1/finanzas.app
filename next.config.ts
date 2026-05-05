import path from "path";
import type { NextConfig } from "next";

/** turbopack.root solo ayuda en local (evita warning por lockfiles); en Vercel no conviene forzar */
const nextConfig: NextConfig = {
  /** OAuth (PKCE) a veces devuelve ?code= en /; reenviar antes de matching para que lo maneje la route handler */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "query", key: "code" }],
          destination: "/auth/callback",
        },
      ],
    };
  },
};

if (!process.env.VERCEL) {
  nextConfig.turbopack = {
    root: path.join(__dirname),
  };
}

export default nextConfig;

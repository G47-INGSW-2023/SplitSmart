import type { NextConfig } from "next";

const nextConfig = {
  // Aggiungi questa sezione async rewrites
  async rewrites() {
    return [
      {
        // La sorgente è il percorso che il tuo frontend chiamerà
        source: '/api-proxy/:path*',
        // La destinazione è l'URL del tuo backend Rocket
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
};

export default nextConfig;

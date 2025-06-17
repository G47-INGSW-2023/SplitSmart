import type { NextConfig } from "next";

const nextConfig = {
  // Aggiungi questa sezione async rewrites
  async rewrites() {
    return [
      {
        // La sorgente è il percorso che il tuo frontend chiamerà
        source: '/api-proxy/:path*',
        // La destinazione è l'URL del tuo backend Rocket
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ]
  },
};

export default nextConfig;

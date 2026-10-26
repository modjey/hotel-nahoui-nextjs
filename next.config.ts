import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "/suites" est un doublon de "/stays" (même contenu) : redirection 301
  // pour éviter le contenu dupliqué et consolider le référencement sur une
  // seule URL canonique.
  async redirects() {
    return [
      {
        source: "/suites",
        destination: "/stays",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:4100/api/:path*",
      },
      {
        source: "/post-api/:path*",
        destination: "http://127.0.0.1:5001/:path*",
      },
    ];
  },
};

export default nextConfig;

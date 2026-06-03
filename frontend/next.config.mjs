/** @type {import('next').NextConfig} */
const trimTrailingSlash = (value) => value?.replace(/\/$/, "");

const nodeApiOrigin = trimTrailingSlash(
  process.env.API_PROXY_ORIGIN || process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, ""),
) || "http://127.0.0.1:4100";

const postApiOrigin = trimTrailingSlash(process.env.POST_API_PROXY_ORIGIN || process.env.NEXT_PUBLIC_POST_API_URL)
  || "http://127.0.0.1:5001";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${nodeApiOrigin}/api/:path*`,
      },
      {
        source: "/post-api/:path*",
        destination: `${postApiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;

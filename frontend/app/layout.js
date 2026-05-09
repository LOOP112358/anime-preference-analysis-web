import "./globals.css";

export const metadata = {
  title: "ACG Personality Analyzer",
  description: "Anime preference personality analyzer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

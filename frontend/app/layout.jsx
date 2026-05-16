import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "ACG Universe",
  description: "人格分析 · 番剧推荐 · 番剧分享",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}

import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import AppNav from "../components/AppNav";
import SiteBackground from "../components/SiteBackground";

const notoSans = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cloud-sans",
});

export const metadata = {
  title: "ACG Personality Analyzer",
  description: "Anime preference personality analyzer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={notoSans.variable}>
      <body className={`${notoSans.className} font-sans antialiased text-ink`}>
        <SiteBackground />
        <AppNav />
        {children}
      </body>
    </html>
  );
}

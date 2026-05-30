import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import AppNav from "../components/AppNav";
import SiteBackground from "../components/SiteBackground";
import SiteFooter from "../components/SiteFooter";

const notoSans = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cloud-sans",
});

const notoSerif = Noto_Serif_SC({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cloud-serif",
});

export const metadata = {
  title: "ACG Personality Analyzer",
  description: "Anime preference personality analyzer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <body className={`${notoSans.className} flex min-h-screen flex-col font-sans antialiased text-ink`}>
        <SiteBackground />
        <AppNav />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import AppNav from "../components/AppNav";
import SiteBackground from "../components/SiteBackground";

const sans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const display = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "ACG Personality Analyzer",
  description: "Anime preference personality analyzer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased text-ink">
        <SiteBackground />
        <AppNav />
        {children}
      </body>
    </html>
  );
}

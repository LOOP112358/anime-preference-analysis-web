"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",           label: "人格分析", icon: "🔮" },
  { href: "/recommend",  label: "番剧推荐", icon: "🌟" },
  { href: "/user-post",  label: "番剧分享", icon: "🌸" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 2rem", height: 54,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(18px)",
      borderBottom: "1px solid rgba(93,202,165,0.15)",
      boxShadow: "0 2px 16px rgba(93,202,165,0.06)",
    }}>
      {/* Logo */}
      <Link href="/" style={{
        fontSize: 15, fontWeight: 700, textDecoration: "none",
        background: "linear-gradient(135deg, #0f6e56, #5DCAA5, #4ab8d6)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", letterSpacing: "-0.3px",
      }}>
        ✦ ACG Universe
      </Link>

      {/* 导航链接 */}
      <div style={{ display: "flex", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 20,
              fontSize: 13, textDecoration: "none",
              fontWeight: active ? 700 : 400,
              color: active ? "#0f6e56" : "#64748b",
              background: active ? "rgba(93,202,165,0.15)" : "transparent",
              border: active ? "1.5px solid rgba(93,202,165,0.35)" : "1px solid transparent",
              transition: "all 0.18s",
            }}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

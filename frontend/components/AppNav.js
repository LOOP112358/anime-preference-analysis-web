"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabButtonClasses } from "./ui";

const LINKS = [
  { href: "/", label: "人格分析" },
  { href: "/community", label: "社区发布" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-stone-800 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link href="/" className="block">
          <p className="font-display text-lg font-semibold leading-tight text-stone-800">偏好分析仪</p>
          <p className="mt-0.5 text-xs text-stone-500">分析 · 推荐 · 同好社区</p>
        </Link>
        <nav className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={tabButtonClasses(active)}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

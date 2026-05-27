"use client";

import { useEffect, useState } from "react";
import { SITE_BG_OPACITY, SITE_BG_URL } from "../lib/branding";

function probeImage(url) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export default function SiteBackground() {
  const [hasBgImage, setHasBgImage] = useState(false);

  useEffect(() => {
    let alive = true;
    probeImage(SITE_BG_URL).then((ok) => {
      if (alive) setHasBgImage(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!hasBgImage) {
    return null;
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${SITE_BG_URL})`,
          opacity: SITE_BG_OPACITY,
        }}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-paper/20" aria-hidden />
    </>
  );
}

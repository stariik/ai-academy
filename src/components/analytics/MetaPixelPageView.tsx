"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Track App Router navigations that do not trigger a full document load. */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!pathname || pathname === previousPathname.current) return;

    previousPathname.current = pathname;
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}

"use client";

import { useEffect, useState } from "react";

/**
 * True only after the first client mount. Use to skip SSR for subtrees that
 * generate unstable IDs (e.g. Radix Dialog trigger `aria-controls`) and cause
 * React hydration mismatches in the App Router.
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

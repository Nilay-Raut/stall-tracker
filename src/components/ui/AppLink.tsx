"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useIsOffline } from "@/client/online";

/**
 * A link that works offline too. Online it is a normal fast in-app link; offline
 * it becomes a plain page load, which the service worker answers from its stored
 * copy even when the app was opened without signal.
 */
export function AppLink({ href, prefetch, ...props }: ComponentProps<typeof Link>) {
  const offline = useIsOffline();
  if (offline && typeof href === "string") {
    return <a href={href} {...props} />;
  }
  return <Link href={href} prefetch={prefetch} {...props} />;
}

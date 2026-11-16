import { appIcon } from "@/lib/appIcon";

// Built once at build time (it reads nothing from the request).
export function GET() {
  return appIcon(512);
}

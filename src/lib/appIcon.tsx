import { ImageResponse } from "next/og";

/**
 * The app icon: a white "S" on the accent green. A maskable icon keeps the
 * letter inside the middle 60%, because Android may crop it to a circle.
 */
export function appIcon(size: number, { maskable = false } = {}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f7b5a",
        borderRadius: maskable ? 0 : size * 0.22,
        color: "#ffffff",
        fontSize: size * (maskable ? 0.42 : 0.62),
        fontWeight: 800,
        fontFamily: "sans-serif",
      }}
    >
      S
    </div>,
    { width: size, height: size },
  );
}

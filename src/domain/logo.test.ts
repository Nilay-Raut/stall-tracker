import { describe, expect, it } from "vitest";
import { MAX_STORED_BYTES, logoProblem, sniffLogoMime } from "./logo";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const webp = Uint8Array.from([...Buffer.from("RIFF"), 0x24, 0, 0, 0, ...Buffer.from("WEBPVP8 ")]);
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');

describe("logo checks", () => {
  it("reads the real format from the bytes", () => {
    expect(sniffLogoMime(png)).toBe("image/png");
    expect(sniffLogoMime(jpeg)).toBe("image/jpeg");
    expect(sniffLogoMime(webp)).toBe("image/webp");
    expect(sniffLogoMime(svg)).toBeNull();
    expect(sniffLogoMime(new Uint8Array())).toBeNull();
  });

  it("refuses empty, oversized and non-image uploads", () => {
    expect(logoProblem(png)).toBeNull();
    expect(logoProblem(new Uint8Array())).toBe("empty");
    expect(logoProblem(svg)).toBe("not-an-image");
    const big = new Uint8Array(MAX_STORED_BYTES + 1);
    big.set(png);
    expect(logoProblem(big)).toBe("too-big");
  });
});

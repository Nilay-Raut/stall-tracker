/** localStorage key for the phone's theme choice ("light" | "dark"; missing = follow the phone). */
export const THEME_KEY = "stall:theme";
/** localStorage key for the shop's brand colour ("#rrggbb"), copied from the server. */
export const BRAND_KEY = "stall:brand";
/** localStorage key for the phone's text size ("large" | "xl"; missing = normal). */
export const TEXT_KEY = "stall:text";
/** localStorage key for the shop's logo: { v: version, url: data URL }. */
export const LOGO_KEY = "stall:logo";

/**
 * Runs in <head> before the page paints, so a phone set to dark never flashes light
 * a shop with its own colour never flashes the default green, and large text
 * never starts small.
 * Kept here (not in a "use client" module) so the server layout can inline it.
 */
export const THEME_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}"),b=localStorage.getItem("${BRAND_KEY}");if(t==="light"||t==="dark")d.dataset.theme=t;var z=localStorage.getItem("${TEXT_KEY}");if(z==="large"||z==="xl")d.dataset.text=z;if(b&&/^#[0-9a-f]{6}$/.test(b))d.style.setProperty("--brand",b)}catch(e){}`;

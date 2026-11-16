/**
 * Money is always stored and calculated as whole paise (integers),
 * so sums never pick up floating-point errors. Convert to rupees only for display.
 */
export type Paise = number;

const MINUS = "−"; // real minus sign, as in the wireframe: "− ₹500"

// Formatters are costly to create, so make them once and reuse.
const rupeeFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function rupeesToPaise(rupees: number): Paise {
  return Math.round(rupees * 100);
}

/** "₹1,23,456" or "₹12.50". Negative values get a leading minus: "−₹500". */
export function formatRupees(paise: Paise): string {
  const text = `₹${rupeeFormat.format(Math.abs(paise) / 100)}`;
  return paise < 0 ? `${MINUS}${text}` : text;
}

/** "+ ₹1,330" for money in, "− ₹500" for money out, as on the entries list. */
export function formatSignedRupees(paise: Paise): string {
  const sign = paise < 0 ? MINUS : "+";
  return `${sign} ${formatRupees(Math.abs(paise))}`;
}

/**
 * Reads what the user typed ("₹1,250", "1250.5", " 900 ") and returns paise.
 * Returns null for anything that is not a non-negative amount with at most 2 decimals.
 */
export function parseRupeeInput(text: string): Paise | null {
  const cleaned = text.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  return rupeesToPaise(Number(cleaned));
}

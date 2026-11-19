import type { Paise } from "@/lib/money";
import {
  type ExpenseCategory,
  MAX_LINE_QUANTITY,
  MAX_NOTE_LENGTH,
  type PaidFrom,
  type PaymentMode,
  type SaleLine,
} from "./entry";

/**
 * Reads a spoken entry ("2 chai 1 samosa UPI", "gas 900 from pocket", "बर्फ 60 नकद")
 * into the form's values. The phone's speech recogniser does the listening; this
 * only picks out numbers, items and a few known words in English, Hindi and Marathi.
 * Anything not understood is simply left for the owner to fill in.
 */
export type Spoken = {
  /** The amount said, in paise (the last number that is not a quantity). */
  amount: Paise | null;
  payment: PaymentMode | null;
  /** Saved items that were named, with the number said before each (default 1). */
  lines: SaleLine[];
  category: ExpenseCategory | null;
  paidFrom: PaidFrom | null;
  /** Words left over, for the note of an "Other" expense. */
  note: string | null;
};

export type SpokenItem = { id: string; name: string; price: Paise };

const CASH = ["cash", "कैश", "नकद", "नगद", "कॅश", "रोख", "रोकड", "रोकड़"];
const UPI = [
  "upi",
  "यूपीआई",
  "यूपीआय",
  "online",
  "ऑनलाइन",
  "phonepe",
  "फोनपे",
  "gpay",
  "paytm",
  "पेटीएम",
  "qr",
  "google pay",
  "phone pe",
];
const POCKET = ["pocket", "जेब", "खिसा", "खिशातून", "own"];
const DRAWER = ["drawer", "गल्ला", "गल्ले", "गल्ल्यातून", "गल्ल्यात"];

const CATEGORY_WORDS: Record<Exclude<ExpenseCategory, "other">, string[]> = {
  gas: ["gas", "cylinder", "गैस", "सिलेंडर", "सिलिंडर", "गॅस"],
  packaging: [
    "packaging",
    "packing",
    "plate",
    "plates",
    "cup",
    "cups",
    "bag",
    "bags",
    "foil",
    "पैकिंग",
    "पैकेजिंग",
    "थैली",
    "प्लेट",
    "कप",
    "पिशवी",
    "पॅकिंग",
  ],
  transport: [
    "transport",
    "auto",
    "rickshaw",
    "taxi",
    "bus",
    "petrol",
    "diesel",
    "ऑटो",
    "रिक्शा",
    "भाड़ा",
    "भाडा",
    "भाडे",
    "पेट्रोल",
    "डीजल",
    "डिझेल",
  ],
  salary: ["salary", "wage", "wages", "helper", "पगार", "तनख्वाह", "वेतन", "मजदूरी", "मज़दूरी"],
  raw_material: [
    "vegetable",
    "vegetables",
    "sabzi",
    "sabji",
    "oil",
    "milk",
    "flour",
    "atta",
    "maida",
    "onion",
    "onions",
    "potato",
    "potatoes",
    "paneer",
    "sugar",
    "सब्जी",
    "सब्ज़ी",
    "तेल",
    "दूध",
    "आटा",
    "मैदा",
    "प्याज",
    "आलू",
    "पनीर",
    "चीनी",
    "भाजी",
    "कांदा",
    "बटाटा",
    "साखर",
    "किराना",
  ],
};

/** Small number words, mostly for quantities ("two chai"). Amounts come as digits. */
const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  एक: 1,
  दो: 2,
  दोन: 2,
  तीन: 3,
  चार: 4,
  पांच: 5,
  पाँच: 5,
  पाच: 5,
  छह: 6,
  छः: 6,
  सहा: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  नऊ: 9,
  दस: 10,
  दहा: 10,
};

/** Words that carry no meaning here ("for", "rupees", "से" ...). */
const FILLER = new Set([
  "rs",
  "rupee",
  "rupees",
  "rupaye",
  "₹",
  "for",
  "the",
  "a",
  "an",
  "of",
  "and",
  "paid",
  "by",
  "in",
  "from",
  "with",
  "sale",
  "expense",
  "रुपये",
  "रुपए",
  "रुपया",
  "रुपयांचे",
  "रुपयाचे",
  "का",
  "की",
  "के",
  "से",
  "में",
  "और",
  "ने",
  "साठी",
  "चा",
  "ची",
  "चे",
  "आणि",
  "मधून",
  "ला",
]);

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/(\d),(?=\d)/g, "$1") // 1,200 -> 1200
    .replace(/₹\s*/g, " ")
    .replace(/(\d)([^\d\s.])/g, "$1 $2") // 40rs -> 40 rs
    .replace(/([^\d\s.])(\d)/g, "$1 $2")
    .replace(/[,!?।|"“”]/g, " ");
}

const sameWord = (said: string, name: string) =>
  said === name || said === `${name}s` || `${said}s` === name;

/** A number token (digits, maybe with paise) or a number word. */
function numberOf(token: string): number | null {
  if (/^\d+(\.\d{1,2})?$/.test(token)) return Number(token);
  return NUMBER_WORDS[token] ?? null;
}

export function parseSpoken(text: string, items: ReadonlyArray<SpokenItem> = []): Spoken {
  let clean = normalise(text);

  // Two-word payment names first, so "google pay" is not read as two words.
  let payment = null as PaymentMode | null;
  for (const phrase of UPI.filter((w) => w.includes(" "))) {
    if (clean.includes(phrase)) {
      payment = "upi";
      clean = clean.replaceAll(phrase, " ");
    }
  }

  const tokens = clean.split(/\s+/).filter(Boolean);
  const used = new Array<boolean>(tokens.length).fill(false);

  // Saved items, longest names first ("veg momos" before "momos").
  const lines = new Map<string, SaleLine & { at: number }>();
  const byLength = [...items].sort((a, b) => b.name.length - a.name.length);
  for (const item of byLength) {
    const words = normalise(item.name).split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    for (let i = 0; i + words.length <= tokens.length; i++) {
      if (used.slice(i, i + words.length).some(Boolean)) continue;
      if (!words.every((w, j) => sameWord(tokens[i + j], w))) continue;
      words.forEach((_, j) => (used[i + j] = true));
      // "2 chai": the number just before the name is how many.
      let quantity = 1;
      const before = i > 0 && !used[i - 1] ? numberOf(tokens[i - 1]) : null;
      if (before !== null && Number.isInteger(before) && before >= 1 && before <= 99) {
        quantity = before;
        used[i - 1] = true;
      }
      const line = lines.get(item.id);
      lines.set(item.id, {
        at: Math.min(line?.at ?? i, i),
        itemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: Math.min((line?.quantity ?? 0) + quantity, MAX_LINE_QUANTITY),
      });
    }
  }

  let amount: Paise | null = null;
  let category: ExpenseCategory | null = null;
  let paidFrom: PaidFrom | null = null;
  const left: string[] = [];

  for (const [i, token] of tokens.entries()) {
    if (used[i]) continue;
    const n = /^\d/.test(token) ? numberOf(token) : null;
    if (n !== null) {
      if (n > 0) amount = Math.round(n * 100);
      continue;
    }
    if (CASH.includes(token)) payment = "cash";
    else if (UPI.includes(token)) payment = "upi";
    else if (POCKET.includes(token)) paidFrom = "own_pocket";
    else if (DRAWER.includes(token)) paidFrom = "drawer";
    else {
      const found = (Object.keys(CATEGORY_WORDS) as Array<keyof typeof CATEGORY_WORDS>).find(
        (key) => CATEGORY_WORDS[key].includes(token),
      );
      if (found) category ??= found;
      else if (!FILLER.has(token) && numberOf(token) === null) left.push(token);
    }
  }

  // Paid from follows the payment words when nothing else was said.
  if (paidFrom === null && payment === "upi") paidFrom = "upi";
  if (paidFrom === null && payment === "cash") paidFrom = "drawer";

  const note = left.join(" ").slice(0, MAX_NOTE_LENGTH).trim() || null;
  if (category === null && note) category = "other";

  return {
    amount,
    payment,
    // In the order they were said.
    lines: [...lines.values()]
      .sort((a, b) => a.at - b.at)
      .map((l) => ({
        itemId: l.itemId,
        name: l.name,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
    category,
    paidFrom,
    note: category === "other" ? note : null,
  };
}

/** The language tag for the phone's speech recogniser. */
export const speechLang = (lang: "en" | "hi" | "mr") =>
  lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";

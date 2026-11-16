import type { Phrases } from "../translate";

/** Calendar tab. "Day closed", "Sales", "Expenses", "Profit" are in close.ts. */
export const calendar: Phrases = {
  Sun: { hi: "रवि", mr: "रवि" },
  Mon: { hi: "सोम", mr: "सोम" },
  Tue: { hi: "मंगल", mr: "मंगळ" },
  Wed: { hi: "बुध", mr: "बुध" },
  Thu: { hi: "गुरु", mr: "गुरु" },
  Fri: { hi: "शुक्र", mr: "शुक्र" },
  Sat: { hi: "शनि", mr: "शनि" },
  "Previous month": { hi: "पिछला महीना", mr: "मागचा महिना" },
  "Next month": { hi: "अगला महीना", mr: "पुढचा महिना" },
  Entered: { hi: "एंट्री है", mr: "नोंद आहे" },
  Off: { hi: "बंद", mr: "बंद" },
  "Shop closed": { hi: "दुकान बंद", mr: "दुकान बंद" },
  "Blank = No entry": { hi: "खाली = कोई एंट्री नहीं", mr: "रिकामे = नोंद नाही" },
  "{day}, shop closed": { hi: "{day}, दुकान बंद", mr: "{day}, दुकान बंद" },
  "{day}, has entries": { hi: "{day}, एंट्री हैं", mr: "{day}, नोंदी आहेत" },
  "This day has entries, so the shop was open.": {
    hi: "इस दिन एंट्री हैं, यानी दुकान खुली थी।",
    mr: "या दिवशी नोंदी आहेत, म्हणजे दुकान उघडे होते.",
  },
  "This day was already closed with a count.": {
    hi: "यह दिन पहले ही गिनती के साथ बंद हो चुका है।",
    mr: "हा दिवस आधीच मोजणीसह बंद झाला आहे.",
  },
  "This day cannot be changed.": { hi: "यह दिन बदला नहीं जा सकता।", mr: "हा दिवस बदलता येत नाही." },
  "(today)": { hi: "(आज)", mr: "(आज)" },
  "Shop closed. This day is left out of averages.": {
    hi: "दुकान बंद। यह दिन औसत में नहीं गिना जाता।",
    mr: "दुकान बंद. हा दिवस सरासरीत धरला जात नाही.",
  },
  "No entries for this day yet.": {
    hi: "इस दिन की अभी कोई एंट्री नहीं।",
    mr: "या दिवसाची अजून नोंद नाही.",
  },
  "Add or edit entries": { hi: "एंट्री जोड़ें या बदलें", mr: "नोंदी जोडा किंवा बदला" },
  "Shop was open": { hi: "दुकान खुली थी", mr: "दुकान उघडे होते" },
  "Mark shop closed": { hi: "दुकान बंद लिखें", mr: "दुकान बंद नोंदवा" },
};

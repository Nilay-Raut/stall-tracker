import type { Phrases } from "../translate";

/** Bills: items on a sale, custom items, WhatsApp bill (docs/PLAN-v2.md, Phase 3). */
export const bills: Phrases = {
  "How to enter this sale": { hi: "यह बिक्री कैसे लिखें", mr: "ही विक्री कशी लिहायची" },
  Bill: { hi: "बिल", mr: "बिल" },
  "Quick amount": { hi: "सीधी रकम", mr: "थेट रक्कम" },
  "Bill total": { hi: "बिल कुल", mr: "बिल एकूण" },
  "Bill total · 1 item": { hi: "बिल कुल · 1 आइटम", mr: "बिल एकूण · 1 आयटम" },
  "Bill total · {n} items": { hi: "बिल कुल · {n} आइटम", mr: "बिल एकूण · {n} आयटम" },
  "Find an item": { hi: "आइटम खोजें", mr: "आयटम शोधा" },
  "No items yet.": { hi: "अभी कोई आइटम नहीं।", mr: "अजून आयटम नाहीत." },
  "Add your items": { hi: "अपने आइटम जोड़ें", mr: "तुमचे आयटम जोडा" },
  "to tap them here, or add a custom item below.": {
    hi: "ताकि यहाँ टैप कर सकें, या नीचे अलग आइटम जोड़ें।",
    mr: "म्हणजे इथे टॅप करता येतील, किंवा खाली वेगळा आयटम जोडा.",
  },
  Add: { hi: "जोड़ें", mr: "जोडा" },
  "Custom item": { hi: "अलग आइटम", mr: "वेगळा आयटम" },
  "This bill": { hi: "यह बिल", mr: "हे बिल" },
  "Price for one (₹)": { hi: "एक का दाम (₹)", mr: "एकाची किंमत (₹)" },
  "How many": { hi: "कितने", mr: "किती" },
  "Add to bill": { hi: "बिल में जोड़ें", mr: "बिलात जोडा" },
  "Enter a price like 30 or 12.50.": {
    hi: "30 या 12.50 जैसा दाम लिखें।",
    mr: "30 किंवा 12.50 अशी किंमत लिहा.",
  },
  "Enter how many, from 1 to 999.": {
    hi: "कितने, 1 से 999 तक लिखें।",
    mr: "किती ते 1 ते 999 पर्यंत लिहा.",
  },
  "Save bill": { hi: "बिल सेव करें", mr: "बिल सेव्ह करा" },

  // WhatsApp
  "Customer's WhatsApp number (optional)": {
    hi: "ग्राहक का WhatsApp नंबर (चाहें तो)",
    mr: "ग्राहकाचा WhatsApp नंबर (हवा असल्यास)",
  },
  "Leave empty to pick the chat in WhatsApp.": {
    hi: "खाली छोड़ें तो WhatsApp में चैट चुन लें।",
    mr: "रिकामे ठेवल्यास WhatsApp मध्ये चॅट निवडा.",
  },
  "Save and send on WhatsApp": {
    hi: "सेव करें और WhatsApp पर भेजें",
    mr: "सेव्ह करा आणि WhatsApp वर पाठवा",
  },
  "Save and send bill on WhatsApp": {
    hi: "सेव करें और बिल WhatsApp पर भेजें",
    mr: "सेव्ह करा आणि बिल WhatsApp वर पाठवा",
  },
  "Paid in cash": { hi: "नकद दिया", mr: "रोख दिले" },
  "Thank you! Please visit again.": {
    hi: "धन्यवाद! फिर आइए।",
    mr: "धन्यवाद! पुन्हा या.",
  },

  // Settings and closing
  "Bill each sale": { hi: "हर बिक्री का बिल", mr: "प्रत्येक विक्रीचे बिल" },
  "Tap the items for every sale. See what sells best; send bills on WhatsApp.": {
    hi: "हर बिक्री में आइटम टैप करें। देखें क्या ज़्यादा बिकता है; बिल WhatsApp पर भेजें।",
    mr: "प्रत्येक विक्रीत आयटम टॅप करा. काय जास्त विकते ते पाहा; बिल WhatsApp वर पाठवा.",
  },
  "Filled in from today's bills. Add any sold without a bill.": {
    hi: "आज के बिलों से भरा है। बिना बिल बिके हुए जोड़ दें।",
    mr: "आजच्या बिलांमधून भरले आहे. बिलाशिवाय विकलेले जोडा.",
  },
};

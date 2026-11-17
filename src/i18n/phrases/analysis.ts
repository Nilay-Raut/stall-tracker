import type { Phrases } from "../translate";

/** Phase 11: deeper reports, month by month, spending details, share and print. */
export const analysis: Phrases = {
  // Where the money goes
  "Of every ₹100 of sales": { hi: "बिक्री के हर ₹100 में से", mr: "विक्रीच्या प्रत्येक ₹100 पैकी" },
  "Of every ₹100 spent": { hi: "खर्च के हर ₹100 में से", mr: "खर्चाच्या प्रत्येक ₹100 पैकी" },
  "Costs {costs} rupees, profit {profit} rupees of every 100": {
    hi: "हर 100 में से खर्च {costs} रुपये, मुनाफ़ा {profit} रुपये",
    mr: "प्रत्येक 100 पैकी खर्च {costs} रुपये, नफा {profit} रुपये",
  },
  "Costs were {amount} more than sales in this period.": {
    hi: "इस अवधि में खर्च बिक्री से {amount} ज़्यादा रहा।",
    mr: "या कालावधीत खर्च विक्रीपेक्षा {amount} जास्त झाला.",
  },
  "₹{n} of every ₹100": { hi: "हर ₹100 में ₹{n}", mr: "प्रत्येक ₹100 मध्ये ₹{n}" },

  // Compared with before
  "Compared with before": { hi: "पहले से तुलना", mr: "आधीशी तुलना" },
  "No change": { hi: "कोई बदलाव नहीं", mr: "काही बदल नाही" },
  "{amount} more ({percent}%)": {
    hi: "{amount} ज़्यादा ({percent}%)",
    mr: "{amount} जास्त ({percent}%)",
  },
  "{amount} less ({percent}%)": { hi: "{amount} कम ({percent}%)", mr: "{amount} कमी ({percent}%)" },
  "{now} now, {before} before": { hi: "अब {now}, पहले {before}", mr: "आता {now}, आधी {before}" },

  // Your take
  "Your take": { hi: "आपने कितना लिया", mr: "तुम्ही किती घेतले" },
  "Cash you took out": { hi: "आपने निकाला नकद", mr: "तुम्ही काढलेली रोख" },
  "Profit the stall made": { hi: "दुकान का मुनाफ़ा", mr: "दुकानाचा नफा" },
  "You took out {amount} more than the stall earned. It came from earlier savings in the drawer.": {
    hi: "आपने दुकान की कमाई से {amount} ज़्यादा निकाला। यह गल्ले की पहले की बचत से गया।",
    mr: "तुम्ही दुकानाच्या कमाईपेक्षा {amount} जास्त काढले. ते गल्ल्यातील आधीच्या बचतीतून गेले.",
  },
  "{amount} of the profit is still in the business.": {
    hi: "मुनाफ़े के {amount} अभी भी दुकान में हैं।",
    mr: "नफ्यापैकी {amount} अजून दुकानातच आहेत.",
  },

  // Month by month
  "Month by month": { hi: "महीने दर महीने", mr: "महिन्यानुसार" },
  "Profit each month": { hi: "हर महीने का मुनाफ़ा", mr: "दर महिन्याचा नफा" },
  "Profit for each of the last {count} months": {
    hi: "पिछले {count} महीनों में हर महीने का मुनाफ़ा",
    mr: "मागील {count} महिन्यांतील दर महिन्याचा नफा",
  },
  "so far": { hi: "अब तक", mr: "आतापर्यंत" },
  "Sales {sales} · Costs {costs}": {
    hi: "बिक्री {sales} · खर्च {costs}",
    mr: "विक्री {sales} · खर्च {costs}",
  },
  "Tap a month to see its full report.": {
    hi: "पूरी रिपोर्ट देखने के लिए महीने पर टैप करें।",
    mr: "पूर्ण अहवाल पाहण्यासाठी महिन्यावर टॅप करा.",
  },

  // Spending details
  "{count} expense": { hi: "{count} खर्च", mr: "{count} खर्च" },
  "{count} expenses": { hi: "{count} खर्च", mr: "{count} खर्च" },
  "By material": { hi: "माल के हिसाब से", mr: "मालानुसार" },
  "By supplier": { hi: "सप्लायर के हिसाब से", mr: "पुरवठादारानुसार" },
  "Every expense": { hi: "सारे खर्च", mr: "सर्व खर्च" },
  "Nothing spent on this in the period.": {
    hi: "इस अवधि में इस पर कोई खर्च नहीं।",
    mr: "या कालावधीत यावर काही खर्च नाही.",
  },
  "Showing the latest 500.": { hi: "नए 500 दिखा रहे हैं।", mr: "नवीन 500 दाखवत आहोत." },
  "1 time": { hi: "1 बार", mr: "1 वेळा" },
  "{count} times": { hi: "{count} बार", mr: "{count} वेळा" },

  // Share or download
  "Share or download": { hi: "शेयर या डाउनलोड करें", mr: "शेअर किंवा डाउनलोड करा" },
  "Period: {period}. Change it on Reports with Today, Week, Month or Custom.": {
    hi: "अवधि: {period}। इसे रिपोर्ट में आज, हफ़्ता, महीना या तारीख चुनें से बदलें।",
    mr: "कालावधी: {period}. तो अहवालात आज, आठवडा, महिना किंवा तारखा निवडा वापरून बदला.",
  },
  "For a spreadsheet or your accountant": {
    hi: "स्प्रेडशीट या अकाउंटेंट के लिए",
    mr: "स्प्रेडशीट किंवा अकाउंटंटसाठी",
  },
  "One row per day (CSV)": { hi: "हर दिन की एक लाइन (CSV)", mr: "दर दिवसाची एक ओळ (CSV)" },
  "Every entry (CSV)": { hi: "सारी एंट्री (CSV)", mr: "सर्व नोंदी (CSV)" },
  "CSV files open in Excel, Google Sheets and WhatsApp.": {
    hi: "CSV फ़ाइल Excel, Google Sheets और WhatsApp में खुलती है।",
    mr: "CSV फाइल Excel, Google Sheets आणि WhatsApp मध्ये उघडते.",
  },
  "As a page": { hi: "पेज के रूप में", mr: "पानाच्या रूपात" },
  "Print or save as PDF": { hi: "प्रिंट करें या PDF सेव करें", mr: "प्रिंट करा किंवा PDF सेव्ह करा" },
  "Report for {period}": { hi: "{period} की रिपोर्ट", mr: "{period} चा अहवाल" },
  "Getting the file…": { hi: "फ़ाइल आ रही है…", mr: "फाइल येत आहे…" },
  "Could not get the file. Check the internet and try again.": {
    hi: "फ़ाइल नहीं मिली। इंटरनेट देखें और फिर से कोशिश करें।",
    mr: "फाइल मिळाली नाही. इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.",
  },

  // CSV columns and values
  Open: { hi: "खुला", mr: "चालू" },
  "Nothing recorded": { hi: "कुछ दर्ज नहीं", mr: "काही नोंद नाही" },
  Date: { hi: "तारीख", mr: "तारीख" },
  Status: { hi: "स्थिति", mr: "स्थिती" },
  "Cash sales": { hi: "नकद बिक्री", mr: "रोख विक्री" },
  "UPI sales": { hi: "UPI बिक्री", mr: "UPI विक्री" },
  Total: { hi: "कुल", mr: "एकूण" },
  Time: { hi: "समय", mr: "वेळ" },
  Type: { hi: "प्रकार", mr: "प्रकार" },
  Payment: { hi: "भुगतान", mr: "पेमेंट" },
};

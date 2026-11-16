import type { Phrases } from "../translate";

/** Add / edit sale, expense and cash out. */
export const add: Phrases = {
  // Frame
  Back: { hi: "वापस", mr: "मागे" },
  "Entry type": { hi: "एंट्री का प्रकार", mr: "नोंदीचा प्रकार" },
  Expense: { hi: "खर्च", mr: "खर्च" },
  "Cash out": { hi: "नकद निकाला", mr: "रोख काढली" },
  "Edit sale": { hi: "बिक्री बदलें", mr: "विक्री बदला" },
  "Edit expense": { hi: "खर्च बदलें", mr: "खर्च बदला" },
  "Edit cash out": { hi: "निकाला नकद बदलें", mr: "काढलेली रोख बदला" },
  "This entry goes on {day}, not today.": {
    hi: "यह एंट्री {day} की है, आज की नहीं।",
    mr: "ही नोंद {day} ची आहे, आजची नाही.",
  },
  "Date of this entry": { hi: "इस एंट्री की तारीख", mr: "या नोंदीची तारीख" },
  "This entry is not on this phone any more.": {
    hi: "यह एंट्री अब इस फ़ोन पर नहीं है।",
    mr: "ही नोंद आता या फोनवर नाही.",
  },
  "Back to Today": { hi: "आज पर वापस", mr: "आजवर परत" },

  // Sale
  "Sale amount": { hi: "बिक्री की रकम", mr: "विक्रीची रक्कम" },
  "Paid by": { hi: "भुगतान", mr: "पैसे कसे दिले" },
  "Save sale": { hi: "बिक्री सेव करें", mr: "विक्री सेव्ह करा" },
  "Delete last digit": { hi: "आखिरी अंक मिटाएँ", mr: "शेवटचा अंक पुसा" },

  // Expense
  Amount: { hi: "रकम", mr: "रक्कम" },
  "Enter an amount like 775 or 775.50": {
    hi: "रकम ऐसे लिखें: 775 या 775.50",
    mr: "रक्कम अशी लिहा: 775 किंवा 775.50",
  },
  "That is too much for one entry.": {
    hi: "एक एंट्री के लिए यह बहुत ज़्यादा है।",
    mr: "एका नोंदीसाठी हे खूप जास्त आहे.",
  },
  Category: { hi: "किस पर खर्च", mr: "कशावर खर्च" },
  "Only daily wages here. A monthly salary belongs in Settings, under fixed costs.": {
    hi: "यहाँ सिर्फ़ रोज़ की मज़दूरी। महीने का वेतन सेटिंग में तय खर्च में डालें।",
    mr: "इथे फक्त रोजची मजुरी. महिन्याचा पगार सेटिंगमध्ये ठरलेल्या खर्चात भरा.",
  },
  "Paid from": { hi: "कहाँ से दिया", mr: "कुठून दिले" },
  "Save expense": { hi: "खर्च सेव करें", mr: "खर्च सेव्ह करा" },

  // Material details
  "Material details": { hi: "माल की जानकारी", mr: "मालाची माहिती" },
  "Optional, for price tracking": {
    hi: "ज़रूरी नहीं, भाव पर नज़र रखने के लिए",
    mr: "गरजेचे नाही, भाव लक्षात ठेवण्यासाठी",
  },
  Material: { hi: "माल", mr: "माल" },
  Oil: { hi: "तेल", mr: "तेल" },
  Supplier: { hi: "सप्लायर", mr: "पुरवठादार" },
  Optional: { hi: "ज़रूरी नहीं", mr: "गरजेचे नाही" },
  Quantity: { hi: "मात्रा", mr: "प्रमाण" },
  Unit: { hi: "इकाई", mr: "एकक" },
  "Name the material, or clear these details.": {
    hi: "माल का नाम लिखें, या ये जानकारी खाली करें।",
    mr: "मालाचे नाव लिहा, किंवा ही माहिती रिकामी करा.",
  },
  "Enter how much you bought, like 5 or 2.5.": {
    hi: "कितना खरीदा लिखें, जैसे 5 या 2.5।",
    mr: "किती घेतले ते लिहा, जसे 5 किंवा 2.5.",
  },
  "Use at most 3 decimals.": {
    hi: "दशमलव के बाद ज़्यादा से ज़्यादा 3 अंक।",
    mr: "दशांशानंतर जास्तीत जास्त 3 अंक.",
  },
  "Enter the unit, like kg or litre.": {
    hi: "इकाई लिखें, जैसे kg या litre।",
    mr: "एकक लिहा, जसे kg किंवा litre.",
  },

  // Cash out
  "Cash taken out of the drawer": { hi: "गल्ले से निकाला नकद", mr: "गल्ल्यातून काढलेली रोख" },
  "Money you take for yourself. It is not an expense, so profit stays the same.": {
    hi: "जो पैसे आप अपने लिए लेते हैं। यह खर्च नहीं है, इसलिए मुनाफ़ा वही रहता है।",
    mr: "जे पैसे तुम्ही स्वतःसाठी घेता. हा खर्च नाही, त्यामुळे नफा तेवढाच राहतो.",
  },
  "Enter an amount like 500": { hi: "रकम ऐसे लिखें: 500", mr: "रक्कम अशी लिहा: 500" },
  "Save cash out": { hi: "निकाला नकद सेव करें", mr: "काढलेली रोख सेव्ह करा" },

  // Saving
  "Delete entry": { hi: "एंट्री हटाएँ", mr: "नोंद काढून टाका" },
  "Delete this entry?": { hi: "यह एंट्री हटाएँ?", mr: "ही नोंद काढून टाकायची?" },
  "Could not save on this phone. Try again.": {
    hi: "इस फ़ोन पर सेव नहीं हुआ। फिर से कोशिश करें।",
    mr: "या फोनवर सेव्ह झाले नाही. पुन्हा प्रयत्न करा.",
  },
  "Open the app once with internet before adding entries on this phone.": {
    hi: "इस फ़ोन पर एंट्री डालने से पहले ऐप एक बार इंटरनेट के साथ खोलें।",
    mr: "या फोनवर नोंदी करण्याआधी ॲप एकदा इंटरनेटसह उघडा.",
  },
};

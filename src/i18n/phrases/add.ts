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

  // Added: drawer cash, expense notes, fixed-cost switch, sounds and reminders
  "What was it for? (optional)": { hi: "किस चीज़ के लिए? (ज़रूरी नहीं)", mr: "कशासाठी? (ऐच्छिक)" },
  "e.g. Ice, Repairs, Water": { hi: "जैसे: बर्फ़, मरम्मत, पानी", mr: "उदा. बर्फ, दुरुस्ती, पाणी" },
  "Used before": { hi: "पहले लिखे हुए", mr: "आधी लिहिलेले" },

  // Added: undo, repeat sale, usual amounts, drawer checks, voice, text size, sharing, restock
  "2 chai 1 samosa UPI": { hi: "2 chai 1 samosa यूपीआई", mr: "2 chai 1 samosa यूपीआय" },
  "40 cash": { hi: "40 नकद", mr: "40 रोख" },
  "Your usual amounts": { hi: "आपकी आम रकम", mr: "तुमच्या नेहमीच्या रकमा" },
  "gas 900 from pocket": { hi: "गैस 900 जेब से", mr: "गॅस 900 खिशातून" },
  "Allow the microphone for this app to speak entries.": {
    hi: "बोलकर एंट्री के लिए इस ऐप को माइक की अनुमति दें।",
    mr: "बोलून नोंदीसाठी या ॲपला मायक्रोफोनची परवानगी द्या.",
  },
  "Speaking needs internet. Type it instead.": {
    hi: "बोलने के लिए इंटरनेट चाहिए। टाइप कर दें।",
    mr: "बोलण्यासाठी इंटरनेट लागते. टाइप करा.",
  },
  "Did not catch that. Try again.": { hi: "समझ नहीं आया। फिर से बोलें।", mr: "समजले नाही. पुन्हा बोला." },
  "Listening… tap to stop": { hi: "सुन रहे हैं… रोकने के लिए दबाएँ", mr: "ऐकत आहे… थांबवण्यासाठी दाबा" },
  "Say it": { hi: "बोलकर लिखें", mr: "बोलून लिहा" },
  "Heard: “{text}”": { hi: "सुना: “{text}”", mr: "ऐकले: “{text}”" },

  // Added: stall money and steadier voice entry
  "Heard “{text}” but found no amount or item. Try again, or type it.": {
    hi: "“{text}” सुना, पर रकम या आइटम नहीं मिला। फिर बोलें या टाइप करें।",
    mr: "“{text}” ऐकले, पण रक्कम किंवा आयटम सापडला नाही. पुन्हा बोला किंवा टाइप करा.",
  },
  "Did not hear anything. Tap, wait a moment, then speak clearly.": {
    hi: "कुछ सुनाई नहीं दिया। दबाएँ, एक पल रुकें, फिर साफ़ बोलें।",
    mr: "काही ऐकू आले नाही. दाबा, क्षणभर थांबा, मग स्पष्ट बोला.",
  },
  "The microphone is busy or missing. Close other apps using it.": {
    hi: "माइक व्यस्त है या नहीं मिला। उसे इस्तेमाल कर रहे दूसरे ऐप बंद करें।",
    mr: "मायक्रोफोन व्यस्त आहे किंवा सापडला नाही. तो वापरणारी इतर ॲप्स बंद करा.",
  },
  "Speak now. For example: {example}": {
    hi: "अब बोलें। जैसे: {example}",
    mr: "आता बोला. उदा. {example}",
  },

  // Added: UPI account balance and cash to bank
  "To bank": { hi: "बैंक में", mr: "बँकेत" },
  "Edit cash to bank": { hi: "बैंक में डाला नकद बदलें", mr: "बँकेत भरलेली रोख बदला" },
  "Amount taken out": { hi: "निकाली रकम", mr: "काढलेली रक्कम" },
  "Taken from": { hi: "कहाँ से निकाला", mr: "कुठून काढले" },
  "UPI account": { hi: "UPI खाता", mr: "UPI खाते" },
  "Cash put in the bank": { hi: "बैंक में डाला नकद", mr: "बँकेत भरलेली रोख" },
  "Cash from the drawer paid into the stall's UPI/bank account. Not an expense: profit and stall money stay the same.":
    {
      hi: "गल्ले का नकद स्टॉल के UPI/बैंक खाते में डाला। यह खर्च नहीं: मुनाफ़ा और स्टॉल का पैसा वही रहता है।",
      mr: "गल्ल्यातील रोख स्टॉलच्या UPI/बँक खात्यात भरली. हा खर्च नाही: नफा आणि स्टॉलचे पैसे तेवढेच राहतात.",
    },
  "Save cash to bank": { hi: "बैंक में डाला सेव करें", mr: "बँकेत भरलेले सेव्ह करा" },
  "Cash to bank": { hi: "नकद बैंक में", mr: "रोख बँकेत" },
  "Drawer cash paid into the UPI account": {
    hi: "गल्ले का नकद UPI खाते में",
    mr: "गल्ल्यातील रोख UPI खात्यात",
  },

  // Added: paying fixed costs
  "Pay a fixed cost": { hi: "तय खर्च का भुगतान", mr: "ठरलेल्या खर्चाचे पेमेंट" },
  "Edit fixed cost paid": { hi: "दिया गया तय खर्च बदलें", mr: "दिलेला ठरलेला खर्च बदला" },
  "No fixed costs yet. Add rent and monthly salary in Settings, Shop details.": {
    hi: "अभी कोई तय खर्च नहीं। किराया और महीने का वेतन सेटिंग्स, दुकान की जानकारी में जोड़ें।",
    mr: "अजून ठरलेला खर्च नाही. भाडे आणि महिन्याचा पगार सेटिंग्ज, दुकानाची माहिती मध्ये भरा.",
  },
  "Which fixed cost": { hi: "कौन सा तय खर्च", mr: "कोणता ठरलेला खर्च" },
  "{monthly} a month · {paid} paid this month · {left} left": {
    hi: "{monthly} महीना · इस महीने {paid} दिया · {left} बाकी",
    mr: "{monthly} महिना · या महिन्यात {paid} दिले · {left} बाकी",
  },
  "Amount paid": { hi: "दी गई रकम", mr: "दिलेली रक्कम" },
  "Already counted in each day's profit, so paying it does not lower profit again. It lowers the stall's money.":
    {
      hi: "यह हर दिन के मुनाफ़े में पहले से गिना है, इसलिए भुगतान से मुनाफ़ा फिर नहीं घटता। स्टॉल का पैसा घटता है।",
      mr: "हे रोजच्या नफ्यात आधीच मोजले आहे, त्यामुळे पेमेंटने नफा पुन्हा कमी होत नाही. स्टॉलचे पैसे कमी होतात.",
    },
  "Save payment": { hi: "भुगतान सेव करें", mr: "पेमेंट सेव्ह करा" },
  "Pay rent or salary": { hi: "किराया या वेतन दें", mr: "भाडे किंवा पगार द्या" },
  "A monthly fixed cost paid today": {
    hi: "आज दिया महीने का तय खर्च",
    mr: "आज दिलेला महिन्याचा ठरलेला खर्च",
  },
};

import type { Phrases } from "../translate";

const ASK_PHONEPE =
  "Hello PhonePe Business team. Please switch on Integrated Static QR with S2S callback for my merchant account, and send me my Merchant ID, Salt Key and Salt Index. Callback URL: {url}";

/**
 * UPI payments from PhonePe (Phase 12). The message to PhonePe and PhonePe's own
 * field names stay in English: that is what PhonePe support reads and sends back.
 */
export const payments: Phrases = {
  "UPI payments": { hi: "UPI भुगतान", mr: "UPI पेमेंट" },
  "{names} connected": { hi: "{names} जुड़ा है", mr: "{names} जोडलेले" },
  "Add UPI payments as sales by themselves": {
    hi: "UPI भुगतान अपने-आप बिक्री में जुड़ें",
    mr: "UPI पेमेंट आपोआप विक्रीत जोडा",
  },
  "Connect your payment app and each UPI payment to your shop's QR is added as a sale by itself.": {
    hi: "अपना पेमेंट ऐप जोड़ें, फिर दुकान के QR पर हर UPI भुगतान अपने-आप बिक्री में जुड़ जाएगा।",
    mr: "तुमचे पेमेंट ॲप जोडा, मग दुकानाच्या QR वरील प्रत्येक UPI पेमेंट आपोआप विक्रीत जोडले जाईल.",
  },
  Connected: { hi: "जुड़ा है", mr: "जोडलेले" },
  "Waiting for your details": { hi: "आपकी जानकारी का इंतज़ार", mr: "तुमच्या माहितीची वाट" },
  "Not connected": { hi: "नहीं जुड़ा", mr: "जोडलेले नाही" },
  "More payment apps can be added later.": {
    hi: "और पेमेंट ऐप बाद में जोड़े जा सकते हैं।",
    mr: "आणखी पेमेंट ॲप नंतर जोडता येतील.",
  },
  "Filled in from PhonePe and your UPI entries. Check it against the PhonePe app.": {
    hi: "PhonePe और आपकी UPI एंट्री से भरा है। PhonePe ऐप से मिला लें।",
    mr: "PhonePe आणि तुमच्या UPI नोंदींवरून भरले आहे. PhonePe ॲपशी जुळवून पाहा.",
  },
  Copied: { hi: "कॉपी हुआ", mr: "कॉपी झाले" },
  Copy: { hi: "कॉपी", mr: "कॉपी" },
  "UPI payments are not switched on for this app yet.": {
    hi: "इस ऐप में अभी UPI भुगतान चालू नहीं है।",
    mr: "या ॲपमध्ये अजून UPI पेमेंट सुरू नाही.",
  },
  "The server needs its payments key. Ask whoever runs the app to deploy the latest version.": {
    hi: "सर्वर को पेमेंट की चाबी चाहिए। ऐप चलाने वाले से नया संस्करण डालने को कहें।",
    mr: "सर्व्हरला पेमेंटची की हवी. ॲप चालवणाऱ्यांना नवी आवृत्ती टाकायला सांगा.",
  },
  "{name} is connected": { hi: "{name} जुड़ गया है", mr: "{name} जोडले गेले आहे" },
  "Last payment received {when}.": {
    hi: "आख़िरी भुगतान {when} मिला।",
    mr: "शेवटचे पेमेंट {when} मिळाले.",
  },
  "UPI payments to your PhonePe QR will appear as sales by themselves.": {
    hi: "आपके PhonePe QR पर UPI भुगतान अपने-आप बिक्री में दिखेंगे।",
    mr: "तुमच्या PhonePe QR वरील UPI पेमेंट आपोआप विक्रीत दिसतील.",
  },
  "Get your {name} address": { hi: "अपना {name} पता लें", mr: "तुमचा {name} पत्ता घ्या" },
  "Your callback address (keep it private)": {
    hi: "आपका कॉलबैक पता (किसी को न दें)",
    mr: "तुमचा कॉलबॅक पत्ता (कोणालाही देऊ नका)",
  },
  "{name} sends each payment to this address. It is secret and only for your shop.": {
    hi: "{name} हर भुगतान इसी पते पर भेजता है। यह गुप्त है और सिर्फ़ आपकी दुकान का है।",
    mr: "{name} प्रत्येक पेमेंट याच पत्त्यावर पाठवते. तो गुप्त आहे आणि फक्त तुमच्या दुकानाचा आहे.",
  },
  "Get my address": { hi: "मेरा पता बनाएँ", mr: "माझा पत्ता बनवा" },
  "Ask {name} to switch it on": { hi: "{name} से चालू करने को कहें", mr: "{name} ला सुरू करायला सांगा" },
  "Send this to {name} Business support (Help in the {name} Business app) or your {name} contact.":
    {
      hi: "यह {name} Business सहायता ({name} Business ऐप में Help) या अपने {name} संपर्क को भेजें।",
      mr: "हे {name} Business मदत ({name} Business ॲपमधील Help) किंवा तुमच्या {name} संपर्काला पाठवा.",
    },
  Message: { hi: "संदेश", mr: "संदेश" },
  "Paste what {name} sends you": { hi: "{name} जो भेजे वह यहाँ डालें", mr: "{name} जे पाठवेल ते इथे टाका" },
  "Saved. Type again to change.": {
    hi: "सेव है। बदलने के लिए फिर लिखें।",
    mr: "सेव्ह आहे. बदलायला पुन्हा लिहा.",
  },
  "Save and connect": { hi: "सेव करें और जोड़ें", mr: "सेव्ह करा आणि जोडा" },
  "Check it works": { hi: "जाँचें कि चल रहा है", mr: "चालते का ते तपासा" },
  "Sends a pretend ₹1 payment through the same checks as a real one. No sale is added.": {
    hi: "₹1 का नकली भुगतान असली जैसी जाँच से भेजता है। कोई बिक्री नहीं जुड़ती।",
    mr: "₹1 चे खोटे पेमेंट खऱ्यासारख्या तपासणीतून पाठवते. कोणतीही विक्री जोडली जात नाही.",
  },
  "Sending…": { hi: "भेज रहे हैं…", mr: "पाठवत आहे…" },
  "Send a test": { hi: "टेस्ट भेजें", mr: "टेस्ट पाठवा" },
  "Then pay ₹1 to your shop's PhonePe QR: it should show on Today within a minute.": {
    hi: "फिर दुकान के PhonePe QR पर ₹1 भेजें: एक मिनट में आज की स्क्रीन पर दिखना चाहिए।",
    mr: "मग दुकानाच्या PhonePe QR वर ₹1 पाठवा: एका मिनिटात आजच्या स्क्रीनवर दिसायला हवे.",
  },
  "Disconnect {name}? Sales already added stay.": {
    hi: "{name} हटाएँ? जुड़ी हुई बिक्री बनी रहेगी।",
    mr: "{name} काढायचे? आधी जोडलेली विक्री राहील.",
  },
  "Disconnect {name}": { hi: "{name} हटाएँ", mr: "{name} काढा" },
  "Save the details from PhonePe first.": {
    hi: "पहले PhonePe की जानकारी सेव करें।",
    mr: "आधी PhonePe ची माहिती सेव्ह करा.",
  },
  "Test payment received and checked. You are ready.": {
    hi: "टेस्ट भुगतान मिला और जाँचा गया। सब तैयार है।",
    mr: "टेस्ट पेमेंट मिळाले आणि तपासले. सगळे तयार आहे.",
  },
  "The test did not pass. Check the details and try again.": {
    hi: "टेस्ट पास नहीं हुआ। जानकारी जाँचें और फिर कोशिश करें।",
    mr: "टेस्ट पास झाली नाही. माहिती तपासा आणि पुन्हा प्रयत्न करा.",
  },
  [ASK_PHONEPE]: { hi: ASK_PHONEPE, mr: ASK_PHONEPE },
  "Merchant ID": { hi: "Merchant ID", mr: "Merchant ID" },
  "Salt key": { hi: "Salt key", mr: "Salt key" },
  "Salt index": { hi: "Salt index", mr: "Salt index" },
  "Enter the Merchant ID from PhonePe.": {
    hi: "PhonePe से मिला Merchant ID लिखें।",
    mr: "PhonePe कडून मिळालेला Merchant ID लिहा.",
  },
  "Enter the salt key from PhonePe.": {
    hi: "PhonePe से मिली Salt key लिखें।",
    mr: "PhonePe कडून मिळालेली Salt key लिहा.",
  },
  "Enter the salt index, like 1.": {
    hi: "Salt index लिखें, जैसे 1।",
    mr: "Salt index लिहा, जसे 1.",
  },
};

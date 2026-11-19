import type { Phrases } from "../translate";

/** App bar, tab bar + sheet, theme and other v2 look-and-feel words (docs/PLAN-v2.md). */
export const appearance: Phrases = {
  // Tab bar + sheet
  "Add an entry": { hi: "एंट्री जोड़ें", mr: "नोंद जोडा" },
  Close: { hi: "बंद करें", mr: "बंद करा" },
  "Money coming in": { hi: "आने वाला पैसा", mr: "येणारे पैसे" },
  "Money spent for the shop": { hi: "दुकान के लिए खर्च", mr: "दुकानासाठी खर्च" },
  "Cash you take for yourself": { hi: "अपने लिए निकाला नकद", mr: "स्वतःसाठी काढलेली रोख" },

  // Settings
  Appearance: { hi: "रूप-रंग", mr: "रूप-रंग" },
  "Theme (this phone)": { hi: "थीम (यह फ़ोन)", mr: "थीम (हा फोन)" },
  "Same as phone": { hi: "फ़ोन जैसा", mr: "फोनप्रमाणे" },
  Light: { hi: "हल्का", mr: "फिकट" },
  Dark: { hi: "गहरा", mr: "गडद" },
  "Switch to light theme": { hi: "हल्की थीम लगाएँ", mr: "फिकट थीम लावा" },
  "Switch to dark theme": { hi: "गहरी थीम लगाएँ", mr: "गडद थीम लावा" },
  "Monthly target": { hi: "महीने का लक्ष्य", mr: "महिन्याचे लक्ष्य" },
  "Set a profit goal and track it": {
    hi: "मुनाफ़े का लक्ष्य रखें और देखें",
    mr: "नफ्याचे लक्ष्य ठेवा आणि पाहा",
  },

  // Settings hub
  "Closes at {time}": { hi: "{time} बजे बंद", mr: "{time} वाजता बंद" },
  Shop: { hi: "दुकान", mr: "दुकान" },
  "Shop details": { hi: "दुकान की जानकारी", mr: "दुकानाची माहिती" },
  "Name, language, closing time, fixed costs": {
    hi: "नाम, भाषा, बंद होने का समय, तय खर्च",
    mr: "नाव, भाषा, बंद होण्याची वेळ, ठरलेला खर्च",
  },
  App: { hi: "ऐप", mr: "ॲप" },
  "Colour, logo and dark mode": { hi: "रंग, लोगो और डार्क मोड", mr: "रंग, लोगो आणि डार्क मोड" },
  "No items yet": { hi: "अभी कोई आइटम नहीं", mr: "अजून आयटम नाहीत" },
  "1 item": { hi: "1 आइटम", mr: "1 आयटम" },
  "{n} items": { hi: "{n} आइटम", mr: "{n} आयटम" },

  // Appearance: colour
  Preview: { hi: "झलक", mr: "झलक" },
  "Brand colour": { hi: "दुकान का रंग", mr: "दुकानाचा रंग" },
  "Own colour": { hi: "अपना रंग", mr: "स्वतःचा रंग" },
  Green: { hi: "हरा", mr: "हिरवा" },
  Teal: { hi: "फ़िरोज़ी", mr: "निळसर हिरवा" },
  Blue: { hi: "नीला", mr: "निळा" },
  Indigo: { hi: "जामुनी", mr: "जांभळा-निळा" },
  Purple: { hi: "बैंगनी", mr: "जांभळा" },
  Pink: { hi: "गुलाबी", mr: "गुलाबी" },
  Red: { hi: "लाल", mr: "लाल" },
  Orange: { hi: "नारंगी", mr: "नारिंगी" },
  "Pick a colour.": { hi: "एक रंग चुनें।", mr: "एक रंग निवडा." },
  "This colour is too light to read. Pick a darker one.": {
    hi: "यह रंग बहुत हल्का है, पढ़ना मुश्किल होगा। गहरा रंग चुनें।",
    mr: "हा रंग खूप फिकट आहे, वाचणे कठीण होईल. गडद रंग निवडा.",
  },
  "Save colour": { hi: "रंग सेव करें", mr: "रंग सेव्ह करा" },
  "Colour saved.": { hi: "रंग सेव हो गया।", mr: "रंग सेव्ह झाला." },

  // Appearance: logo
  Logo: { hi: "लोगो", mr: "लोगो" },
  "Add logo": { hi: "लोगो जोड़ें", mr: "लोगो जोडा" },
  "Change logo": { hi: "लोगो बदलें", mr: "लोगो बदला" },
  Remove: { hi: "हटाएँ", mr: "काढा" },
  "PNG, JPG or WebP, up to 2 MB. It is cut to a square and made small.": {
    hi: "PNG, JPG या WebP, 2 MB तक। इसे चौकोर काटकर छोटा किया जाता है।",
    mr: "PNG, JPG किंवा WebP, 2 MB पर्यंत. तो चौकोनी कापून लहान केला जातो.",
  },
  "Pick a PNG, JPG or WebP picture.": {
    hi: "PNG, JPG या WebP फ़ोटो चुनें।",
    mr: "PNG, JPG किंवा WebP फोटो निवडा.",
  },
  "That picture is bigger than 2 MB. Pick a smaller one.": {
    hi: "यह फ़ोटो 2 MB से बड़ी है। छोटी फ़ोटो चुनें।",
    mr: "हा फोटो 2 MB पेक्षा मोठा आहे. लहान फोटो निवडा.",
  },
  "This picture could not be opened. Try another one.": {
    hi: "यह फ़ोटो खुल नहीं सकी। दूसरी आज़माएँ।",
    mr: "हा फोटो उघडला नाही. दुसरा वापरून पाहा.",
  },
  "That picture is too small. Use one at least 64 × 64.": {
    hi: "यह फ़ोटो बहुत छोटी है। कम से कम 64 × 64 वाली लें।",
    mr: "हा फोटो खूप लहान आहे. किमान 64 × 64 चा वापरा.",
  },
  "That picture is too detailed to shrink. Try a simpler one.": {
    hi: "यह फ़ोटो छोटी नहीं हो पा रही। सादी फ़ोटो आज़माएँ।",
    mr: "हा फोटो लहान होत नाही. साधा फोटो वापरून पाहा.",
  },
  "Logged out. Log in again to change the logo.": {
    hi: "लॉग आउट हो गए। लोगो बदलने के लिए फिर लॉग इन करें।",
    mr: "लॉग आउट झाले. लोगो बदलण्यासाठी पुन्हा लॉग इन करा.",
  },
  "The logo could not be saved. Try again.": {
    hi: "लोगो सेव नहीं हो सका। फिर कोशिश करें।",
    mr: "लोगो सेव्ह झाला नाही. पुन्हा प्रयत्न करा.",
  },
  "No internet. Connect and try again.": {
    hi: "इंटरनेट नहीं है। जुड़कर फिर कोशिश करें।",
    mr: "इंटरनेट नाही. जोडून पुन्हा प्रयत्न करा.",
  },
  "Logo saved.": { hi: "लोगो सेव हो गया।", mr: "लोगो सेव्ह झाला." },
  "Logo removed.": { hi: "लोगो हटा दिया।", mr: "लोगो काढला." },
  "Light or dark": { hi: "हल्का या गहरा", mr: "फिकट की गडद" },

  // Added: undo, repeat sale, usual amounts, drawer checks, voice, text size, sharing, restock
  "Bigger text": { hi: "बड़े अक्षर", mr: "मोठी अक्षरे" },
  Normal: { hi: "सामान्य", mr: "साधारण" },
  Large: { hi: "बड़ा", mr: "मोठी" },
  "Extra large": { hi: "बहुत बड़ा", mr: "खूप मोठी" },
  "Text size (this phone)": { hi: "अक्षरों का आकार (यह फ़ोन)", mr: "अक्षरांचा आकार (हा फोन)" },
};

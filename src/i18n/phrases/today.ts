import type { Phrases } from "../translate";

/** Today, an earlier day (DaySheet), the entries list, sync line and install hint. */
export const today: Phrases = {
  // Header and states
  "Loading your shop…": { hi: "आपकी दुकान खुल रही है…", mr: "तुमचे दुकान उघडत आहे…" },
  "Loading…": { hi: "लोड हो रहा है…", mr: "लोड होत आहे…" },
  "This browser cannot save entries": {
    hi: "यह ब्राउज़र एंट्री सेव नहीं कर सकता",
    mr: "हा ब्राउझर नोंदी सेव्ह करू शकत नाही",
  },
  "Private or incognito mode may be blocking storage. Open the app in a normal window.": {
    hi: "प्राइवेट या इनकॉग्निटो मोड स्टोरेज रोक रहा होगा। ऐप को सामान्य विंडो में खोलें।",
    mr: "प्रायव्हेट किंवा इनकॉग्निटो मोड स्टोरेज अडवत असेल. ॲप साध्या विंडोमध्ये उघडा.",
  },
  "It is past closing time ({time}). Close the day.": {
    hi: "दुकान बंद करने का समय ({time}) हो गया। दिन बंद करें।",
    mr: "दुकान बंद करण्याची वेळ ({time}) झाली. दिवस बंद करा.",
  },
  "Figures as of {time}": { hi: "{time} तक के आंकड़े", mr: "{time} पर्यंतचे आकडे" },

  // Sync line
  "{n} entry could not be saved. See below.": {
    hi: "{n} एंट्री सेव नहीं हो सकी। नीचे देखें।",
    mr: "{n} नोंद सेव्ह झाली नाही. खाली पाहा.",
  },
  "{n} entries could not be saved. See below.": {
    hi: "{n} एंट्री सेव नहीं हो सकीं। नीचे देखें।",
    mr: "{n} नोंदी सेव्ह झाल्या नाहीत. खाली पाहा.",
  },
  "Logged out. Log in again to send your entries.": {
    hi: "आप लॉग आउट हैं। एंट्री भेजने के लिए फिर से लॉग इन करें।",
    mr: "तुम्ही लॉग आउट आहात. नोंदी पाठवण्यासाठी पुन्हा लॉग इन करा.",
  },
  "No internet. {n} saved on this phone, will send when back online.": {
    hi: "इंटरनेट नहीं। {n} इस फ़ोन पर सेव हैं, इंटरनेट आने पर भेज देंगे।",
    mr: "इंटरनेट नाही. {n} या फोनवर सेव्ह आहेत, इंटरनेट आल्यावर पाठवू.",
  },
  "Sending {n}…": { hi: "{n} भेज रहे हैं…", mr: "{n} पाठवत आहे…" },
  "All entries saved": { hi: "सभी एंट्री सेव हो गईं", mr: "सर्व नोंदी सेव्ह झाल्या" },

  // Install hint
  "Add the app to your phone": { hi: "ऐप को फ़ोन में जोड़ें", mr: "ॲप फोनमध्ये जोडा" },
  "Opens like an app and works without internet.": {
    hi: "ऐप की तरह खुलता है और बिना इंटरनेट चलता है।",
    mr: "ॲपसारखे उघडते आणि इंटरनेटशिवाय चालते.",
  },
  "Tap Share, then “Add to Home Screen”.": {
    hi: "Share दबाएँ, फिर “Add to Home Screen”।",
    mr: "Share दाबा, मग “Add to Home Screen”.",
  },
  Install: { hi: "इंस्टॉल करें", mr: "इंस्टॉल करा" },
  "Hide this suggestion": { hi: "यह सुझाव छिपाएँ", mr: "ही सूचना लपवा" },

  // Day sheet
  "Day closed": { hi: "दिन बंद हुआ", mr: "दिवस बंद झाला" },
  "not sent yet": { hi: "अभी भेजा नहीं", mr: "अजून पाठवले नाही" },
  "Profit {amount}": { hi: "मुनाफ़ा {amount}", mr: "नफा {amount}" },
  "See summary": { hi: "सारांश देखें", mr: "सारांश पाहा" },
  "Sales so far": { hi: "अब तक की बिक्री", mr: "आतापर्यंतची विक्री" },
  "Sales entered": { hi: "दर्ज बिक्री", mr: "नोंदवलेली विक्री" },
  "Target {amount}": { hi: "लक्ष्य {amount}", mr: "लक्ष्य {amount}" },
  "Break-even {amount}": { hi: "खर्च निकलेगा {amount} पर", mr: "खर्च निघेल {amount} वर" },
  "Sales against today's target": {
    hi: "आज के लक्ष्य के मुकाबले बिक्री",
    mr: "आजच्या लक्ष्याच्या तुलनेत विक्री",
  },
  "Sales against the day's break-even": {
    hi: "दिन का खर्च निकलने के मुकाबले बिक्री",
    mr: "दिवसाचा खर्च निघण्याच्या तुलनेत विक्री",
  },
  "Today's target reached": { hi: "आज का लक्ष्य पूरा", mr: "आजचे लक्ष्य पूर्ण" },
  "{amount} to go": { hi: "{amount} बाकी", mr: "{amount} बाकी" },
  "Break-even {amount} crossed": {
    hi: "{amount} का खर्च निकल गया",
    mr: "{amount} चा खर्च निघाला",
  },
  "Break-even crossed": { hi: "खर्च निकल गया", mr: "खर्च निघाला" },
  "{amount} to go to cover the day's costs": {
    hi: "दिन का खर्च निकालने के लिए {amount} बाकी",
    mr: "दिवसाचा खर्च निघण्यासाठी {amount} बाकी",
  },
  Expenses: { hi: "खर्च", mr: "खर्च" },
  "Fixed costs": { hi: "तय खर्च", mr: "ठरलेला खर्च" },
  "Profit so far": { hi: "अब तक का मुनाफ़ा", mr: "आतापर्यंतचा नफा" },
  Profit: { hi: "मुनाफ़ा", mr: "नफा" },
  "+ Sale": { hi: "+ बिक्री", mr: "+ विक्री" },
  "+ Expense": { hi: "+ खर्च", mr: "+ खर्च" },
  "Day summary": { hi: "दिन का सारांश", mr: "दिवसाचा सारांश" },
  "Edit close": { hi: "बंद किया दिन बदलें", mr: "बंद केलेला दिवस बदला" },
  "Close day": { hi: "दिन बंद करें", mr: "दिवस बंद करा" },
  "You chose {mode}: enter cash and UPI sales when you close the day.": {
    hi: "आपने {mode} चुना है: दिन बंद करते समय नकद और UPI बिक्री डालें।",
    mr: "तुम्ही {mode} निवडले आहे: दिवस बंद करताना रोख आणि UPI विक्री भरा.",
  },
  "Today's entries": { hi: "आज की एंट्री", mr: "आजच्या नोंदी" },
  Entries: { hi: "एंट्री", mr: "नोंदी" },

  // Entries list
  "Tap a row to edit": { hi: "बदलने के लिए लाइन दबाएँ", mr: "बदलण्यासाठी ओळ दाबा" },
  "No entries yet. Add a sale or an expense above.": {
    hi: "अभी कोई एंट्री नहीं। ऊपर से बिक्री या खर्च जोड़ें।",
    mr: "अजून नोंद नाही. वरून विक्री किंवा खर्च जोडा.",
  },
  "Not saved: {reason}": { hi: "सेव नहीं हुआ: {reason}", mr: "सेव्ह झाले नाही: {reason}" },
  "Something in it is not valid.": {
    hi: "इसमें कुछ गलत है।",
    mr: "यात काहीतरी चुकीचे आहे.",
  },
  "The date is too far back or ahead.": {
    hi: "तारीख बहुत पुरानी या आगे की है।",
    mr: "तारीख खूप जुनी किंवा पुढची आहे.",
  },
  "It clashes with another entry.": {
    hi: "यह दूसरी एंट्री से टकराती है।",
    mr: "ही दुसऱ्या नोंदीशी जुळत नाही.",
  },
  "the server refused it.": { hi: "सर्वर ने मना कर दिया।", mr: "सर्व्हरने नाकारले." },
  Discard: { hi: "हटा दें", mr: "काढून टाका" },
};

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

  // Added: drawer cash, expense notes, fixed-cost switch, sounds and reminders
  "Profit before fixed costs {amount}": {
    hi: "तय खर्च से पहले मुनाफ़ा {amount}",
    mr: "ठरलेल्या खर्चाआधी नफा {amount}",
  },
  "Fixed costs ({amount} a day) are not taken out here. Reports still count them.": {
    hi: "तय खर्च ({amount} रोज़) यहाँ नहीं घटाया गया। रिपोर्ट में वह गिना जाता है।",
    mr: "ठरलेला खर्च ({amount} रोज) इथे वजा केलेला नाही. अहवालात तो मोजला जातो.",
  },
  "Opening {amount}": { hi: "शुरुआत {amount}", mr: "सुरुवात {amount}" },
  "Cash sales {amount}": { hi: "नकद बिक्री {amount}", mr: "रोख विक्री {amount}" },
  "Expenses {amount}": { hi: "खर्च {amount}", mr: "खर्च {amount}" },
  "Taken out {amount}": { hi: "निकाला {amount}", mr: "काढले {amount}" },
  "UPI today": { hi: "आज UPI", mr: "आज UPI" },
  "More cash went out than came in. Check the entries.": {
    hi: "जितना नकद आया उससे ज़्यादा निकला। एंट्री जाँचें।",
    mr: "आलेल्या रोखीपेक्षा जास्त गेली. नोंदी तपासा.",
  },
  "Yesterday was not closed. Close it now.": {
    hi: "कल का दिन बंद नहीं हुआ। अभी बंद करें।",
    mr: "कालचा दिवस बंद झाला नाही. आता बंद करा.",
  },
  "{day} was not closed. Close it now.": {
    hi: "{day} बंद नहीं हुआ। अभी बंद करें।",
    mr: "{day} बंद झाला नाही. आता बंद करा.",
  },
  "The day is still not closed": { hi: "दिन अभी भी बंद नहीं हुआ", mr: "दिवस अजून बंद झाला नाही" },
  "Close it now so today's profit is saved correctly.": {
    hi: "अभी बंद करें ताकि आज का मुनाफ़ा सही सेव हो।",
    mr: "आता बंद करा म्हणजे आजचा नफा बरोबर सेव्ह होईल.",
  },
  Sounds: { hi: "आवाज़", mr: "आवाज" },
  "A short sound when a sale is saved, a UPI payment comes in or it is closing time.": {
    hi: "बिक्री सेव होने पर, UPI पेमेंट आने पर या बंद करने के समय छोटी आवाज़।",
    mr: "विक्री सेव्ह झाल्यावर, UPI पेमेंट आल्यावर किंवा बंद करण्याच्या वेळी छोटा आवाज.",
  },

  // Added: undo, repeat sale, usual amounts, drawer checks, voice, text size, sharing, restock
  "Cash counted in the drawer now (₹)": {
    hi: "अभी गल्ले में गिना नकद (₹)",
    mr: "आता गल्ल्यात मोजलेली रोख (₹)",
  },
  "It matches.": { hi: "मेल खाता है।", mr: "जुळते." },
  "{amount} more than expected. A sale may be missing.": {
    hi: "उम्मीद से {amount} ज़्यादा। शायद कोई बिक्री छूट गई।",
    mr: "अपेक्षेपेक्षा {amount} जास्त. एखादी विक्री राहिली असेल.",
  },
  "{amount} short. An expense or cash out may be missing.": {
    hi: "{amount} कम। शायद कोई खर्च या निकाला नकद छूट गया।",
    mr: "{amount} कमी. एखादा खर्च किंवा काढलेली रोख राहिली असेल.",
  },
  "Count the drawer now": { hi: "अभी गल्ला गिनें", mr: "आता गल्ला मोजा" },
  "Repeat last sale": { hi: "पिछली बिक्री दोहराएँ", mr: "मागची विक्री पुन्हा करा" },
  "Tap to edit · hold to delete": {
    hi: "बदलने के लिए दबाएँ · मिटाने के लिए दबाए रखें",
    mr: "बदलण्यासाठी दाबा · पुसण्यासाठी दाबून ठेवा",
  },
  "Needs internet. You can also fix it when you close the day.": {
    hi: "इंटरनेट चाहिए। दिन बंद करते समय भी ठीक कर सकते हैं।",
    mr: "इंटरनेट लागते. दिवस बंद करताना पण दुरुस्त करू शकता.",
  },
  "Start of day: is {amount} in the drawer?": {
    hi: "दिन की शुरुआत: क्या गल्ले में {amount} है?",
    mr: "दिवसाची सुरुवात: गल्ल्यात {amount} आहेत का?",
  },
  "Count it once, so the drawer figure stays right all day.": {
    hi: "एक बार गिन लें, ताकि पूरे दिन गल्ले का हिसाब सही रहे।",
    mr: "एकदा मोजा, म्हणजे दिवसभर गल्ल्याचा हिशोब बरोबर राहील.",
  },
  "Cash in the drawer now (₹)": { hi: "अभी गल्ले में नकद (₹)", mr: "आता गल्ल्यात रोख (₹)" },
  "Yes, correct": { hi: "हाँ, सही है", mr: "हो, बरोबर" },
  "No, change": { hi: "नहीं, बदलें", mr: "नाही, बदला" },
  "Time to buy?": { hi: "खरीदने का समय?", mr: "खरेदीची वेळ?" },
  "you usually buy it every day. It has been {since} days.": {
    hi: "आप इसे रोज़ खरीदते हैं। {since} दिन हो गए।",
    mr: "तुम्ही हे रोज घेता. {since} दिवस झाले.",
  },
  "you usually buy it every {every} days. It has been {since} days.": {
    hi: "आप इसे हर {every} दिन में खरीदते हैं। {since} दिन हो गए।",
    mr: "तुम्ही हे दर {every} दिवसांनी घेता. {since} दिवस झाले.",
  },
  "Hide for today": { hi: "आज के लिए छिपाएँ", mr: "आजसाठी लपवा" },
  "Entry deleted · {amount}": { hi: "एंट्री मिटाई · {amount}", mr: "नोंद पुसली · {amount}" },
  "Sale saved · {amount} {mode}": {
    hi: "बिक्री सेव · {amount} {mode}",
    mr: "विक्री सेव्ह · {amount} {mode}",
  },
  "Expense saved · {amount}": { hi: "खर्च सेव · {amount}", mr: "खर्च सेव्ह · {amount}" },
  "Cash out saved · {amount}": { hi: "निकाला नकद सेव · {amount}", mr: "काढलेली रोख सेव्ह · {amount}" },
  Undo: { hi: "वापस लें", mr: "रद्द करा" },

  // Added: stall money and steadier voice entry
  "Stall money now": { hi: "अभी स्टॉल का पैसा", mr: "आता स्टॉलचे पैसे" },
  "Cash in drawer": { hi: "गल्ले में नकद", mr: "गल्ल्यात रोख" },
  "UPI sales {amount}": { hi: "UPI बिक्री {amount}", mr: "UPI विक्री {amount}" },
  "Paid from your own pocket today: {amount}. The stall owes you this.": {
    hi: "आज अपनी जेब से दिया: {amount}। यह स्टॉल को आपको लौटाना है।",
    mr: "आज स्वतःच्या खिशातून दिले: {amount}. हे स्टॉलने तुम्हाला परत द्यायचे आहे.",
  },
  "This is money, not profit: fixed costs and cash you take out count differently.": {
    hi: "यह पैसा है, मुनाफ़ा नहीं: तय खर्च और निकाला नकद अलग गिने जाते हैं।",
    mr: "हे पैसे आहेत, नफा नाही: ठरलेला खर्च आणि काढलेली रोख वेगळी मोजली जाते.",
  },

  // Added: UPI account balance and cash to bank
  "To bank {amount}": { hi: "बैंक में {amount}", mr: "बँकेत {amount}" },
  "Start {amount}": { hi: "शुरुआत {amount}", mr: "सुरुवात {amount}" },
  "From drawer {amount}": { hi: "गल्ले से {amount}", mr: "गल्ल्यातून {amount}" },
  "Add UPI balance": { hi: "UPI बैलेंस जोड़ें", mr: "UPI शिल्लक भरा" },
  "Check UPI balance": { hi: "UPI बैलेंस जाँचें", mr: "UPI शिल्लक तपासा" },
  "Needs internet. Try again when you are online.": {
    hi: "इंटरनेट चाहिए। ऑनलाइन होने पर फिर कोशिश करें।",
    mr: "इंटरनेट लागते. ऑनलाइन असताना पुन्हा प्रयत्न करा.",
  },
  "Balance your UPI or bank app shows now (₹)": {
    hi: "आपका UPI या बैंक ऐप अभी जो बैलेंस दिखाता है (₹)",
    mr: "तुमचे UPI किंवा बँक ॲप आता दाखवत असलेली शिल्लक (₹)",
  },
  "Use this balance": { hi: "यही बैलेंस रखें", mr: "हीच शिल्लक ठेवा" },
  "{amount} more than expected. A UPI sale may be missing.": {
    hi: "उम्मीद से {amount} ज़्यादा। शायद कोई UPI बिक्री छूट गई।",
    mr: "अपेक्षेपेक्षा {amount} जास्त. एखादी UPI विक्री राहिली असेल.",
  },
  "{amount} less than expected. A UPI payment may be missing.": {
    hi: "उम्मीद से {amount} कम। शायद कोई UPI भुगतान छूट गया।",
    mr: "अपेक्षेपेक्षा {amount} कमी. एखादे UPI पेमेंट राहिले असेल.",
  },
  "Owner · from UPI": { hi: "मालिक · UPI से", mr: "मालक · UPI मधून" },
  "Drawer to UPI account": { hi: "गल्ले से UPI खाते में", mr: "गल्ल्यातून UPI खात्यात" },

  // Added: paying fixed costs
  "Fixed costs paid {amount}": { hi: "तय खर्च दिया {amount}", mr: "ठरलेला खर्च दिला {amount}" },
  "Fixed cost paid": { hi: "तय खर्च दिया", mr: "ठरलेला खर्च दिला" },
  "Fixed cost": { hi: "तय खर्च", mr: "ठरलेला खर्च" },

  // Added: stall money always on Today
  "Cash and UPI sales are added when you close the day.": {
    hi: "नकद और UPI बिक्री दिन बंद करते समय जुड़ती है।",
    mr: "रोख आणि UPI विक्री दिवस बंद करताना जोडली जाते.",
  },
};

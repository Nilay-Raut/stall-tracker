import type { Phrases } from "../translate";

/** Close day, the day summary and its notes. */
export const close: Phrases = {
  // Close day form and its checks
  "Enter the cash you started the day with.": {
    hi: "दिन की शुरुआत में जितना नकद था, वह डालें।",
    mr: "दिवसाच्या सुरुवातीला असलेली रोख टाका.",
  },
  "Count the cash in the drawer and enter it.": {
    hi: "गल्ले का नकद गिनकर डालें।",
    mr: "गल्ल्यातील रोख मोजून टाका.",
  },
  "Enter today's UPI total (0 if none).": {
    hi: "आज का UPI कुल डालें (न हो तो 0)।",
    mr: "आजचे एकूण UPI टाका (नसेल तर 0).",
  },
  "Enter an amount like 140, or leave it empty.": {
    hi: "140 जैसी रकम डालें, या खाली छोड़ दें।",
    mr: "140 सारखी रक्कम टाका, किंवा रिकामे ठेवा.",
  },
  "The drawer has less than you started with. Check the amounts, or add a missing expense or cash taken out.":
    {
      hi: "गल्ले में शुरुआत से कम पैसे हैं। रकम जाँचें, या छूटा हुआ खर्च या निकाला गया नकद जोड़ें।",
      mr: "गल्ल्यात सुरुवातीपेक्षा कमी पैसे आहेत. रक्कम तपासा, किंवा राहिलेला खर्च किंवा काढलेली रोख जोडा.",
    },
  "The drawer has less than you started with": {
    hi: "गल्ले में शुरुआत से कम पैसे हैं",
    mr: "गल्ल्यात सुरुवातीपेक्षा कमी पैसे आहेत",
  },
  "Check the amounts, or add a missing expense or cash taken out.": {
    hi: "रकम जाँचें, या छूटा हुआ खर्च या निकाला गया नकद जोड़ें।",
    mr: "रक्कम तपासा, किंवा राहिलेला खर्च किंवा काढलेली रोख जोडा.",
  },
  "That date cannot be closed.": {
    hi: "यह तारीख बंद नहीं की जा सकती।",
    mr: "ही तारीख बंद करता येत नाही.",
  },
  "Sending {n} entry for this day…": {
    hi: "इस दिन की {n} एंट्री भेज रहे हैं…",
    mr: "या दिवसाची {n} नोंद पाठवत आहे…",
  },
  "Sending {n} entries for this day…": {
    hi: "इस दिन की {n} एंट्री भेज रहे हैं…",
    mr: "या दिवसाच्या {n} नोंदी पाठवत आहे…",
  },
  "Connect to the internet. The day can be closed once every entry has reached the server.": {
    hi: "इंटरनेट चालू करें। सारी एंट्री सर्वर पर पहुँचने के बाद दिन बंद होगा।",
    mr: "इंटरनेट चालू करा. सर्व नोंदी सर्व्हरवर पोहोचल्यावर दिवस बंद करता येईल.",
  },
  "1. Cash in drawer now": { hi: "1. अभी गल्ले में नकद", mr: "1. आता गल्ल्यातील रोख" },
  "Opening cash": { hi: "शुरुआती नकद", mr: "सुरुवातीची रोख" },
  Done: { hi: "हो गया", mr: "झाले" },
  Change: { hi: "बदलें", mr: "बदला" },
  "Cash in the drawer when the day started": {
    hi: "दिन शुरू होते समय गल्ले में नकद",
    mr: "दिवस सुरू झाला तेव्हा गल्ल्यातील रोख",
  },
  "Expenses paid from drawer": { hi: "गल्ले से दिए खर्च", mr: "गल्ल्यातून दिलेले खर्च" },
  "Cash sales today": { hi: "आज की नकद बिक्री", mr: "आजची रोख विक्री" },
  "2. UPI total": { hi: "2. UPI कुल", mr: "2. एकूण UPI" },
  "{step}. Food wasted today (optional)": {
    hi: "{step}. आज बर्बाद माल (ज़रूरी नहीं)",
    mr: "{step}. आज वाया गेलेला माल (ऐच्छिक)",
  },
  "Sales today {amount} · profit": {
    hi: "आज बिक्री {amount} · मुनाफ़ा",
    mr: "आज विक्री {amount} · नफा",
  },
  "Closing…": { hi: "बंद कर रहे हैं…", mr: "बंद करत आहे…" },
  "Save changes": { hi: "बदलाव सेव करें", mr: "बदल सेव्ह करा" },
  "Close day and see summary": {
    hi: "दिन बंद करें और सारांश देखें",
    mr: "दिवस बंद करा आणि सारांश पाहा",
  },
  "3. Plates sold (optional)": {
    hi: "3. बिकी प्लेट (ज़रूरी नहीं)",
    mr: "3. विकलेल्या प्लेट (ऐच्छिक)",
  },
  "Count plates": { hi: "प्लेट गिनें", mr: "प्लेट मोजा" },
  "Skip today": { hi: "आज छोड़ें", mr: "आज वगळा" },
  "Not counting plates today.": { hi: "आज प्लेट नहीं गिन रहे।", mr: "आज प्लेट मोजत नाही." },
  "One less {item}": { hi: "एक {item} कम", mr: "एक {item} कमी" },
  "{item} plates": { hi: "{item} प्लेट", mr: "{item} प्लेट" },
  "One more {item}": { hi: "एक {item} ज़्यादा", mr: "एक {item} जास्त" },
  "Cash matches your entries.": {
    hi: "नकद आपकी एंट्री से मेल खाता है।",
    mr: "रोख तुमच्या नोंदींशी जुळते.",
  },
  "{amount} more cash than you recorded": {
    hi: "लिखे से {amount} ज़्यादा नकद",
    mr: "नोंदीपेक्षा {amount} जास्त रोख",
  },
  "{amount} less cash than you recorded": {
    hi: "लिखे से {amount} कम नकद",
    mr: "नोंदीपेक्षा {amount} कमी रोख",
  },
  "You entered {entered} in cash sales. The drawer shows {drawer}.": {
    hi: "आपने नकद बिक्री {entered} लिखी। गल्ले के हिसाब से {drawer} है।",
    mr: "तुम्ही रोख विक्री {entered} नोंदवली. गल्ल्यानुसार {drawer} आहे.",
  },
  "Check today's total in your payment app.": {
    hi: "आज का कुल अपने पेमेंट ऐप में देखें।",
    mr: "आजची एकूण रक्कम पेमेंट ॲपमध्ये पाहा.",
  },
  "{n} UPI entry": { hi: "{n} UPI एंट्री", mr: "{n} UPI नोंद" },
  "{n} UPI entries": { hi: "{n} UPI एंट्री", mr: "{n} UPI नोंदी" },
  "Check today's total in your payment app. Matches your {entries}.": {
    hi: "आज का कुल अपने पेमेंट ऐप में देखें। आपकी {entries} से मेल खाता है।",
    mr: "आजची एकूण रक्कम पेमेंट ॲपमध्ये पाहा. तुमच्या {entries} शी जुळते.",
  },
  "Check today's total in your payment app. Your {entries} add up to {amount}.": {
    hi: "आज का कुल अपने पेमेंट ऐप में देखें। आपकी {entries} का जोड़ {amount} है।",
    mr: "आजची एकूण रक्कम पेमेंट ॲपमध्ये पाहा. तुमच्या {entries} ची बेरीज {amount} आहे.",
  },

  // Closing today on the phone (also offline)
  "This day can no longer be closed.": {
    hi: "यह दिन अब बंद नहीं किया जा सकता।",
    mr: "हा दिवस आता बंद करता येत नाही.",
  },
  "Something in the close was not valid. Check the amounts.": {
    hi: "दिन बंद करने में कुछ गलत था। रकम जाँचें।",
    mr: "दिवस बंद करताना काहीतरी चुकले. रक्कम तपासा.",
  },
  "The shop's data is not on this phone yet.": {
    hi: "दुकान का डेटा अभी इस फ़ोन पर नहीं है।",
    mr: "दुकानाची माहिती अजून या फोनवर नाही.",
  },
  "The server could not save this close.": {
    hi: "सर्वर यह दिन बंद सेव नहीं कर सका।",
    mr: "सर्व्हर हा दिवस बंद सेव्ह करू शकला नाही.",
  },
  "Edit closed day": { hi: "बंद दिन बदलें", mr: "बंद दिवस बदला" },
  "Close day": { hi: "दिन बंद करें", mr: "दिवस बंद करा" },
  "Open Today once with internet first": {
    hi: "पहले एक बार इंटरनेट के साथ 'आज' खोलें",
    mr: "आधी एकदा इंटरनेटसह 'आज' उघडा",
  },
  "The phone needs today's shop details before it can close the day without signal.": {
    hi: "बिना सिग्नल दिन बंद करने के लिए फ़ोन को आज के दुकान की जानकारी चाहिए।",
    mr: "सिग्नलशिवाय दिवस बंद करण्यासाठी फोनला आजची दुकानाची माहिती हवी.",
  },
  "Close with internet": { hi: "इंटरनेट से बंद करें", mr: "इंटरनेटने बंद करा" },
  "Saved on this phone": { hi: "इस फ़ोन पर सेव हुआ", mr: "या फोनवर सेव्ह झाले" },
  "It will be sent when you are back online. Nothing else to do.": {
    hi: "इंटरनेट आने पर भेज दिया जाएगा। और कुछ नहीं करना है।",
    mr: "इंटरनेट आल्यावर पाठवले जाईल. आणखी काही करायचे नाही.",
  },
  "Edit day": { hi: "दिन बदलें", mr: "दिवस बदला" },
  "This close was not saved": { hi: "यह दिन बंद सेव नहीं हुआ", mr: "हा दिवस बंद सेव्ह झाला नाही" },
  "The server could not save it.": {
    hi: "सर्वर इसे सेव नहीं कर सका।",
    mr: "सर्व्हर हे सेव्ह करू शकला नाही.",
  },
  "Correct it and save again.": { hi: "ठीक करके फिर सेव करें।", mr: "दुरुस्त करून पुन्हा सेव्ह करा." },

  // Day summary
  "Day closed": { hi: "दिन बंद हुआ", mr: "दिवस बंद झाला" },
  "Profit today": { hi: "आज का मुनाफ़ा", mr: "आजचा नफा" },
  "Break-even crossed": { hi: "खर्च निकल गया", mr: "खर्च निघाला" },
  "{amount} short of break-even": {
    hi: "खर्च निकलने में {amount} कम",
    mr: "खर्च निघायला {amount} कमी",
  },
  "You needed {amount} to cover today's costs.": {
    hi: "आज का खर्च निकालने के लिए {amount} चाहिए थे।",
    mr: "आजचा खर्च भरून काढायला {amount} हवे होते.",
  },
  Sales: { hi: "बिक्री", mr: "विक्री" },
  "Cash {cash} · UPI {upi}": { hi: "नकद {cash} · UPI {upi}", mr: "रोख {cash} · UPI {upi}" },
  Expenses: { hi: "खर्च", mr: "खर्च" },
  "Fixed costs for one day": { hi: "एक दिन का तय खर्च", mr: "एका दिवसाचा ठरलेला खर्च" },
  "Rent, salary, electricity": { hi: "किराया, वेतन, बिजली", mr: "भाडे, पगार, वीज" },
  Profit: { hi: "मुनाफ़ा", mr: "नफा" },
  "The day's sales target was reached": {
    hi: "दिन का बिक्री लक्ष्य पूरा हुआ",
    mr: "दिवसाचे विक्री लक्ष्य पूर्ण झाले",
  },
  "{amount} short of the day's target": {
    hi: "दिन के लक्ष्य से {amount} कम",
    mr: "दिवसाच्या लक्ष्यापेक्षा {amount} कमी",
  },
  "Sales against the day's target": {
    hi: "दिन के लक्ष्य के मुकाबले बिक्री",
    mr: "दिवसाच्या लक्ष्याच्या तुलनेत विक्री",
  },
  "Things to know": { hi: "ध्यान देने वाली बातें", mr: "लक्षात ठेवण्यासारखे" },
  "From the plate count": { hi: "प्लेट गिनती से", mr: "प्लेट मोजणीवरून" },
  "{item} earned the most: {amount} from {n} plate.": {
    hi: "{item} से सबसे ज़्यादा कमाई: {n} प्लेट से {amount}।",
    mr: "{item} मधून सर्वाधिक कमाई: {n} प्लेटमधून {amount}.",
  },
  "{item} earned the most: {amount} from {n} plates.": {
    hi: "{item} से सबसे ज़्यादा कमाई: {n} प्लेट से {amount}।",
    mr: "{item} मधून सर्वाधिक कमाई: {n} प्लेटमधून {amount}.",
  },
  "{item} earn {amount} more per plate. Only {n} sold.": {
    hi: "{item} में हर प्लेट पर {amount} ज़्यादा मिलता है। सिर्फ़ {n} बिकीं।",
    mr: "{item} मध्ये प्रत्येक प्लेटवर {amount} जास्त मिळतात. फक्त {n} विकल्या.",
  },

  // Things to know (src/lib/summaryNotes.ts)
  "Cash check: drawer matches your entries": {
    hi: "नकद जाँच: गल्ला आपकी एंट्री से मेल खाता है",
    mr: "रोख तपासणी: गल्ला तुमच्या नोंदींशी जुळतो",
  },
  OK: { hi: "ठीक", mr: "बरोबर" },
  "Cash check: more in drawer than recorded": {
    hi: "नकद जाँच: गल्ले में लिखे से ज़्यादा",
    mr: "रोख तपासणी: गल्ल्यात नोंदीपेक्षा जास्त",
  },
  "Cash check: less in drawer than recorded": {
    hi: "नकद जाँच: गल्ले में लिखे से कम",
    mr: "रोख तपासणी: गल्ल्यात नोंदीपेक्षा कमी",
  },
  "Cash taken out by owner": { hi: "मालिक ने नकद निकाला", mr: "मालकाने काढलेली रोख" },
  "Food wasted": { hi: "बर्बाद माल", mr: "वाया गेलेला माल" },
  "Cash left for tomorrow": { hi: "कल के लिए बचा नकद", mr: "उद्यासाठी उरलेली रोख" },
  "Last {weekday} sales were {amount}": {
    hi: "पिछले {weekday} बिक्री {amount} थी",
    mr: "मागच्या {weekday} ला विक्री {amount} होती",
  },
  Same: { hi: "उतनी ही", mr: "तेवढीच" },
  "{amount} more": { hi: "{amount} ज़्यादा", mr: "{amount} जास्त" },
  "{amount} less": { hi: "{amount} कम", mr: "{amount} कमी" },
};

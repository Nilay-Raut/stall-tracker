import type { Phrases } from "../translate";

/** Target (wireframe screen 9). */
export const target: Phrases = {
  "Set a profit target for {month}": {
    hi: "{month} के लिए मुनाफ़े का लक्ष्य रखें",
    mr: "{month} साठी नफ्याचे लक्ष्य ठरवा",
  },
  "The app then works out the sales you need each day and how to get there.": {
    hi: "फिर ऐप बताएगा कि रोज़ कितनी बिक्री चाहिए और वहाँ कैसे पहुँचें।",
    mr: "मग ॲप सांगेल की रोज किती विक्री हवी आणि तिथे कसे पोहोचायचे.",
  },
  "earned · {percent}%": { hi: "कमाया · {percent}%", mr: "कमावले · {percent}%" },
  "Profit earned against the target": {
    hi: "लक्ष्य के मुकाबले कमाया मुनाफ़ा",
    mr: "लक्ष्याच्या तुलनेत कमावलेला नफा",
  },
  "{gone} of {total} days gone ({percent}%).": {
    hi: "{total} में से {gone} दिन बीत गए ({percent}%)।",
    mr: "{total} पैकी {gone} दिवस गेले ({percent}%).",
  },
  "Target reached, {amount} above it.": {
    hi: "लक्ष्य पूरा, {amount} ज़्यादा।",
    mr: "लक्ष्य पूर्ण, {amount} जास्त.",
  },
  "About {amount} behind.": { hi: "लगभग {amount} पीछे।", mr: "सुमारे {amount} मागे." },
  "About {amount} ahead.": { hi: "लगभग {amount} आगे।", mr: "सुमारे {amount} पुढे." },
  "Right on pace.": { hi: "बिल्कुल सही रफ़्तार पर।", mr: "अगदी योग्य वेगात." },

  "To reach it": { hi: "लक्ष्य तक पहुँचने के लिए", mr: "लक्ष्य गाठण्यासाठी" },
  "This is the last day of the month.": {
    hi: "आज महीने का आख़िरी दिन है।",
    mr: "आज महिन्याचा शेवटचा दिवस आहे.",
  },
  "Record a few days of sales to work out what each day needs.": {
    hi: "हर दिन कितनी बिक्री चाहिए, यह जानने के लिए कुछ दिन की बिक्री दर्ज करें।",
    mr: "दररोज किती विक्री हवी हे कळण्यासाठी काही दिवसांची विक्री नोंदवा.",
  },
  "{amount} sales a day for {days} day": {
    hi: "{days} दिन तक रोज़ {amount} की बिक्री",
    mr: "{days} दिवस रोज {amount} विक्री",
  },
  "{amount} sales a day for {days} days": {
    hi: "{days} दिन तक रोज़ {amount} की बिक्री",
    mr: "{days} दिवस रोज {amount} विक्री",
  },
  "Your average is {average}. That is {extraSales} more sales, or about {extraProfit} more profit, each day.":
    {
      hi: "आपका औसत {average} है। यानी हर दिन {extraSales} ज़्यादा बिक्री, या लगभग {extraProfit} ज़्यादा मुनाफ़ा।",
      mr: "तुमची सरासरी {average} आहे. म्हणजे दररोज {extraSales} जास्त विक्री, किंवा सुमारे {extraProfit} जास्त नफा.",
    },
  "Your average of {average} already covers it. Keep it up.": {
    hi: "आपका औसत {average} इसके लिए काफ़ी है। ऐसे ही चलते रहें।",
    mr: "तुमची सरासरी {average} यासाठी पुरेशी आहे. असेच चालू ठेवा.",
  },

  // Ways to get there (src/domain/ways.ts)
  "Ways to get there": { hi: "वहाँ पहुँचने के तरीके", mr: "तिथे पोहोचण्याचे मार्ग" },
  "Extra profit per day": { hi: "हर दिन का ज़्यादा मुनाफ़ा", mr: "दररोजचा जास्तीचा नफा" },
  "Add your items and count plates at closing to get ideas here.": {
    hi: "यहाँ सुझाव पाने के लिए अपने आइटम जोड़ें और दिन बंद करते समय प्लेट गिनें।",
    mr: "इथे सूचना मिळवण्यासाठी तुमचे आयटम जोडा आणि दिवस बंद करताना प्लेट मोजा.",
  },
  "Sell {n} more {item}": {
    hi: "{item} की {n} प्लेट और बेचें",
    mr: "{item} च्या आणखी {n} प्लेट विका",
  },
  "{amount} profit a plate. This alone covers the gap.": {
    hi: "हर प्लेट पर {amount} मुनाफ़ा। सिर्फ़ इससे कमी पूरी हो जाएगी।",
    mr: "प्रति प्लेट {amount} नफा. एवढ्यानेच तूट भरून निघेल.",
  },
  "{amount} profit a plate, your best margin.": {
    hi: "हर प्लेट पर {amount} मुनाफ़ा, आपका सबसे अच्छा मार्जिन।",
    mr: "प्रति प्लेट {amount} नफा, तुमचा सर्वात चांगला मार्जिन.",
  },
  "Move {n} plates from {from} to {to}": {
    hi: "{from} की जगह {to} की {n} प्लेट बेचें",
    mr: "{from} ऐवजी {to} च्या {n} प्लेट विका",
  },
  "{item} earns {amount} more a plate than {other}.": {
    hi: "{item} में {other} से हर प्लेट {amount} ज़्यादा मुनाफ़ा है।",
    mr: "{item} मध्ये {other} पेक्षा प्रति प्लेट {amount} जास्त नफा आहे.",
  },
  "Raise {item} by {amount}": {
    hi: "{item} का दाम {amount} बढ़ाएँ",
    mr: "{item} चा दर {amount} ने वाढवा",
  },
  "At {n} plates a day, if sales stay the same.": {
    hi: "रोज़ {n} प्लेट पर, अगर बिक्री उतनी ही रहे।",
    mr: "दिवसाला {n} प्लेट, विक्री तेवढीच राहिली तर.",
  },

  // Target form and its server message
  "Profit target {amount}": { hi: "मुनाफ़े का लक्ष्य {amount}", mr: "नफ्याचे लक्ष्य {amount}" },
  Change: { hi: "बदलें", mr: "बदला" },
  "Profit you want in {month}": {
    hi: "{month} में आपको कितना मुनाफ़ा चाहिए",
    mr: "{month} मध्ये तुम्हाला किती नफा हवा",
  },
  "After expenses and fixed costs like rent and salary.": {
    hi: "खर्च और किराया, वेतन जैसे तय खर्च निकालकर।",
    mr: "खर्च आणि भाडे, पगार असे ठरलेले खर्च वजा करून.",
  },
  "Saving…": { hi: "सेव हो रहा है…", mr: "सेव्ह होत आहे…" },
  "Save target": { hi: "लक्ष्य सेव करें", mr: "लक्ष्य सेव्ह करा" },
  Cancel: { hi: "रद्द करें", mr: "रद्द करा" },
  "Enter the profit you want this month, like 80000.": {
    hi: "इस महीने जितना मुनाफ़ा चाहिए वह लिखें, जैसे 80000।",
    mr: "या महिन्यात हवा असलेला नफा लिहा, उदा. 80000.",
  },
};

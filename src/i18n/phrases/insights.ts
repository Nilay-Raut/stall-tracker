import type { Phrases } from "../translate";

/** Reports v2: items, bills, busy hours, "What to do" (docs/PLAN-v2.md, Phase 4). */
export const insights: Phrases = {
  // Period
  "same as the same day last week": {
    hi: "पिछले हफ़्ते के उसी दिन जितना",
    mr: "मागच्या आठवड्यातील त्याच दिवसाइतके",
  },
  "was {share}% the same day last week": {
    hi: "पिछले हफ़्ते के उसी दिन {share}% था",
    mr: "मागच्या आठवड्यातील त्याच दिवशी {share}% होते",
  },
  "{name} is {share}% of sales today. It was {previous}% on the same day last week.": {
    hi: "{name} आज बिक्री का {share}% है। पिछले हफ़्ते के उसी दिन {previous}% था।",
    mr: "{name} आज विक्रीच्या {share}% आहे. मागच्या आठवड्यातील त्याच दिवशी {previous}% होते.",
  },

  // Bills
  Bills: { hi: "बिल", mr: "बिले" },
  "Average bill": { hi: "औसत बिल", mr: "सरासरी बिल" },
  "Items per bill": { hi: "प्रति बिल आइटम", mr: "प्रति बिल आयटम" },
  "{n} bills": { hi: "{n} बिल", mr: "{n} बिले" },

  // Top items
  "Top items": { hi: "सबसे ज़्यादा बिकने वाले", mr: "सर्वाधिक विकले जाणारे" },
  "Rank items by": { hi: "आइटम किस हिसाब से", mr: "आयटम कशानुसार" },
  "{n} sold": { hi: "{n} बिके", mr: "{n} विकले" },
  "Top {shown} of {total} items.": {
    hi: "{total} में से ऊपर के {shown} आइटम।",
    mr: "{total} पैकी वरचे {shown} आयटम.",
  },

  // What to do
  "What to do": { hi: "क्या करें", mr: "काय करावे" },
  "From the last 4 weeks": { hi: "पिछले 4 हफ़्तों से", mr: "मागील 4 आठवड्यांवरून" },
  "Make about {n} more {item} on {day}.": {
    hi: "{day} को लगभग {n} {item} ज़्यादा बनाएँ।",
    mr: "{day} ला सुमारे {n} {item} जास्त बनवा.",
  },
  "{item} sells about {n} more on {day}s than on an average day.": {
    hi: "{item} {day} को आम दिन से लगभग {n} ज़्यादा बिकता है।",
    mr: "{item} {day} ला सामान्य दिवसापेक्षा सुमारे {n} जास्त विकले जाते.",
  },
  "Raise {item} by {amount}?": {
    hi: "{item} का दाम {amount} बढ़ाएँ?",
    mr: "{item} ची किंमत {amount} वाढवायची?",
  },
  "You keep {percent}% of its price. {amount} more on each adds about {gain} a month at today's sales.":
    {
      hi: "इसके दाम का {percent}% आपको मिलता है। हर एक पर {amount} ज़्यादा से आज की बिक्री पर महीने में लगभग {gain} ज़्यादा मिलेंगे।",
      mr: "याच्या किमतीपैकी {percent}% तुम्हाला मिळतात. प्रत्येकावर {amount} जास्त घेतल्यास आजच्या विक्रीवर महिन्याला सुमारे {gain} जास्त मिळतील.",
    },
  "{item} has not sold in {n} days.": {
    hi: "{item} {n} दिनों से नहीं बिका।",
    mr: "{item} {n} दिवसांपासून विकले नाही.",
  },
  "Promote it, or take it off the menu to cut waste.": {
    hi: "इसका प्रचार करें, या बर्बादी कम करने के लिए मेन्यू से हटा दें।",
    mr: "त्याची जाहिरात करा, किंवा नासाडी टाळण्यासाठी मेन्यूतून काढा.",
  },
  "Average bill fell to {now}.": {
    hi: "औसत बिल घटकर {now} हो गया।",
    mr: "सरासरी बिल घटून {now} झाले.",
  },
  "It was {before}. Suggest a drink or an add-on with each order.": {
    hi: "पहले {before} था। हर ऑर्डर के साथ कोई पेय या साथ की चीज़ सुझाएँ।",
    mr: "आधी {before} होते. प्रत्येक ऑर्डरसोबत पेय किंवा जोड पदार्थ सुचवा.",
  },
  "{a} and {b} sell together.": {
    hi: "{a} और {b} साथ बिकते हैं।",
    mr: "{a} आणि {b} एकत्र विकले जातात.",
  },
  "They were on the same bill {n} times. A combo price could sell more of both.": {
    hi: "ये {n} बार एक ही बिल पर थे। कॉम्बो दाम से दोनों ज़्यादा बिक सकते हैं।",
    mr: "हे {n} वेळा एकाच बिलावर होते. कॉम्बो किंमत ठेवल्यास दोन्ही जास्त विकले जातील.",
  },
  "Busiest: {day}, {time}.": { hi: "सबसे व्यस्त: {day}, {time}।", mr: "सर्वात गर्दी: {day}, {time}." },
  "{percent}% of that day's sales come in these two hours. Keep stock and change ready.": {
    hi: "उस दिन की {percent}% बिक्री इन दो घंटों में होती है। माल और खुल्ले पैसे तैयार रखें।",
    mr: "त्या दिवसाची {percent}% विक्री या दोन तासांत होते. माल आणि सुटे पैसे तयार ठेवा.",
  },

  // Sections
  "Not selling": { hi: "नहीं बिक रहे", mr: "विकले जात नाहीत" },
  "Saved items, last 60 days": {
    hi: "सहेजे आइटम, पिछले 60 दिन",
    mr: "जतन केलेले आयटम, मागील 60 दिवस",
  },
  "Not sold in 60 days": { hi: "60 दिनों में नहीं बिका", mr: "60 दिवसांत विकले नाही" },
  "Last sold {n} days ago": { hi: "आख़िरी बार {n} दिन पहले बिका", mr: "शेवटचे {n} दिवसांपूर्वी विकले" },
  "Busy hours": { hi: "व्यस्त घंटे", mr: "गर्दीचे तास" },
  "Sales by weekday and hour": { hi: "दिन और घंटे के हिसाब से बिक्री", mr: "वार आणि तासानुसार विक्री" },
  Less: { hi: "कम", mr: "कमी" },
  More: { hi: "ज़्यादा", mr: "जास्त" },
  "Where the profit comes from": { hi: "मुनाफ़ा कहाँ से आता है", mr: "नफा कुठून येतो" },
  "Bar: profit · Line: sales": { hi: "पट्टी: मुनाफ़ा · रेखा: बिक्री", mr: "पट्टी: नफा · रेषा: विक्री" },
  "{profit}% of profit · {sales}% of sales": {
    hi: "मुनाफ़े का {profit}% · बिक्री का {sales}%",
    mr: "नफ्याचे {profit}% · विक्रीचे {sales}%",
  },
  "Sells a lot, earns little. Check its price or cost.": {
    hi: "बहुत बिकता है, कमाई कम। इसका दाम या लागत देखें।",
    mr: "खूप विकले जाते, कमाई कमी. याची किंमत किंवा खर्च तपासा.",
  },
  "Bought together": { hi: "साथ ख़रीदे गए", mr: "एकत्र घेतलेले" },
  "On the same bill": { hi: "एक ही बिल पर", mr: "एकाच बिलावर" },

  // Item page and export
  "Item report": { hi: "आइटम रिपोर्ट", mr: "आयटम अहवाल" },
  "Not sold in this period.": { hi: "इस अवधि में नहीं बिका।", mr: "या कालावधीत विकले नाही." },
  Sold: { hi: "बिके", mr: "विकले" },
  Price: { hi: "दाम", mr: "किंमत" },
  Totals: { hi: "कुल", mr: "एकूण" },
  "against before": { hi: "पहले से", mr: "आधीपेक्षा" },
  "Sold each day": { hi: "हर दिन बिके", mr: "दररोज विकले" },
  "Sold each day: {list}": { hi: "हर दिन बिके: {list}", mr: "दररोज विकले: {list}" },
  "Average sold by weekday": { hi: "दिन के हिसाब से औसत बिक्री", mr: "वारानुसार सरासरी विक्री" },
  "Often bought with": { hi: "अक्सर साथ में", mr: "बहुतेक वेळा सोबत" },
  "On {n} of its bills": { hi: "इसके {n} बिलों पर", mr: "याच्या {n} बिलांवर" },
  "Every item on every bill (CSV)": {
    hi: "हर बिल का हर आइटम (CSV)",
    mr: "प्रत्येक बिलातील प्रत्येक आयटम (CSV)",
  },
  Item: { hi: "आइटम", mr: "आयटम" },
};

import type { Phrases } from "../translate";

/** Reports and Supplier prices (wireframe screens 8 and 10). */
export const reports: Phrases = {
  "Loading…": { hi: "लोड हो रहा है…", mr: "लोड होत आहे…" },

  // Weekdays (insights) and their short forms (weekday chart)
  Sunday: { hi: "रविवार", mr: "रविवार" },
  Monday: { hi: "सोमवार", mr: "सोमवार" },
  Tuesday: { hi: "मंगलवार", mr: "मंगळवार" },
  Wednesday: { hi: "बुधवार", mr: "बुधवार" },
  Thursday: { hi: "गुरुवार", mr: "गुरुवार" },
  Friday: { hi: "शुक्रवार", mr: "शुक्रवार" },
  Saturday: { hi: "शनिवार", mr: "शनिवार" },
  Sun: { hi: "रवि", mr: "रवि" },
  Mon: { hi: "सोम", mr: "सोम" },
  Tue: { hi: "मंगल", mr: "मंगळ" },
  Wed: { hi: "बुध", mr: "बुध" },
  Thu: { hi: "गुरु", mr: "गुरु" },
  Fri: { hi: "शुक्र", mr: "शुक्र" },
  Sat: { hi: "शनि", mr: "शनि" },

  // Period picker
  Week: { hi: "हफ़्ता", mr: "आठवडा" },
  Month: { hi: "महीना", mr: "महिना" },
  Custom: { hi: "तारीख चुनें", mr: "तारखा निवडा" },
  "Report period": { hi: "रिपोर्ट की अवधि", mr: "अहवालाचा कालावधी" },
  From: { hi: "से", mr: "पासून" },
  To: { hi: "तक", mr: "पर्यंत" },
  Show: { hi: "दिखाएँ", mr: "दाखवा" },
  "{from} to {to}": { hi: "{from} से {to}", mr: "{from} ते {to}" },

  // Profit card
  "Profit this month": { hi: "इस महीने का मुनाफ़ा", mr: "या महिन्याचा नफा" },
  "Profit, last 7 days": { hi: "मुनाफ़ा, पिछले 7 दिन", mr: "नफा, मागील 7 दिवस" },
  "Profit, {range}": { hi: "मुनाफ़ा, {range}", mr: "नफा, {range}" },
  "Sales {sales} − Expenses {expenses} − Fixed {fixed}": {
    hi: "बिक्री {sales} − खर्च {expenses} − तय खर्च {fixed}",
    mr: "विक्री {sales} − खर्च {expenses} − ठरलेला खर्च {fixed}",
  },
  "Sales for each day from {range}": {
    hi: "{range} हर दिन की बिक्री",
    mr: "{range} दररोजची विक्री",
  },
  "Sales per day.": { hi: "हर दिन की बिक्री।", mr: "दररोजची विक्री." },
  "{dates} was closed.": { hi: "{dates} को दुकान बंद थी।", mr: "{dates} रोजी दुकान बंद होते." },
  "{dates} were closed.": { hi: "{dates} को दुकान बंद थी।", mr: "{dates} रोजी दुकान बंद होते." },

  // What the numbers say
  "What the numbers say": { hi: "आँकड़े क्या कहते हैं", mr: "आकडे काय सांगतात" },
  "{best} earns about double {worst}.": {
    hi: "{best} को {worst} से लगभग दोगुनी कमाई होती है।",
    mr: "{best} ला {worst} पेक्षा जवळपास दुप्पट कमाई होते.",
  },
  "{best} earns {percent}% more than {worst}.": {
    hi: "{best} को {worst} से {percent}% ज़्यादा कमाई होती है।",
    mr: "{best} ला {worst} पेक्षा {percent}% जास्त कमाई होते.",
  },
  "{best} averages {bestAmount} and {worst} {worstAmount}. Prepare less on {worst} to cut waste.": {
    hi: "औसत बिक्री: {best} {bestAmount}, {worst} {worstAmount}। बर्बादी घटाने के लिए {worst} को कम माल बनाएँ।",
    mr: "सरासरी विक्री: {best} {bestAmount}, {worst} {worstAmount}. वाया जाणे कमी करण्यासाठी {worst} ला कमी माल बनवा.",
  },
  "{name} is taking a bigger share.": {
    hi: "{name} का हिस्सा बढ़ रहा है।",
    mr: "{name} चा वाटा वाढत आहे.",
  },
  "{name} is {share}% of sales this week. It was {previous}% the week before.": {
    hi: "इस हफ़्ते {name} बिक्री का {share}% है। पिछले हफ़्ते यह {previous}% था।",
    mr: "या आठवड्यात {name} विक्रीच्या {share}% आहे. मागच्या आठवड्यात ते {previous}% होते.",
  },
  "{name} is {share}% of sales this month. It was {previous}% last month.": {
    hi: "इस महीने {name} बिक्री का {share}% है। पिछले महीने यह {previous}% था।",
    mr: "या महिन्यात {name} विक्रीच्या {share}% आहे. मागच्या महिन्यात ते {previous}% होते.",
  },
  "{name} is {share}% of sales in this period. It was {previous}% in the period before.": {
    hi: "इस अवधि में {name} बिक्री का {share}% है। पिछली अवधि में यह {previous}% था।",
    mr: "या कालावधीत {name} विक्रीच्या {share}% आहे. आधीच्या कालावधीत ते {previous}% होते.",
  },
  "{name} costs more.": { hi: "{name} महँगा हो गया।", mr: "{name} महाग झाले." },
  "{name} went from {from} to {to} a {unit} since {month}.": {
    hi: "{month} से {name} {from} से बढ़कर {to} प्रति {unit} हो गया।",
    mr: "{month} पासून {name} {from} वरून {to} प्रति {unit} झाले.",
  },

  // Where the money goes
  "Where the money goes": { hi: "पैसा कहाँ जाता है", mr: "पैसा कुठे जातो" },
  "same as the week before": { hi: "पिछले हफ़्ते जितना", mr: "मागच्या आठवड्याइतकेच" },
  "same as last month": { hi: "पिछले महीने जितना", mr: "मागच्या महिन्याइतकेच" },
  "same as the period before": { hi: "पिछली अवधि जितना", mr: "आधीच्या कालावधीइतकेच" },
  "was {share}% the week before": {
    hi: "पिछले हफ़्ते {share}% था",
    mr: "मागच्या आठवड्यात {share}% होते",
  },
  "was {share}% last month": { hi: "पिछले महीने {share}% था", mr: "मागच्या महिन्यात {share}% होते" },
  "was {share}% the period before": {
    hi: "पिछली अवधि में {share}% था",
    mr: "आधीच्या कालावधीत {share}% होते",
  },

  // Best and worst days, cash and UPI, items
  "Best and worst days": { hi: "सबसे अच्छे और कमज़ोर दिन", mr: "सर्वात चांगले आणि कमी दिवस" },
  "Average sales per day in rupees": {
    hi: "हर दिन की औसत बिक्री, रुपये में",
    mr: "दररोजची सरासरी विक्री, रुपयांत",
  },
  "Average sales by weekday": { hi: "वार के हिसाब से औसत बिक्री", mr: "वारानुसार सरासरी विक्री" },
  "Cash and UPI": { hi: "नकद और UPI", mr: "रोख आणि UPI" },
  "Cash {cash} percent, UPI {upi} percent": {
    hi: "नकद {cash} प्रतिशत, UPI {upi} प्रतिशत",
    mr: "रोख {cash} टक्के, UPI {upi} टक्के",
  },
  "Profit by item": { hi: "आइटम के हिसाब से मुनाफ़ा", mr: "आयटमनुसार नफा" },
  "From plate counts": { hi: "प्लेट गिनती से", mr: "प्लेट मोजणीवरून" },
  "{plates} plates · {amount} profit each": {
    hi: "{plates} प्लेट · हर प्लेट {amount} मुनाफ़ा",
    mr: "{plates} प्लेट · प्रत्येकी {amount} नफा",
  },
  "Nothing recorded in this period yet.": {
    hi: "इस अवधि में अभी कुछ दर्ज नहीं है।",
    mr: "या कालावधीत अजून काही नोंद नाही.",
  },

  // Supplier prices
  "Supplier prices": { hi: "सप्लायर के दाम", mr: "पुरवठादारांचे दर" },
  'No purchases yet. When you add an expense, fill in "Material details" (what, how much, from whom) to see prices here.':
    {
      hi: 'अभी कोई खरीद नहीं। खर्च जोड़ते समय "माल की जानकारी" (क्या, कितना, किससे) भरें, तब यहाँ दाम दिखेंगे।',
      mr: 'अजून खरेदी नाही. खर्च नोंदवताना "मालाची माहिती" (काय, किती, कोणाकडून) भरा, म्हणजे इथे दर दिसतील.',
    },
  Material: { hi: "माल", mr: "माल" },
  "No purchases of {name} yet.": {
    hi: "{name} की अभी कोई खरीद नहीं।",
    mr: "{name} ची अजून खरेदी नाही.",
  },
  "{name}, latest rate": { hi: "{name}, ताज़ा भाव", mr: "{name}, ताजा भाव" },
  "a {unit}": { hi: "प्रति {unit}", mr: "प्रति {unit}" },
  start: { hi: "शुरू", mr: "सुरुवात" },
  same: { hi: "उतना ही", mr: "तेवढाच" },
  "This rise costs about {amount} more a month": {
    hi: "इस बढ़त से हर महीने लगभग {amount} ज़्यादा खर्च",
    mr: "या वाढीमुळे दरमहा सुमारे {amount} जास्त खर्च",
  },
  "You buy about {quantity} {unit} a month, at {amount} more per {unit} than the month before.": {
    hi: "आप हर महीने लगभग {quantity} {unit} खरीदते हैं, पिछले महीने से प्रति {unit} {amount} ज़्यादा पर।",
    mr: "तुम्ही दरमहा सुमारे {quantity} {unit} घेता, मागच्या महिन्यापेक्षा प्रति {unit} {amount} जास्त दराने.",
  },
  "Compare suppliers": { hi: "सप्लायर की तुलना", mr: "पुरवठादारांची तुलना" },
  "Last bought {date}": { hi: "आख़िरी खरीद {date}", mr: "शेवटची खरेदी {date}" },
  Cheaper: { hi: "सस्ता", mr: "स्वस्त" },
  "Buying only from {supplier} saves {perUnit} a {unit}, about {monthly} a month.": {
    hi: "सिर्फ़ {supplier} से खरीदने पर प्रति {unit} {perUnit} बचेंगे, यानी हर महीने लगभग {monthly}।",
    mr: "फक्त {supplier} कडून घेतल्यास प्रति {unit} {perUnit} वाचतील, म्हणजे दरमहा सुमारे {monthly}.",
  },
  "Purchase history": { hi: "खरीद का इतिहास", mr: "खरेदीचा इतिहास" },

  // Units (src/domain/materials.ts) and the rate note on the expense form
  kg: { hi: "किलो", mr: "किलो" },
  litre: { hi: "लीटर", mr: "लिटर" },
  gram: { hi: "ग्राम", mr: "ग्रॅम" },
  piece: { hi: "नग", mr: "नग" },
  packet: { hi: "पैकेट", mr: "पाकीट" },
  dozen: { hi: "दर्जन", mr: "डझन" },
  bottle: { hi: "बोतल", mr: "बाटली" },
  "Rate {rate} a {unit}": { hi: "भाव {rate} प्रति {unit}", mr: "भाव {rate} प्रति {unit}" },
  "Same as your last purchase {from}.": {
    hi: "पिछली खरीद जितना ही {from}।",
    mr: "मागच्या खरेदीइतकाच {from}.",
  },
  "{amount} more than your last purchase {from}.": {
    hi: "पिछली खरीद {from} से {amount} ज़्यादा।",
    mr: "मागच्या खरेदीपेक्षा {from} {amount} जास्त.",
  },
  "{amount} less than your last purchase {from}.": {
    hi: "पिछली खरीद {from} से {amount} कम।",
    mr: "मागच्या खरेदीपेक्षा {from} {amount} कमी.",
  },

  // Added: drawer cash, expense notes, fixed-cost switch, sounds and reminders
  "What it was for": { hi: "किस चीज़ के लिए", mr: "कशासाठी" },
  Note: { hi: "नोट", mr: "टीप" },
};

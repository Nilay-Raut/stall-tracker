import type { Phrases } from "../translate";

/** Items and margins, add / edit item. */
export const items: Phrases = {
  Items: { hi: "आइटम", mr: "आयटम" },
  "Best margin": { hi: "सबसे अच्छा मार्जिन", mr: "सर्वात जास्त मार्जिन" },
  "Lowest margin": { hi: "सबसे कम मार्जिन", mr: "सर्वात कमी मार्जिन" },
  "Item, price and cost": { hi: "आइटम, दाम और लागत", mr: "आयटम, किंमत आणि खर्च" },
  "Margin a plate": { hi: "प्रति प्लेट मार्जिन", mr: "प्रति प्लेट मार्जिन" },
  "No items yet. Add the things you sell to count plates at closing and see which earn the most.": {
    hi: "अभी कोई आइटम नहीं। जो बेचते हैं वह जोड़ें, ताकि बंद करते समय प्लेट गिन सकें और देख सकें किससे सबसे ज़्यादा कमाई होती है।",
    mr: "अजून आयटम नाहीत. तुम्ही जे विकता ते जोडा, म्हणजे बंद करताना प्लेट मोजता येतील आणि कशातून जास्त कमाई होते ते दिसेल.",
  },
  "Price {price} · Cost {cost}": {
    hi: "दाम {price} · लागत {cost}",
    mr: "किंमत {price} · खर्च {cost}",
  },
  "{percent}% of price": { hi: "दाम का {percent}%", mr: "किंमतीच्या {percent}%" },
  "{material} is up {amount} a {unit} since {since}": {
    hi: "{since} से {material} {amount} प्रति {unit} महँगा हुआ",
    mr: "{since} पासून {material} {amount} प्रति {unit} महाग झाले",
  },
  "Recheck the cost of items that use {material} so their margins stay correct.": {
    hi: "जिन आइटम में {material} लगता है, उनकी लागत फिर से देखें ताकि मार्जिन सही रहे।",
    mr: "ज्या आयटममध्ये {material} लागते त्यांचा खर्च पुन्हा तपासा, म्हणजे मार्जिन बरोबर राहील.",
  },
  "Margin is price minus the cost to make one plate. Rent, salary and other fixed costs are counted separately.":
    {
      hi: "मार्जिन = दाम में से एक प्लेट बनाने की लागत घटाकर। किराया, वेतन और बाकी तय खर्च अलग गिने जाते हैं।",
      mr: "मार्जिन = किंमतीतून एक प्लेट बनवण्याचा खर्च वजा. भाडे, पगार आणि इतर ठरलेले खर्च वेगळे मोजले जातात.",
    },
  "+ Add item": { hi: "+ आइटम जोड़ें", mr: "+ आयटम जोडा" },
  "Add item": { hi: "आइटम जोड़ें", mr: "आयटम जोडा" },
  "Edit item": { hi: "आइटम बदलें", mr: "आयटम बदला" },

  "Item name": { hi: "आइटम का नाम", mr: "आयटमचे नाव" },
  "Veg steam momos": { hi: "वेज स्टीम मोमोज़", mr: "व्हेज स्टीम मोमोज" },
  "Selling price for one plate (₹)": {
    hi: "एक प्लेट का बिक्री दाम (₹)",
    mr: "एका प्लेटची विक्री किंमत (₹)",
  },
  "What do you know?": { hi: "आपको क्या पता है?", mr: "तुम्हाला काय माहीत आहे?" },
  "My cost": { hi: "मेरी लागत", mr: "माझा खर्च" },
  "Margin in ₹": { hi: "मार्जिन ₹ में", mr: "मार्जिन ₹ मध्ये" },
  "Margin in %": { hi: "मार्जिन % में", mr: "मार्जिन % मध्ये" },
  "Cost to make one plate (₹)": {
    hi: "एक प्लेट बनाने की लागत (₹)",
    mr: "एक प्लेट बनवण्याचा खर्च (₹)",
  },
  "Margin you keep on one plate (₹)": {
    hi: "एक प्लेट पर आपका मार्जिन (₹)",
    mr: "एका प्लेटवर तुमचे मार्जिन (₹)",
  },
  "Margin as % of selling price": {
    hi: "बिक्री दाम का % मार्जिन",
    mr: "विक्री किंमतीच्या % मार्जिन",
  },
  "The app works out the rest": { hi: "बाकी ऐप खुद निकालेगा", mr: "बाकीचे ॲप स्वतः काढेल" },
  Cost: { hi: "लागत", mr: "खर्च" },
  Margin: { hi: "मार्जिन", mr: "मार्जिन" },
  "Margin %": { hi: "मार्जिन %", mr: "मार्जिन %" },
  "At {plates} plates a day this item earns {amount} a day.": {
    hi: "रोज़ {plates} प्लेट पर यह आइटम रोज़ {amount} कमाता है।",
    mr: "रोज {plates} प्लेटवर हा आयटम रोज {amount} कमावतो.",
  },
  "Cost is higher than price. You lose money on each plate.": {
    hi: "लागत दाम से ज़्यादा है। हर प्लेट पर नुकसान है।",
    mr: "खर्च किंमतीपेक्षा जास्त आहे. प्रत्येक प्लेटवर तोटा होतो.",
  },
  "Save item": { hi: "आइटम सेव करें", mr: "आयटम सेव्ह करा" },
  "Remove {name}? Past plate counts are kept.": {
    hi: "{name} हटाएँ? पुरानी प्लेट गिनती रखी रहेगी।",
    mr: "{name} काढून टाकायचे? जुनी प्लेट मोजणी ठेवली जाईल.",
  },
  "Remove item": { hi: "आइटम हटाएँ", mr: "आयटम काढून टाका" },

  "Name the item.": { hi: "आइटम का नाम लिखें।", mr: "आयटमचे नाव लिहा." },
  "Keep the name under 40 letters.": {
    hi: "नाम 40 अक्षरों से छोटा रखें।",
    mr: "नाव 40 अक्षरांपेक्षा लहान ठेवा.",
  },
  "Enter the selling price, like 60.": {
    hi: "बिक्री दाम लिखें, जैसे 60।",
    mr: "विक्री किंमत लिहा, जसे 60.",
  },
  "The price must be more than ₹0.": {
    hi: "दाम ₹0 से ज़्यादा होना चाहिए।",
    mr: "किंमत ₹0 पेक्षा जास्त हवी.",
  },
  "Enter a number, like 24.": { hi: "संख्या लिखें, जैसे 24।", mr: "आकडा लिहा, जसे 24." },
  "That would make the cost less than ₹0.": {
    hi: "इससे लागत ₹0 से कम हो जाएगी।",
    mr: "यामुळे खर्च ₹0 पेक्षा कमी होईल.",
  },
  "Up to 30 items.": { hi: "ज़्यादा से ज़्यादा 30 आइटम।", mr: "जास्तीत जास्त 30 आयटम." },
  "This item no longer exists.": { hi: "यह आइटम अब नहीं है।", mr: "हा आयटम आता नाही." },
};

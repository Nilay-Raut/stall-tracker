import type { Phrases } from "../translate";

/** Error screens (app/error.tsx, app/global-error.tsx). */
export const errors: Phrases = {
  "Something went wrong": { hi: "कुछ गड़बड़ हो गई", mr: "काहीतरी चुकलं" },
  "This screen could not load. Your saved entries are safe. Try again.": {
    hi: "यह स्क्रीन नहीं खुली। आपकी सेव की हुई एंट्री सुरक्षित हैं। फिर से कोशिश करें।",
    mr: "ही स्क्रीन उघडली नाही. तुमच्या सेव्ह केलेल्या नोंदी सुरक्षित आहेत. पुन्हा प्रयत्न करा.",
  },
  "The app could not start. Your saved entries are safe. Try again.": {
    hi: "ऐप शुरू नहीं हुआ। आपकी सेव की हुई एंट्री सुरक्षित हैं। फिर से कोशिश करें।",
    mr: "ॲप सुरू झालं नाही. तुमच्या सेव्ह केलेल्या नोंदी सुरक्षित आहेत. पुन्हा प्रयत्न करा.",
  },
  "Try again": { hi: "फिर से कोशिश करें", mr: "पुन्हा प्रयत्न करा" },
  "Back to Today": { hi: "आज पर वापस", mr: "आजवर परत" },
  "Error code: {code}": { hi: "गड़बड़ी कोड: {code}", mr: "त्रुटी कोड: {code}" },
};

import { useState, useCallback, useEffect } from "react";

/**
 * Multi-lingual i18n Dictionary for IRCTC SRLMS Passenger Portal
 * Full support for English, हिंदी (Hindi), and Hinglish.
 */

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "hinglish", label: "Hinglish" },
];

export const CATEGORY_TRANSLATIONS = {
  "Coach & Safety": {
    en: "Coach & Safety",
    hi: "कोच और सुरक्षा",
    hinglish: "Coach & Safety",
  },
  "Customer's Choice": {
    en: "Customer's Choice",
    hi: "यात्री पसंद",
    hinglish: "Customer's Choice",
  },
  "E-Catering & Station Assistance": {
    en: "E-Catering & Station Assistance",
    hi: "ई-कैटरिंग व स्टेशन सहायता",
    hinglish: "E-Catering & Station Help",
  },
  "Linen Issues": {
    en: "Linen Issues",
    hi: "लिनन / बिस्तर समस्याएं",
    hinglish: "Linen Issues",
  },
  "Fines & Payments": {
    en: "Fines & Payments",
    hi: "जुर्माना एवं भुगतान",
    hinglish: "Fines & Payments",
  },
  "Journey Info": {
    en: "Journey Info",
    hi: "यात्रा विवरण",
    hinglish: "Journey Info",
  },
  "Policy & General FAQ": {
    en: "Policy & General FAQ",
    hi: "नीति व सामान्य प्रश्न",
    hinglish: "Policy & General FAQs",
  },
  "General": {
    en: "General",
    hi: "सामान्य",
    hinglish: "General",
  },
};

const DICTIONARY = {
  // Navigation & Common
  portalTitle: {
    en: "IRCTC SRLMS",
    hi: "आईआरसीटीसी एसआरएलएमएस",
    hinglish: "IRCTC SRLMS",
  },
  passengerSelfService: {
    en: "Passenger Self-Service",
    hi: "यात्री स्व-सेवा पोर्टल",
    hinglish: "Passenger Self-Service",
  },
  theme: {
    en: "Theme",
    hi: "थीम",
    hinglish: "Theme",
  },
  sos: {
    en: "SOS",
    hi: "आपातकाल",
    hinglish: "SOS",
  },
  logout: {
    en: "Log out",
    hi: "लॉग आउट",
    hinglish: "Log out",
  },
  backToHelp: {
    en: "Help & Support",
    hi: "सहायता और समर्थन",
    hinglish: "Help & Support",
  },
  back: {
    en: "Back",
    hi: "वापस",
    hinglish: "Back",
  },
  navSections: {
    en: "Navigation Sections",
    hi: "नेविगेशन अनुभाग",
    hinglish: "Navigation Sections",
  },
  helpSupportHome: {
    en: "Help & Support (Home)",
    hi: "सहायता और समर्थन (होम)",
    hinglish: "Help & Support (Home)",
  },
  myJourneys: {
    en: "My Journeys",
    hi: "मेरी यात्राएं",
    hinglish: "Meri Journeys",
  },
  issuesFiled: {
    en: "Issues Filed",
    hi: "दर्ज शिकायतें",
    hinglish: "Filed Complaints",
  },
  pastAiQueries: {
    en: "Past AI Queries",
    hi: "पिछली AI बातचीत",
    hinglish: "Purani AI Queries",
  },
  checkQueryStatus: {
    en: "Check Query Status",
    hi: "शिकायत की स्थिति जांचें",
    hinglish: "Query Status Check Karein",
  },
  changeTheme: {
    en: "Change Theme",
    hi: "थीम बदलें",
    hinglish: "Theme Badlein",
  },
  signOut: {
    en: "Sign Out",
    hi: "साइन आउट",
    hinglish: "Sign Out",
  },
  passengerMenu: {
    en: "Passenger Menu",
    hi: "यात्री मेनू",
    hinglish: "Passenger Menu",
  },
  verifiedPassenger: {
    en: "Verified Rail Passenger",
    hi: "सत्यापित रेल यात्री",
    hinglish: "Verified Rail Passenger",
  },
  returnToCall: {
    en: "Return to Call",
    hi: "कॉल पर वापस जाएं",
    hinglish: "Call par Return Karein",
  },
  inCall: {
    en: "In Call",
    hi: "कॉल चालू",
    hinglish: "In Call",
  },

  // Dashboard Hero
  welcome: {
    en: "Welcome",
    hi: "स्वागत है",
    hinglish: "Welcome",
  },
  officialAssistance: {
    en: "Official Indian Railways Passenger Assistance & Grievance Care Center.",
    hi: "भारतीय रेल का आधिकारिक यात्री सहायता एवं शिकायत निवारण केंद्र।",
    hinglish: "Official Indian Railways Passenger Assistance & Grievance Care Center.",
  },
  activeJourney: {
    en: "Active Journey",
    hi: "सक्रिय यात्रा",
    hinglish: "Active Journey",
  },
  passengerHelpDesk: {
    en: "Passenger Help & Support Desk",
    hi: "यात्री सहायता एवं समर्थन डेस्क",
    hinglish: "Passenger Help & Support Desk",
  },
  selectAssistance: {
    en: "Select an assistance option below",
    hi: "नीचे दिए गए सहायता विकल्पों में से चुनें",
    hinglish: "Neeche diye gaye assistance options mein se select karein",
  },
  talkToAi: {
    en: "Talk to AI Assistant",
    hi: "AI सहायक से बात करें",
    hinglish: "AI Assistant se Baat Karein",
  },
  instantAiBadge: {
    en: "Instant 24/7 AI Voice & Text Support",
    hi: "त्वरित 24/7 AI आवाज़ और टेक्स्ट सहायता",
    hinglish: "Instant 24/7 AI Voice & Text Support",
  },
  talkToAiDesc: {
    en: "Instant answers in Hindi, English, and Hinglish for blankets, bedsheets, coach attendants, train status, or automated transfer to live human executives.",
    hi: "कंबल, चादर, कोच अटेंडेंट, ट्रेन स्थिति के लिए हिंदी, अंग्रेजी और हिंग्लिश में तुरंत उत्तर या लाइव एग्जीक्यूटिव से सीधा संपर्क।",
    hinglish: "Blanket, bedsheet, coach attendant, train status ke liye Hindi, English aur Hinglish mein instant answers ya live executive transfer.",
  },
  startVoiceChat: {
    en: "Start Voice / Chat",
    hi: "आवाज़ / चैट शुरू करें",
    hinglish: "Voice / Chat Start Karein",
  },
  raiseJourneyIssue: {
    en: "Raise Journey Issue",
    hi: "यात्रा समस्या दर्ज करें",
    hinglish: "Journey Issue Raise Karein",
  },
  raiseJourneyIssueDesc: {
    en: "Linen missing, unwashed bedsheet, pillow, or coach attendant dispute? File a tracked complaint.",
    hi: "कंबल या चादर नहीं मिली, गंदा बिस्तर या अटेंडेंट से शिकायत? ट्रैक की जाने वाली शिकायत दर्ज करें।",
    hinglish: "Linen missing, unwashed bedsheet, takiya ya attendant dispute? Track hone wali complaint file karein.",
  },
  reportSpecificIssue: {
    en: "Report Specific Issue",
    hi: "विशिष्ट समस्या दर्ज करें",
    hinglish: "Specific Issue Report Karein",
  },
  generalSupportQuery: {
    en: "General Support Query",
    hi: "सामान्य सहायता प्रश्न",
    hinglish: "General Support Query",
  },
  generalSupportQueryDesc: {
    en: "Fine deduction, payment link questions, portal account access, or IRCTC general inquiries.",
    hi: "जुर्माना कटौती, भुगतान लिंक प्रश्न, पोर्टल खाता या आईआरसीटीसी सामान्य पूछताछ।",
    hinglish: "Fine deduction, payment link questions, portal account ya IRCTC general inquiries.",
  },
  submitGeneralQuery: {
    en: "Submit General Query",
    hi: "सामान्य प्रश्न सबमिट करें",
    hinglish: "General Query Submit Karein",
  },
  callExecutiveDirect: {
    en: "Direct Phone Call to Executive",
    hi: "एग्जीक्यूटिव को डायरेक्ट फोन कॉल",
    hinglish: "Executive ko Direct Phone Call",
  },
  callExecutiveDirectDesc: {
    en: "Prefer talking on a live phone call? Ring an available passenger support desk agent right now.",
    hi: "क्या आप फोन कॉल पर बात करना चाहते हैं? अभी उपलब्ध सहायता एग्जीक्यूटिव को कॉल मिलाएं।",
    hinglish: "Live phone call par baat karni hai? Abhi available support executive desk ko ring karein.",
  },
  callExecutiveBtn: {
    en: "Call Executive Desk",
    hi: "एग्जीक्यूटिव डेस्क को कॉल करें",
    hinglish: "Executive Desk ko Call Karein",
  },
  recentGrievances: {
    en: "Recent Grievances",
    hi: "हाल की शिकायतें",
    hinglish: "Recent Grievances",
  },
  viewAll: {
    en: "View all",
    hi: "सभी देखें",
    hinglish: "Sabhi Dekhein",
  },
  noActiveComplaints: {
    en: "No active complaints on file.",
    hi: "कोई सक्रिय शिकायत दर्ज नहीं है।",
    hinglish: "Koi active complaint file nahi hai.",
  },

  // Chat Interface
  railCareAi: {
    en: "RailCare AI Assistant",
    hi: "रेलकेयर एआई सहायक",
    hinglish: "RailCare AI Assistant",
  },
  bilingualTag: {
    en: "Bilingual · Hindi, English & Hinglish",
    hi: "बहुभाषी · हिंदी, अंग्रेजी और हिंग्लिश",
    hinglish: "Multi-lingual · Hindi, English & Hinglish",
  },
  executive: {
    en: "Executive",
    hi: "एग्जीक्यूटिव",
    hinglish: "Executive",
  },
  browseTopics: {
    en: "Browse Topics",
    hi: "विषय ब्राउज़ करें",
    hinglish: "Browse Topics",
  },
  topics: {
    en: "Topics",
    hi: "विषय",
    hinglish: "Topics",
  },
  clickTopicHint: {
    en: "Click a topic to view questions in chat",
    hi: "चैट में प्रश्न देखने के लिए विषय चुनें",
    hinglish: "Chat mein questions dekhne ke liye topic select karein",
  },
  tapTopicHint: {
    en: "Tap any topic to see predefined questions in chat",
    hi: "चैट में प्रश्न देखने के लिए विषय पर टैप करें",
    hinglish: "Chat mein questions dekhne ke liye topic par tap karein",
  },
  selectTopicStrip: {
    en: "Select a topic on the left or type your query below",
    hi: "बाईं ओर से विषय चुनें या नीचे अपना प्रश्न लिखें",
    hinglish: "Left side se topic chunein ya neeche question type karein",
  },
  tapTopicStrip: {
    en: "Tap a topic above or type below",
    hi: "ऊपर विषय चुनें या नीचे टाइप करें",
    hinglish: "Upar topic chunein ya neeche type karein",
  },
  speakToExecutive: {
    en: "Speak to Executive",
    hi: "एग्जीक्यूटिव से बात करें",
    hinglish: "Executive se Baat Karein",
  },
  welcomeAboard: {
    en: "Welcome aboard",
    hi: "शुभ यात्रा",
    hinglish: "Welcome aboard",
  },
  namaste: {
    en: "Namaste",
    hi: "नमस्ते",
    hinglish: "Namaste",
  },
  howCanWeHelp: {
    en: "How can we help with your journey today?",
    hi: "आज हम आपकी यात्रा में क्या सहायता कर सकते हैं?",
    hinglish: "Aaj hum aapki journey mein kaise help kar sakte hain?",
  },
  train: {
    en: "Train",
    hi: "ट्रेन",
    hinglish: "Train",
  },
  pnr: {
    en: "PNR",
    hi: "पीएनआर",
    hinglish: "PNR",
  },
  coach: {
    en: "Coach",
    hi: "कोच",
    hinglish: "Coach",
  },
  berth: {
    en: "Berth / Seat",
    hi: "बर्थ / सीट",
    hinglish: "Berth / Seat",
  },
  noBooking: {
    en: "No active booking found. You can still ask us anything!",
    hi: "कोई सक्रिय बुकिंग नहीं मिली। आप फिर भी कोई भी सवाल पूछ सकते हैं!",
    hinglish: "Koi active booking nahi mili. Aap fir bhi kuch bhi pooch sakte hain!",
  },
  questionsAvailable: {
    en: "predefined questions available",
    hi: "पूर्व-निर्धारित प्रश्न उपलब्ध हैं",
    hinglish: "predefined questions available hain",
  },
  clear: {
    en: "Clear",
    hi: "हटाएं",
    hinglish: "Clear Karein",
  },
  clickPredefinedPrompt: {
    en: "Click on any predefined question below and I'll assist you immediately:",
    hi: "नीचे दिए गए किसी भी प्रश्न पर क्लिक करें और मैं तुरंत आपकी सहायता करूँगा:",
    hinglish: "Neeche diye gaye kisi bhi question par click karein, main turant help karunga:",
  },
  typeQueryPlaceholder: {
    en: "Type question in Hindi, English, Hinglish…",
    hi: "हिंदी, अंग्रेजी या हिंग्लिश में प्रश्न लिखें…",
    hinglish: "Hindi, English ya Hinglish mein question type karein…",
  },
  send: {
    en: "Send",
    hi: "भेजें",
    hinglish: "Send",
  },
  speak: {
    en: "Speak",
    hi: "बोलें",
    hinglish: "Bolein",
  },
  listening: {
    en: "Listening…",
    hi: "सुन रहे हैं…",
    hinglish: "Sun rahe hain…",
  },
  thinking: {
    en: "Analyzing inquiry & railway guidelines…",
    hi: "पूछताछ और रेलवे दिशानिर्देशों का विश्लेषण हो रहा है…",
    hinglish: "Inquiry aur railway guidelines analyze ho rahi hain…",
  },
  speaking: {
    en: "Speaking response…",
    hi: "उत्तर बोला जा रहा है…",
    hinglish: "Response bola ja raha hai…",
  },
  welcomeScreen: {
    en: "Welcome Screen",
    hi: "स्वागत स्क्रीन",
    hinglish: "Welcome Screen",
  },
  suggestedFollowUps: {
    en: "Suggested Follow-ups:",
    hi: "सुझाए गए प्रश्न:",
    hinglish: "Suggested Follow-ups:",
  },
  callExecutiveDesk: {
    en: "Call Executive",
    hi: "एग्जीक्यूटिव को कॉल करें",
    hinglish: "Executive ko Call Karein",
  },
  endChat: {
    en: "End Chat",
    hi: "चैट समाप्त करें",
    hinglish: "Chat End Karein",
  },
  aiReady: {
    en: "Ready",
    hi: "तैयार",
    hinglish: "Ready",
  },
  aiReadyGuidance: {
    en: "Please select a topic from the Browse Topics menu to view questions, or type your query in the box below to ask anything about your journey.",
    hi: "कृपया प्रश्न देखने के लिए 'विषय ब्राउज़ करें' मेनू से एक विषय चुनें, या अपनी यात्रा के बारे में कुछ भी पूछने के लिए नीचे बॉक्स में टाइप करें।",
    hinglish: "Questions dekhne ke liye Browse Topics menu se topic select karein, ya apni journey ke baare mein kuch bhi poochne ke liye neeche type karein.",
  },
  topicsInclude: {
    en: "Topics include Coach & Safety, Linen, Catering, Payments & more",
    hi: "विषयों में कोच और सुरक्षा, लिनन, खानपान, भुगतान आदि शामिल हैं",
    hinglish: "Topics mein Coach & Safety, Linen, Catering, Payments aur baaki cheezein shaamil hain",
  },
  clickLeftGuidance: {
    en: "👈 Click any topic on the left to view questions",
    hi: "👈 प्रश्न देखने के लिए बाईं ओर किसी भी विषय पर क्लिक करें",
    hinglish: "👈 Questions dekhne ke liye left side kisi bhi topic par click karein",
  },
  tapAboveGuidance: {
    en: "👆 Tap any topic above to view questions",
    hi: "👆 प्रश्न देखने के लिए ऊपर किसी भी विषय पर टैप करें",
    hinglish: "👆 Questions dekhne ke liye upar kisi bhi topic par tap karein",
  },
  noQuestionsTopic: {
    en: "No predefined questions found for this topic. You can type your query in the box below!",
    hi: "इस विषय के लिए कोई पूर्व-निर्धारित प्रश्न नहीं मिले। आप नीचे दिए गए बॉक्स में अपना प्रश्न टाइप कर सकते हैं!",
    hinglish: "Is topic ke liye koi predefined questions nahi mile. Aap neeche box mein type kar sakte hain!",
  },

  // Subviews
  passengerCareServices: {
    en: "Passenger Care Services",
    hi: "यात्री सेवा केंद्र",
    hinglish: "Passenger Care Services",
  },
  reportJourneyGrievance: {
    en: "Report Journey Grievance",
    hi: "यात्रा शिकायत दर्ज करें",
    hinglish: "Journey Grievance Report Karein",
  },
  reportJourneyGrievanceDesc: {
    en: "File an immediate complaint regarding coach linen, hygiene, or coach attendant support.",
    hi: "कोच लिनन, स्वच्छता, या कोच अटेंडेंट सहायता के संबंध में तत्काल शिकायत दर्ज करें।",
    hinglish: "Coach linen, hygiene ya coach attendant support ke regarding immediate complaint file karein.",
  },
  selectBooking: {
    en: "Select Journey Booking:",
    hi: "यात्रा बुकिंग चुनें:",
    hinglish: "Journey Booking Select Karein:",
  },
  chooseJourney: {
    en: "-- Choose your journey --",
    hi: "-- अपनी यात्रा चुनें --",
    hinglish: "-- Apni journey select karein --",
  },
  grievanceCategory: {
    en: "Grievance Category:",
    hi: "शिकायत श्रेणी:",
    hinglish: "Grievance Category:",
  },
  description: {
    en: "Detailed Description (Optional):",
    hi: "विस्तृत विवरण (वैकल्पिक):",
    hinglish: "Detailed Description (Optional):",
  },
  submitGrievance: {
    en: "Submit Formal Grievance",
    hi: "औपचारिक शिकायत दर्ज करें",
    hinglish: "Formal Grievance Submit Karein",
  },
  submittingGrievance: {
    en: "Submitting to Attendant & Executive…",
    hi: "अटेंडेंट व एग्जीक्यूटिव को भेजा जा रहा है…",
    hinglish: "Attendant aur Executive ko submit ho raha hai…",
  },
  cancel: {
    en: "Cancel",
    hi: "रद्द करें",
    hinglish: "Cancel",
  },
  generalSupportQueryTitle: {
    en: "IRCTC General Support Query",
    hi: "आईआरसीटीसी सामान्य सहायता प्रश्न",
    hinglish: "IRCTC General Support Query",
  },
  generalSupportQuerySubtitle: {
    en: "Submit inquiries about payment deductions, refund progress, or mobile app issues.",
    hi: "भुगतान कटौती, रिफंड प्रगति, या मोबाइल ऐप समस्याओं के बारे में पूछताछ दर्ज करें।",
    hinglish: "Payment deductions, refund progress ya mobile app issues ke baare mein query submit karein.",
  },
  concernCategory: {
    en: "Concern Category:",
    hi: "समस्या श्रेणी:",
    hinglish: "Concern Category:",
  },
  chooseCategory: {
    en: "-- Choose Category --",
    hi: "-- श्रेणी चुनें --",
    hinglish: "-- Category Select Karein --",
  },
  subCategory: {
    en: "Sub-Category:",
    hi: "उप-श्रेणी:",
    hinglish: "Sub-Category:",
  },
  chooseSubCategory: {
    en: "-- Choose Sub-category --",
    hi: "-- उप-श्रेणी चुनें --",
    hinglish: "-- Sub-category Select Karein --",
  },
  querySpecifics: {
    en: "Query Specifics:",
    hi: "प्रश्न का विवरण:",
    hinglish: "Query Specifics:",
  },
  submitSupportTicket: {
    en: "Submit Support Ticket",
    hi: "सपोर्ट टिकट दर्ज करें",
    hinglish: "Support Ticket Submit Karein",
  },
  yourJourneyBookings: {
    en: "Your Journey Bookings",
    hi: "आपकी यात्रा बुकिंग",
    hinglish: "Aapki Journey Bookings",
  },
  allFiledGrievances: {
    en: "All Filed Grievances & Complaints",
    hi: "सभी दर्ज शिकायतें",
    hinglish: "Sabhi Filed Grievances & Complaints",
  },
  aiChatHistory: {
    en: "AI Chat & Audio Inquiry History",
    hi: "एआई चैट एवं पूछताछ इतिहास",
    hinglish: "AI Chat aur Inquiry History",
  },
  queryConcernStatus: {
    en: "Query & Concern Status Tracker",
    hi: "शिकायत स्थिति ट्रैकर",
    hinglish: "Query Status Tracker",
  },

  // Call & WhatsApp Modal
  endToEndEncrypted: {
    en: "End-to-end encrypted",
    hi: "शुरू से अंत तक एन्क्रिप्टेड",
    hinglish: "End-to-end encrypted",
  },
  voiceCall: {
    en: "IRCTC Voice",
    hi: "आईआरसीटीसी वॉइस",
    hinglish: "IRCTC Voice",
  },
  emergencySosDesk: {
    en: "Emergency SOS Desk",
    hi: "आपातकालीन एसओएस डेस्क",
    hinglish: "Emergency SOS Desk",
  },
  irctcSupport: {
    en: "IRCTC Railway Support",
    hi: "आईआरसीटीसी रेलवे सहायता",
    hinglish: "IRCTC Railway Support",
  },
  tapToReturn: {
    en: "Tap to return to call",
    hi: "कॉल पर लौटने के लिए टैप करें",
    hinglish: "Call par return karne ke liye tap karein",
  },
  mute: {
    en: "Mute",
    hi: "म्यूट",
    hinglish: "Mute",
  },
  unmute: {
    en: "Unmute",
    hi: "अनम्यूट",
    hinglish: "Unmute",
  },
  end: {
    en: "End",
    hi: "समाप्त",
    hinglish: "End",
  },
  ringing: {
    en: "Ringing…",
    hi: "घंटी बज रही है…",
    hinglish: "Ringing…",
  },
  queue: {
    en: "Queue",
    hi: "कतार",
    hinglish: "Queue",
  },
  callEnded: {
    en: "Call Ended",
    hi: "कॉल समाप्त",
    hinglish: "Call Ended",
  },
  rateCall: {
    en: "Rate your call assistance",
    hi: "कॉल सहायता का मूल्यांकन करें",
    hinglish: "Apni call assistance ko rate karein",
  },
  irctcSmartSystem: {
    en: "Smart Linen & Grievance Management System",
    hi: "स्मार्ट लिनन एवं शिकायत प्रबंधन प्रणाली",
    hinglish: "Smart Linen & Grievance Management System",
  },
  poweredBy: {
    en: "Powered by",
    hi: "संचालित",
    hinglish: "Powered by",
  },
  myBookings: {
    en: "My Bookings",
    hi: "मेरी बुकिंग",
    hinglish: "Meri Bookings",
  },
  activeJourneysFound: {
    en: "No active journeys found.",
    hi: "कोई सक्रिय यात्रा नहीं मिली।",
    hinglish: "Koi active journey nahi mili.",
  },
  noJourneysOnRecord: {
    en: "No journeys on record.",
    hi: "कोई यात्रा रिकॉर्ड में नहीं है।",
    hinglish: "Record mein koi journey nahi hai.",
  },
  allBookedJourneys: {
    en: "All Booked Journeys",
    hi: "सभी बुक की गई यात्राएं",
    hinglish: "Sabhi Booked Journeys",
  },
  allBookedJourneysDesc: {
    en: "Review ticket details, coach numbers, berths, and past trips.",
    hi: "टिकट विवरण, कोच संख्या, बर्थ और पिछली यात्राओं की समीक्षा करें।",
    hinglish: "Ticket details, coach numbers, berths aur purani trips review karein.",
  },
  filedOn: {
    en: "Filed on",
    hi: "दर्ज की गई",
    hinglish: "Filed on",
  },
  reference: {
    en: "Reference",
    hi: "संदर्भ",
    hinglish: "Reference",
  },
  noComplaintsYet: {
    en: "No complaints filed yet.",
    hi: "अभी तक कोई शिकायत दर्ज नहीं की गई है।",
    hinglish: "Abhi tak koi complaint file nahi hui.",
  },
  grievancesComplaintsFiled: {
    en: "Grievances & Complaints Filed",
    hi: "दर्ज शिकायतें एवं समस्याएं",
    hinglish: "Grievances & Complaints Filed",
  },
  grievancesComplaintsFiledDesc: {
    en: "Track real-time resolution status across Coach Attendants, Supervisors, and Divisional Officers.",
    hi: "कोच अटेंडेंट, सुपरवाइजर और मंडल अधिकारियों के समाधान की लाइव स्थिति ट्रैक करें।",
    hinglish: "Coach Attendants, Supervisors aur Officers ke resolution status ko track karein.",
  },
  aiHelplineCallHistory: {
    en: "AI & Helpline Call History",
    hi: "एआई एवं हेल्पलाइन कॉल इतिहास",
    hinglish: "AI & Helpline Call History",
  },
  aiHelplineCallHistoryDesc: {
    en: "Previous voice and chat conversations resolved with ratings.",
    hi: "पिछली आवाज़ और चैट बातचीत रेटिंग के साथ।",
    hinglish: "Purani voice aur chat conversations ratings ke saath.",
  },
  noPastQueries: {
    en: "No past queries logged.",
    hi: "कोई पिछली पूछताछ दर्ज नहीं है।",
    hinglish: "Koi past query logged nahi hai.",
  },
  trackedQueriesConcerns: {
    en: "Tracked Queries & Concerns",
    hi: "ट्रैक किए गए प्रश्न और चिंताएं",
    hinglish: "Tracked Queries & Concerns",
  },
  trackedQueriesConcernsDesc: {
    en: "Review status of logged eQueries and formal support concerns.",
    hi: "दर्ज किए गए ई-प्रश्नों और औपचारिक सहायता चिंताओं की समीक्षा करें।",
    hinglish: "Logged eQueries aur support concerns ka status check karein.",
  },
  noGeneralQueries: {
    en: "No general queries recorded. Use \"General Query\" to log one.",
    hi: "कोई सामान्य प्रश्न दर्ज नहीं है। दर्ज करने के लिए \"सामान्य सहायता प्रश्न\" का उपयोग करें।",
    hinglish: "Koi general query recorded nahi hai. Log karne ke liye \"General Query\" use karein.",
  },
  backToHelpSupport: {
    en: "Back to Help & Support",
    hi: "सहायता और समर्थन पर वापस जाएं",
    hinglish: "Help & Support par wapas jayein",
  },
  trackExistingQueries: {
    en: "Track Existing Queries",
    hi: "मौजूदा प्रश्नों को ट्रैक करें",
    hinglish: "Existing Queries Track Karein",
  },
  trackExistingQueriesDesc: {
    en: "Check real-time progress of your Concern IDs and supervisor escalation steps.",
    hi: "अपनी समस्या आईडी की लाइव प्रगति और सुपरवाइजर तक पहुंचने की स्थिति जांचें।",
    hinglish: "Apne Concern IDs ki real-time progress aur escalation steps check karein.",
  },
  trackStatus: {
    en: "Track Status",
    hi: "स्थिति ट्रैक करें",
    hinglish: "Status Track Karein",
  },
  emergencySosCall: {
    en: "Emergency SOS Call",
    hi: "आपातकालीन एसओएस कॉल",
    hinglish: "Emergency SOS Call",
  },
  emergencySosCallDesc: {
    en: "Urgent medical need, harassment, or theft? Bypasses AI queues to dial shift supervisors directly.",
    hi: "तत्काल चिकित्सा सहायता, छेड़छाड़ या चोरी? सीधे शिफ्ट सुपरवाइजर को कॉल करें।",
    hinglish: "Urgent medical need, harassment ya chori? Direct shift supervisor ko dial karein.",
  },
  triggerImmediateSos: {
    en: "Trigger Immediate SOS",
    hi: "तुरंत एसओएस शुरू करें",
    hinglish: "Immediate SOS Trigger Karein",
  },
  callDisconnected: {
    en: "Call Disconnected",
    hi: "कॉल कट गई",
    hinglish: "Call Disconnected",
  },
  emergencyOperationsDesk: {
    en: "Emergency Operations Desk",
    hi: "आपातकालीन संचालन डेस्क",
    hinglish: "Emergency Operations Desk",
  },
  railwaySupportExecutive: {
    en: "Railway Support Executive",
    hi: "रेलवे सहायता एग्जीक्यूटिव",
    hinglish: "Railway Support Executive",
  },
  officialHelpdesk247: {
    en: "Indian Railways · 24x7 Official Helpdesk",
    hi: "भारतीय रेल · 24x7 आधिकारिक हेल्पलाइन",
    hinglish: "Indian Railways · 24x7 Official Helpdesk",
  },
  allLinesBusy: {
    en: "All lines busy",
    hi: "सभी लाइनें व्यस्त हैं",
    hinglish: "Sabhi lines busy hain",
  },
  estWait: {
    en: "Est. wait",
    hi: "अनुमानित प्रतीक्षा",
    hinglish: "Est. wait",
  },
  stayOnLine: {
    en: "Please stay on line",
    hi: "कृपया लाइन पर बने रहें",
    hinglish: "Kripya line par bane rahein",
  },
  speaker: {
    en: "Speaker",
    hi: "स्पीकर",
    hinglish: "Speaker",
  },
  speakerOn: {
    en: "Speaker On",
    hi: "स्पीकर चालू",
    hinglish: "Speaker On",
  },
  speakerOff: {
    en: "Speaker Off",
    hi: "स्पीकर बंद",
    hinglish: "Speaker Off",
  },
  dismissBackToChat: {
    en: "Dismiss / Back to Chat",
    hi: "बंद करें / चैट पर वापस",
    hinglish: "Dismiss / Chat par Wapas",
  },
  done: {
    en: "Done",
    hi: "पूर्ण",
    hinglish: "Done",
  },
  thankYouRating: {
    en: "Thank you for your rating!",
    hi: "मूल्यांकन के लिए धन्यवाद!",
    hinglish: "Rating ke liye Dhanyawaad!",
  },
  receiveWaAlerts: {
    en: "Receive Real-Time Complaint & Linen Alerts on WhatsApp",
    hi: "व्हाट्सएप पर शिकायत एवं लिनन के लाइव अपडेट पाएं",
    hinglish: "WhatsApp par Complaint aur Linen ke Real-Time Alerts paayein",
  },
  waInstruction: {
    en: "To enable automated WhatsApp notifications, send",
    hi: "स्वचालित व्हाट्सएप सूचनाएं प्राप्त करने के लिए, भेजें",
    hinglish: "Automated WhatsApp notifications paane ke liye, bhejein",
  },
  toOnce: {
    en: "once.",
    hi: "एक बार।",
    hinglish: "ek baar.",
  },
  openWaConnect: {
    en: "Open WhatsApp & Connect",
    hi: "व्हाट्सएप खोलें और कनेक्ट करें",
    hinglish: "WhatsApp Kholein aur Connect Karein",
  },
  dismiss: {
    en: "Dismiss",
    hi: "हटाएं",
    hinglish: "Dismiss",
  },
  irctcId: {
    en: "IRCTC ID",
    hi: "आईआरसीटीसी आईडी",
    hinglish: "IRCTC ID",
  },
  generalInquiry: {
    en: "General Inquiry",
    hi: "सामान्य पूछताछ",
    hinglish: "General Inquiry",
  },
  registeringQuery: {
    en: "Registering Query…",
    hi: "प्रश्न दर्ज किया जा रहा है…",
    hinglish: "Query register ho rahi hai…",
  },
  submitSupportQuery: {
    en: "Submit Support Query",
    hi: "सहायता प्रश्न सबमिट करें",
    hinglish: "Support Query Submit Karein",
  },
  verifiedRailwayOfficial: {
    en: "Verified Railway Official",
    hi: "सत्यापित रेलवे अधिकारी",
    hinglish: "Verified Railway Official",
  },
};

const STORAGE_KEY = "srlms_language";

export function useLanguage() {
  const [lang, setLangState] = useState(() => localStorage.getItem(STORAGE_KEY) || "en");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((code) => setLangState(code), []);

  const t = useCallback(
    (key, fallback) => {
      if (DICTIONARY[key]?.[lang]) return DICTIONARY[key][lang];
      if (DICTIONARY[key]?.en) return DICTIONARY[key].en;
      return fallback !== undefined ? fallback : key;
    },
    [lang]
  );

  const tCat = useCallback(
    (catName) => {
      if (CATEGORY_TRANSLATIONS[catName]?.[lang]) return CATEGORY_TRANSLATIONS[catName][lang];
      return catName;
    },
    [lang]
  );

  return { lang, setLang, t, tCat };
}

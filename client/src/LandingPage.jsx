import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Train, User, ShieldCheck, Headphones, MessageCircle, Phone, AlertCircle, 
  CreditCard, MapPin, Heart, AlertTriangle, Globe, ChevronDown, MessageSquare,
  Users, Settings, Siren, Mail, Star, Languages, Shuffle
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
function StarRow({ count = 5, className = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-0.5 text-[#F5A623]">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={className} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

/**
 * Passenger-centric landing page with:
 * - Hero section (train imagery + value prop)
 * - How AI helps (3 simple steps)
 * - 6 Key features for passengers
 * - Support team visualization
 * - Real scenarios & examples
 * - 24/7 availability & SOS
 * - Language support
 * - Social proof
 * - Clear CTAs
 */
export default function LandingPage() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const features = [
    {
      icon: MessageCircle,
      title: "Talk to AI",
      description: "Ask anything about your train, booking, luggage. Get answers in seconds.",
      color: "text-[#003DA5]",
    },
    {
      icon: Phone,
      title: "Call Real Staff",
      description: "Need help? Instantly connect to a helpful support executive.",
      color: "text-green-400",
    },
    {
      icon: AlertCircle,
      title: "Report Issues",
      description: "Missing blankets, damaged seats? Report and we track it for you.",
      color: "text-yellow-400",
    },
    {
      icon: AlertTriangle,
      title: "Emergency SOS",
      description: "Press once for immediate help. Alert sent to all staff instantly.",
      color: "text-red-400",
    },
    {
      icon: CreditCard,
      title: "Pay Fines Easy",
      description: "Scan QR or pay online in seconds. No hassle. Safe & secure.",
      color: "text-purple-400",
    },
    {
      icon: MapPin,
      title: "Track Your Items",
      description: "Know exactly where your linen items are using RFID tracking.",
      color: "text-orange-400",
    },
  ];

  const scenarios = [
    {
      title: "Missing Blanket?",
      icon: "railway_blankets.jfif",
      steps: ["Say: 'Mere kambal nahi mila'", "AI checks immediately", "Answer in Hindi/English", "Fixed in 30 seconds!"],
    },
    {
      title: "Need Real Help?",
      icon: null,
      steps: ["AI listens to your request", "Can't solve it? Calls real staff", "Direct conversation", "Done in 2 minutes!"],
    },
    {
      title: "In Danger?",
      icon: null,
      steps: ["Tap SOS Button", "Alert to supervisors & staff", "Email notification sent", "Help arrives instantly!"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFB] to-[#FFFFFF] text-[#1F2937]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-[#0B4EA2] border-b border-[#083B7C] px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Rail Care" className="w-11 h-11 rounded-full object-cover" />
            <span className="text-lg font-bold text-white">Rail Care</span>
            <span className="text-xs text-blue-100 ml-2">Railway Companion</span>
          </div>
          <div className="flex gap-2">
            <a href="#/passenger" className="text-xs px-3 py-1.5 rounded border border-white/70 hover:bg-white/15 text-white transition">
              Login
            </a>
            <a href="#/passenger" className="text-xs px-3 py-1.5 rounded bg-white hover:bg-blue-50 text-[#0B4EA2] font-semibold transition">
              Sign Up
            </a>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden py-12 px-6">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#003DA5] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-[#1F2937]">
                  Travel <span className="bg-gradient-to-r from-[#003DA5] to-[#FF6B35] bg-clip-text text-transparent">Worry-Free</span>
                </h1>
                <p className="text-lg text-[#6B7280]">
                  Get instant help, anytime, anywhere on your railway journey. Talk to our AI or a real person.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <a href="#/passenger" className="px-8 py-3 bg-[#003DA5] hover:bg-[#002D7A] rounded-lg font-semibold text-white transition transform hover:scale-105">
                  Sign Up for Passengers
                </a>
              </div>
            </div>

            {/* Right: Passenger Image */}
            <div className="relative">
              <div className="rounded-lg overflow-hidden border border-[#E5E7EB] shadow-2xl">
                <img 
                  src="/passenger_photo.webp" 
                  alt="Railway Passenger"
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white border border-[#E5E7EB] rounded-lg p-4 max-w-xs shadow-lg">
                <div className="flex items-center gap-2 text-[#FF6B35] text-sm font-semibold">
                  <Heart className="w-4 h-4 fill-current" />
                  Trusted by Railway Passengers
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <StarRow count={5} className="w-3 h-3" />
                  <p className="text-xs text-[#6B7280]">4.8/5 - "Best Service Provided By Indian Railways"</p>
                </div>
                <p className="text-xs text-[#003DA5] font-semibold mt-2">— Abizer Saifee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US - 4 CARDS ===== */}
      <section className="py-16 px-6 bg-[#F3F5F7]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1F2937]">Why Our Passengers Love Us</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "twenty-four-service_1017-30335.avif", title: "24/7 Available", desc: "Always there when you need help" },
              { icon: "instant answer.png", title: "Instant Answers", desc: "AI responds in seconds" },
              { icon: "staff_iconm.jfif", title: "Real People Too", desc: "Connect with staff when you need them" },
              { icon: null, title: "Emergency SOS", desc: "Instant alert for urgent situations" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -4 }}
                className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:border-[#003DA5]/50 hover:shadow-cardHover transition text-center"
              >
                <div className="mb-3">
                  {item.icon ? (
                    <img src={`/${item.icon}`} alt={item.title} className="w-16 h-16 mx-auto object-contain" />
                  ) : (
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                      <Siren className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-base mb-2 text-[#1F2937]">{item.title}</h3>
                <p className="text-sm text-[#6B7280]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS - 3 SIMPLE STEPS ===== */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1F2937]">How We Help You in 3 Steps</h2>

          <div className="grid md:grid-cols-3 gap-8 relative items-stretch">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-1/3 left-0 right-0 h-1 bg-gradient-to-r from-[#003DA5] via-[#FF6B35] to-transparent -z-10"></div>

            {[
              { step: 1, icon: null, title: "Tell Us", desc: "Speak or type your problem in English or Hindi" },
              { step: 2, icon: "chatbot.png", title: "We Listen", desc: "AI analyzes and finds the best answer" },
              { step: 3, icon: "tick_mark.png", title: "Problem Solved", desc: "Get help in seconds or talk to a real person" },
            ].map((item, idx) => (
              <div key={idx} className="relative flex">
                <div className="flex h-full min-h-[216px] w-full flex-col items-center bg-white border border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#003DA5]/30 transition">
                  <div className="mb-4 flex h-20 items-center justify-center">
                    {idx === 0 ? (
                      <MessageSquare className="w-16 h-16 text-[#003DA5]" aria-hidden="true" />
                    ) : (
                      <img src={`/${item.icon}`} alt="Step icon" className="w-20 h-20 mx-auto object-contain" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Step {item.step}: {item.title}</h3>
                  <p className="text-sm text-[#6B7280]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-[#003DA5]/10 to-[#FF6B35]/10 border border-[#003DA5]/20 rounded-lg p-8 text-center">
            <p className="text-lg font-semibold mb-2 text-[#1F2937] flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-[#003DA5]" /> Can't Find Answer? No Problem!
            </p>
            <p className="text-[#6B7280]">AI will instantly connect you to a real support executive for direct conversation. Average wait: 2 minutes.</p>
          </div>
        </div>
      </section>

      {/* ===== PASSENGER FEATURES GRID ===== */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Can Do</h2>
          <p className="text-center text-[#6B7280] mb-12 max-w-2xl mx-auto">
            Our platform is built for passengers. Here's what you can do instantly, 24/7.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <div key={idx} className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:border-[#003DA5]/50 transition group">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-white ${feature.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-1 uppercase text-sm group-hover:text-[#003DA5] transition text-[#1F2937]">{feature.title}</h3>
                      <p className="text-sm text-[#6B7280]">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== YOUR SUPPORT TEAM ===== */}
      <section className="py-16 px-6 bg-[#F3F5F7]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1F2937]">Your Support Team Works 24/7</h2>

          <div className="grid md:grid-cols-4 gap-6 mb-8 items-stretch">
            {[
              { icon: "chatbot.png", role: "AI Assistant", desc: "Instant answers 24/7", color: "from-[#003DA5] to-[#0052CC]" },
              { icon: "staff_iconm.jfif", role: "Executive", desc: "Friendly staff ready to help", color: "from-[#059669] to-[#047857]" },
              { icon: "staff_iconm.jfif", role: "Supervisor", desc: "Ensures quality service", color: "from-[#7C3AED] to-[#6D28D9]" },
              { icon: null, role: "Admin", desc: "System keeps working smooth", color: "from-[#FF6B35] to-[#E55100]" },
            ].map((team, idx) => (
              <div key={idx} className={`flex min-h-[176px] h-full flex-col items-center justify-center bg-gradient-to-br ${team.color} rounded-lg p-6 text-white text-center`}>
                <div className="mb-3 flex h-16 items-center justify-center">
                  {idx === 3 ? (
                    <Settings className="w-14 h-14 text-white" aria-hidden="true" />
                  ) : (
                    <img src={`/${team.icon}`} alt={team.role} className="w-16 h-16 mx-auto object-contain mix-blend-multiply" />
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1 text-white">{team.role}</h3>
                <p className="text-sm opacity-90 text-white">{team.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center">
            <p className="text-lg text-[#1F2937]">All connected. All working together. <span className="text-[#FF6B35] font-bold">Just for you.</span></p>
          </div>
        </div>
      </section>

      {/* ===== REAL SCENARIOS ===== */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1F2937]">See How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {scenarios.map((scenario, idx) => (
              <div key={idx} className="flex h-full flex-col bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#003DA5]/50 transition">
                <div className="flex min-h-[164px] flex-col items-center justify-center bg-gradient-to-r from-[#003DA5] to-[#FF6B35] p-6 text-center">
                  <div className="flex h-20 items-center justify-center">
                    {idx === 0 ? (
                      <img src={`/${scenario.icon}`} alt={scenario.title} className="w-20 h-20 mx-auto object-contain" />
                    ) : (
                      idx === 1 ? <Users className="w-14 h-14 text-white" aria-hidden="true" /> : <Siren className="w-14 h-14 text-white" aria-hidden="true" />
                    )}
                  </div>
                  <h3 className="text-white font-bold mt-2 text-lg">{["Missing Blanket?", "Need Real Help?", "In Danger?"][idx]}</h3>
                </div>
                <div className="flex-1 p-6 space-y-3">
                  {scenario.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex gap-3 text-sm">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#003DA5] text-white text-xs font-bold flex-shrink-0">
                        {stepIdx + 1}
                      </span>
                      <span className="text-[#6B7280] pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EMERGENCY SOS ===== */}
      <section className="py-16 px-6 bg-gradient-to-r from-red-50 to-orange-50 border-y border-red-200">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-2 border-red-400 rounded-lg p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <Siren className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-red-600">Emergency SOS Button</h2>
            <p className="text-[#6B7280] mb-6 max-w-2xl mx-auto">
              Feel unsafe? Problem? Harassment? Press the SOS button once and help arrives immediately.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Mail, label: "Alert email to supervisor" },
                { icon: Phone, label: "Staff calls you immediately" },
                { icon: Siren, label: "Priority help (not queue)" },
              ].map((item, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded p-4 text-sm font-semibold text-red-700 flex items-center justify-center gap-2">
                  <item.icon className="w-4 h-4 shrink-0" /> {item.label}
                </div>
              ))}
            </div>
            <p className="text-red-600 font-bold">Your safety is our first priority.</p>
          </div>
        </div>
      </section>

      {/* ===== 24/7 & LANGUAGE ===== */}
      <section className="py-16 px-6 bg-[#F3F5F7]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* 24/7 */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#003DA5]/30 transition">
              <div className="mb-4">
                <img src="/twenty-four-service_1017-30335.avif" alt="24/7 Service" className="w-20 h-20 mx-auto object-contain" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Always Available</h3>
              <p className="text-[#6B7280] mb-6">
                Midnight or noon, we're always here. No waiting lists, no office hours.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#003DA5] rounded-full"></span>
                  <span className="text-[#4B5563]">AI answers in seconds</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#003DA5] rounded-full"></span>
                  <span className="text-[#4B5563]">Real staff available quickly</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#003DA5] rounded-full"></span>
                  <span className="text-[#4B5563]">Emergency help instantly</span>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#FF6B35]/30 transition">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                <Languages className="w-8 h-8 text-[#FF6B35]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Speak Your Language</h3>
              <p className="text-[#6B7280] mb-6">
                English, हिंदी, or mixed? AI understands everything.
              </p>
              <div className="space-y-3">
                <div className="bg-[#F3F5F7] rounded p-3 text-sm flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[#003DA5] font-bold">English</span> | <span className="text-[#FF6B35] font-bold">हिंदी</span> | <span className="text-[#059669] font-bold inline-flex items-center gap-1">Hinglish <Shuffle className="w-3.5 h-3.5" /></span>
                </div>
                <p className="text-[#6B7280] text-xs">AI responds in whatever language you prefer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1F2937]">Trusted by Railway Passengers</h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {[
              { text: '"Best Quality Support Provided"', author: "— Haidery Saad." },
              { text: '"Staff is incredibly helpful. Best support I\'ve had."', author: "— Murtaza Dhanerawala" },
              { text: '"Absolutely amazing service!"', author: "— Rizwan Khan" },
            ].map((review, idx) => (
              <motion.div key={idx} variants={fadeUp} className="bg-[#F3F5F7] border border-[#E5E7EB] rounded-lg p-6">
                <StarRow className="mb-3 w-4 h-4" />
                <p className="text-[#4B5563] mb-3 italic">{review.text}</p>
                <p className="text-sm font-semibold text-[#003DA5]">{review.author}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center">
            <p className="text-[#6B7280] mb-6">Backed by Indian Railways Ministry</p>
            <div className="flex items-center justify-center gap-8">
              <img 
                src="/logo_irctc.png" 
                alt="IRCTC"
                className="h-12 opacity-80 hover:opacity-100 transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#003DA5]/10 to-[#FF6B35]/10 border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[#1F2937]">Ready to Travel Worry-Free?</h2>
          <p className="text-lg text-[#6B7280] mb-8">Join thousands of happy passengers. It's free, takes 1 minute, and works instantly.</p>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <a href="#/passenger" className="px-8 py-4 bg-[#003DA5] hover:bg-[#002D7A] rounded-lg font-bold text-white transition transform hover:scale-105 text-lg">
              Sign Up Now
            </a>
            <a href="#/customer" className="px-8 py-4 border-2 border-[#003DA5] hover:bg-[#003DA5]/10 rounded-lg font-bold text-[#003DA5] transition text-lg">
              Try AI First
            </a>
          </div>

          <p className="text-[#6B7280]">No credit card needed • Free forever • Cancel anytime</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 px-6 bg-[#F3F5F7]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#1F2937]">Common Questions</h2>

          <div className="space-y-4">
            {[
              {
                q: "How quickly can I get help?",
                a: "AI responds in seconds. Real staff average 2-5 minutes. Emergency SOS gets help in 30 seconds.",
              },
              {
                q: "Can I use this without creating an account?",
                a: "Yes! Try the AI with our guest simulator. Account unlocks all features like booking lookup and fine payment.",
              },
              {
                q: "Will my personal data be safe?",
                a: "Absolutely. We use bank-level encryption and never share your data with third parties.",
              },
              {
                q: "What if I'm traveling without internet?",
                a: "You can call our PSTN helpline directly. SMS also works for basic queries.",
              },
              {
                q: "Is there a cost?",
                a: "Completely free! Voice help, AI chat, and support are all included.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#003DA5]/30 transition bg-white">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left font-semibold flex items-center justify-between hover:bg-[#F3F5F7] transition text-[#1F2937]"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 transition text-[#003DA5] ${expandedFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] text-[#6B7280]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#E5E7EB] px-6 py-12 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Train className="w-5 h-5 text-[#003DA5]" />
                <span className="font-bold text-[#1F2937]">Rail Care</span>
              </div>
              <p className="text-sm text-[#6B7280]">Making railway journeys smooth and worry-free.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#1F2937]">For Passengers</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li><a href="#/customer" className="hover:text-[#003DA5] transition">Try AI</a></li>
                <li><a href="#/passenger" className="hover:text-[#003DA5] transition">Check Booking</a></li>
                <li><a href="#/passenger" className="hover:text-[#003DA5] transition">Report Issue</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#1F2937]">Company</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li><a href="#" className="hover:text-[#003DA5] transition">About Us</a></li>
                <li><a href="#" className="hover:text-[#003DA5] transition">Contact</a></li>
                <li><a href="#" className="hover:text-[#003DA5] transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#1F2937]">Legal</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li><a href="#" className="hover:text-[#003DA5] transition">Privacy</a></li>
                <li><a href="#" className="hover:text-[#003DA5] transition">Terms</a></li>
                <li><a href="#" className="hover:text-[#003DA5] transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E5E7EB] pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-[#6B7280]">© 2026 Rail Care. All rights reserved. Supported by Indian Railways.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-[#6B7280] hover:text-[#003DA5] transition">f</a>
              <a href="#" className="text-[#6B7280] hover:text-[#003DA5] transition">𝕏</a>
              <a href="#" className="text-[#6B7280] hover:text-[#003DA5] transition">in</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

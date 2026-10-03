"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FileText, BrainCircuit, HardHat, CheckCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  //Mock recent grievance data
  const recent = [
    {
      id: 1,
      title: "Road Damage Fixed in Lucknow",
      desc: "Potholes repaired and drainage restored in Alambagh area within 2 days after citizen complaint.",
      img: "/lucknow-mock.jpg",
    },
    {
      id: 2,
      title: "Water Supply Restored in Kanpur",
      desc: "Community handpump and supply lines repaired, ensuring clean water access for families.",
      img: "/kanpur-mock.jpg",
    },
    {
      id: 3,
      title: "Hospital Grievance Resolved in Varanasi",
      desc: "Healthcare services improved through citizen feedback and prompt admin response.",
      img: "/varanasi-mock.jpg",
    },
  ];

  const steps = [
    { icon: <FileText size={32} className="text-blue-500" />, title: "1. Submit Issue", desc: "Citizen logs in and submits a grievance with location details." },
    { icon: <BrainCircuit size={32} className="text-purple-500" />, title: "2. AI Analysis", desc: "Our Gemini AI analyzes, prioritizes, and suggests solutions instantly." },
    { icon: <HardHat size={32} className="text-orange-500" />, title: "3. Auto-Assignment", desc: "The system matches and assigns the nearest skilled field worker." },
    { icon: <CheckCircle size={32} className="text-green-500" />, title: "4. Resolution", desc: "Field Worker resolves the issue and updates the status in real-time." },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] text-gray-800 dark:text-white font-sans selection:bg-blue-500/30">

      {/* HERO SECTION */}
      <section className="relative h-[calc(100vh-60px)] flex items-center justify-center text-center overflow-hidden">
        <Image
          src="/bg-img.jpg"
          alt="AI Governance Background"
          fill
          className="object-cover brightness-50 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0A0A0F]"></div>

        <div className="relative z-10 max-w-4xl px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            System Live & Accepting Reports
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-black mb-6 text-white tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Smarter Governance, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              Faster Resolution.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Empowering citizens through AI-driven analytics, automated task assignment, and real-time tracking for a more transparent society.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <button
              onClick={() => router.push('/auth/login/user')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Report an Issue <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push('/auth/login/worker')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/10 transition-all hover:scale-105"
            >
              Field Worker Portal
            </button>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-24 bg-[#0A0A0F] relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-16 text-white"
          >
            How It <span className="text-blue-500">Works</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="bg-[#12121A] p-8 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors relative group"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT PROBLEMS SOLVED */}
      <section className="py-24 bg-[#0D0D14] text-center relative border-t border-gray-800/30">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
          Impact in Action
        </h2>
        <p className="text-gray-400 mb-16 max-w-2xl mx-auto">Real issues resolved by our network of dedicated field workers and intelligent routing.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {recent.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-[#15151E] rounded-3xl overflow-hidden cursor-pointer border border-gray-800 hover:border-blue-500/50 transition-all shadow-xl group"
            >
              <div className="relative h-60 w-full overflow-hidden bg-gray-800">
                {/* Fallback gradient if images are missing */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-110 transition-transform duration-500"></div>
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover mix-blend-overlay opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15151E] to-transparent z-10"></div>
              </div>
              <div className="p-8 text-left relative z-20 -mt-20">
                <div className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3 border border-blue-500/20 backdrop-blur-md">Resolved</div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050508] text-gray-500 py-8 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
            <span className="text-gray-300 font-semibold">Grievance System</span>
          </div>
          <p className="text-sm">

          </p>
        </div>
      </footer>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  FileText, 
  BrainCircuit, 
  HardHat, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  BarChart2, 
  Users 
} from "lucide-react";
import Logo from "@/components/Logo";

export default function HomePage() {
  const router = useRouter();

  // Storytelling Workflow Stages
  const workflowStages = [
    {
      step: "01",
      icon: <FileText size={22} className="text-blue-600 dark:text-blue-400" />,
      title: "Citizen Voice & Evidence",
      badge: "Input Layer",
      desc: "Report issues via voice dictation in Hindi, Marathi, or English, or with interactive GPS coordinate pinning and photo evidence."
    },
    {
      step: "02",
      icon: <BrainCircuit size={22} className="text-purple-600 dark:text-purple-400" />,
      title: "AI Analysis & Clustering",
      badge: "Intelligence Layer",
      desc: "Machine learning classifies urgency, detects duplicate complaints within 300m, and groups geographic hotspots with DBSCAN clustering."
    },
    {
      step: "03",
      icon: <HardHat size={22} className="text-amber-600 dark:text-amber-400" />,
      title: "Automated Field Dispatch",
      badge: "Operations Layer",
      desc: "Automated assignment routes tasks to the nearest verified municipal technician with location-guided turn-by-turn routing."
    },
    {
      step: "04",
      icon: <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />,
      title: "Verified Redressal",
      badge: "Accountability Layer",
      desc: "Before/after photo validation and cryptographically signed email feedback allow citizens to confirm true ground resolution."
    }
  ];

  // Verified Municipal Case Studies
  const caseStudies = [
    {
      id: 1,
      title: "Critical Water Main Fracture",
      location: "Sitabuldi Ward, Nagpur",
      time: "Resolved in 18 hrs",
      category: "Water Supply",
      desc: "High-pressure pipeline leak detected and flagged Critical by AI; assigned to nearest field unit and restored with water quality recheck.",
      img: "/kanpur-mock.jpg",
    },
    {
      id: 2,
      title: "Road Sub-base Collapse",
      location: "Itwari Market Sector, Nagpur",
      time: "Resolved in 36 hrs",
      category: "Infrastructure",
      desc: "Multiple duplicate citizen reports automatically grouped into a single hotspot cluster; asphalt repaved with ground compaction testing.",
      img: "/lucknow-mock.jpg",
    },
    {
      id: 3,
      title: "Primary Health Center Sanitation",
      location: "Civil Hospital Zone, Nagpur",
      time: "Resolved in 24 hrs",
      category: "Sanitation",
      desc: "Waste disposal backlog resolved following citizen photo report; bio-waste collection schedule permanently standardized for the ward.",
      img: "/varanasi-mock.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">

      {/* HERO SECTION - Storytelling Municipal Portal */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Municipal Grievance Redressal System &bull; Live Operations
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight md:leading-none">
            Civic Voice. Real-Time Action. <br className="hidden sm:inline" />
            <span className="text-blue-600 dark:text-blue-400">
              Transparent Municipal Redressal.
            </span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Bridging citizens, field workers, and municipal leadership through AI-assisted triaging, spatial hotspot detection, and verifiable ground resolution.
          </p>

          {/* Action Hub - Clickable items only have active hover */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/auth/login/user')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-sm"
            >
              <span>File a Grievance</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => router.push('/auth/login/worker')}
              className="px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer text-sm"
            >
              Field Worker Portal
            </button>

            <button
              type="button"
              onClick={() => router.push('/auth/login/admin')}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-semibold rounded-lg transition-colors cursor-pointer text-sm"
            >
              Admin Intelligence Center
            </button>
          </div>

          {/* Civic Trust Indicators (Static info cards, no non-functional hovers) */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-slate-200 dark:border-slate-800 pt-10">
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Clock size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Response SLA</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">&lt; 48 Hours</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average resolution turnaround</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <ShieldCheck size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Verification</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">HMAC Signed</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cryptographic citizen proof</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <BrainCircuit size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Clustering</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">DBSCAN 1.5km</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Geospatial micro-hotspot detection</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <Users size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Multi-Lingual</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">EN / HI / MR</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI voice typing & native UI</div>
            </div>
          </div>

        </div>
      </section>

      {/* STORYTELLING WORKFLOW SECTION */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900">
              The Redressal Lifecycle
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
              How Civic Complaints Move from Filing to Ground Resolution
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Every stage is governed by transparent status transitions and verified accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowStages.map((stage) => (
              <div
                key={stage.step}
                className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {stage.icon}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                      STAGE {stage.step}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-block mb-2">
                    {stage.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT IN ACTION - Case Studies */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-900">
                Verified Outcomes
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                Ground Resolution in Action
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2 sm:mt-0">
              Sample cases addressed through automatic technician routing and citizen confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseStudies.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Resolved
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.time}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{item.location}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Sector: <strong>{item.category}</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&bull; Citizen Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={true} />
            <span className="border-l border-slate-700 pl-3 text-slate-500">Public Grievance Redressal Network</span>
          </div>
          <p className="text-slate-500">
            Automated &bull; Geospatially Clustered &bull; Verified Redressal
          </p>
        </div>
      </footer>

    </div>
  );
}


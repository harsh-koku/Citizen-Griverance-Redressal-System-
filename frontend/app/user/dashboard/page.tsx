"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import GrievanceChatbot from "@/components/GrievanceChatbot";
import GrievanceForm from "@/components/GrievanceForm";
import GrievanceList from "@/components/GrievanceList";
import { useLanguage } from "@/context/LanguageContext";
import {
  FilePlus,
  ListChecks,
  CheckCircle,
  Clock,
  MessageSquareBot,
  ChevronRight,
  Sparkles,
  Info,
  X,
} from "lucide-react";

interface Grievance {
  id: number;
  description: string;
  category: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export default function UserDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionMode, setSubmissionMode] = useState<"form" | "chatbot">("form");
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No access token found. Please login.");
        }
        const res = await api.get("/grievance/my-grievances");
        setGrievances(res.data);
      } catch (err: unknown) {
        const error = err as {
          response?: { status: number; data?: { detail?: string } };
          message?: string;
        };
        console.error("Dashboard Error:", error);

        if (error.response?.status === 401) {
          setError("Session expired. Redirecting to login...");
          setTimeout(() => {
            localStorage.removeItem("token");
            router.push("/auth/login/user");
          }, 2000);
        } else if (error.message === "Network Error") {
          setError("Cannot connect to server. Is the backend running?");
        } else {
          setError(
            error.response?.data?.detail || "Failed to load grievances."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, [router]);

  // Computed stats
  const total = grievances.length;
  const resolved = grievances.filter(
    (g) => g.status?.toLowerCase() === "resolved"
  ).length;
  const pending = grievances.filter(
    (g) => g.status?.toLowerCase() === "pending"
  ).length;
  const inProgress = grievances.filter(
    (g) => g.status?.toLowerCase() === "in progress"
  ).length;

  const stats = [
    {
      label: "Total Filed",
      value: total,
      icon: <ListChecks size={20} className="text-blue-500" />,
      color: "from-blue-500/10 to-blue-600/5 border-blue-200/60 dark:border-blue-700/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: <CheckCircle size={20} className="text-green-500" />,
      color: "from-green-500/10 to-green-600/5 border-green-200/60 dark:border-green-700/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: <Sparkles size={20} className="text-purple-500" />,
      color: "from-purple-500/10 to-purple-600/5 border-purple-200/60 dark:border-purple-700/30",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Pending",
      value: pending,
      icon: <Clock size={20} className="text-amber-500" />,
      color: "from-amber-500/10 to-amber-600/5 border-amber-200/60 dark:border-amber-700/30",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ─── Welcome Banner (dismissable) ─── */}
        {showWelcomeBanner && (
          <div
            id="welcome"
            className="relative flex items-start gap-4 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200/60 dark:border-cyan-700/30 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Info size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-800 dark:text-white text-base">
                👋 {t("Welcome to your Grievance Dashboard")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                {t("Use the sidebar to navigate between sections. Submit a new grievance using the form below or try the AI chatbot. Track all your submissions in 'My Grievances'.")}
              </p>
              {/* Quick action pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => {
                    const el = document.getElementById("submit");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition-colors shadow-sm"
                >
                  <FilePlus size={12} /> {t("Submit Grievance")}
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("grievances");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ListChecks size={12} /> {t("My Grievances")}
                </button>
                <button
                  onClick={() => setSubmissionMode("chatbot")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <MessageSquareBot size={12} /> {t("Try AI Assistant")}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── Dashboard Title ─── */}
        <div id="dashboard" className="scroll-mt-20">
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">
            {t("User Dashboard")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {t("Manage your public grievances and requests.")}
          </p>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t(stat.label)}
                </span>
                {stat.icon}
              </div>
              <p className={`text-3xl font-black ${stat.textColor}`}>
                {loading ? (
                  <span className="inline-block w-8 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Two Column Section ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Submit Form */}
          <section id="submit" className="scroll-mt-20 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                <FilePlus size={16} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {t("Submit a Grievance")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("Fill in the details below or")}
                  <button
                    onClick={() => setSubmissionMode("chatbot")}
                    className="ml-1 text-purple-600 dark:text-purple-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    {t("use AI chatbot")} <ChevronRight size={12} />
                  </button>
                </p>
              </div>
            </div>
            <GrievanceForm
              onSubmitted={(newItem) =>
                setGrievances((prev) => [newItem, ...prev])
              }
            />
          </section>

          {/* Grievance List */}
          <section
            id="grievances"
            className="scroll-mt-20 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <ListChecks size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {t("Your Grievances")}
                </h2>
              </div>
              {!loading && total > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full">
                  {total} {t("total")}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 text-center w-full">
                  <p className="font-semibold">⚠️ {error}</p>
                </div>
              </div>
            ) : grievances.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <ListChecks size={28} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {t("No grievances yet.")}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {t("Submit one using the form or AI Assistant!")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("submit");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors shadow-sm"
                >
                  <FilePlus size={16} /> {t("Submit your first grievance")}
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <GrievanceList grievances={grievances} />
              </div>
            )}
          </section>
        </div>

        {/* ─── AI Chatbot Section anchor ─── */}
        <div id="chatbot" className="scroll-mt-20" />
      </div>

      {/* ─── Floating Chatbot Panel ─── */}
      {submissionMode === "chatbot" && (
        <div
          id="chatbot-panel"
          className="fixed bottom-24 right-6 w-96 max-w-[90vw] z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[500px] max-h-[70vh]"
        >
          <GrievanceChatbot
            onSubmitted={(newItem) => {
              setGrievances((prev) => [newItem, ...prev]);
              setSubmissionMode("form");
            }}
          />
        </div>
      )}

      {/* ─── Floating AI Chat Toggle ─── */}
      <button
        onClick={() =>
          setSubmissionMode(submissionMode === "chatbot" ? "form" : "chatbot")
        }
        title={submissionMode === "chatbot" ? t("Close AI Assistant") : t("Open AI Assistant")}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-50 group
          ${submissionMode === "chatbot"
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
          }`}
      >
        {submissionMode === "chatbot" ? (
          <X size={22} />
        ) : (
          <MessageSquareBot size={22} />
        )}
        {/* Tooltip */}
        <span className="absolute right-16 bottom-1/2 translate-y-1/2 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          {submissionMode === "chatbot" ? t("Close AI Assistant") : t("AI Assistant")}
        </span>
      </button>
    </div>
  );
}
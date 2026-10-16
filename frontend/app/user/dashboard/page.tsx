"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import GrievanceChatbot from "@/components/GrievanceChatbot";
import GrievanceForm from "@/components/GrievanceForm";
import GrievanceList from "@/components/GrievanceList";
import OnboardingTooltip, { TooltipStep } from "@/components/OnboardingTooltip";
import { useLanguage } from "@/context/LanguageContext";
import { HelpCircle, Bot } from "lucide-react";

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
  const [showTour, setShowTour] = useState(false);
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
        const error = err as { response?: { status: number; data?: { detail?: string } }; message?: string };
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
          setError(error.response?.data?.detail || "Failed to load grievances.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, [router]);

  const onboardingSteps: TooltipStep[] = [
    {
      targetId: "step-description",
      title: "1. Add Complaint Details",
      description: "Type your grievance description here. You can also use Voice Typing to dictate your complaint in Hindi, Marathi, or English.",
      position: "bottom",
    },
    {
      targetId: "step-location-evidence",
      title: "2. Pin Location & Add Photo",
      description: "Click 'Select Location' to drop a pin on the interactive map, and 'Add Image' to attach photos of the issue.",
      position: "top",
    },
    {
      targetId: "step-grievances-list",
      title: "3. Track All Your Complaints",
      description: "All your submitted complaints appear here in real-time. You can monitor progress from Pending to Resolved.",
      position: "left",
    },
    {
      targetId: "step-ai-assistant",
      title: "4. Need Help? Use AI Chatbot",
      description: "Click this button anytime to chat with our AI assistant who can help file your grievance step-by-step.",
      position: "left",
    },
  ];

  const citizenStats = {
    total: grievances.length,
    pending: grievances.filter(g => g.status?.toLowerCase() === "pending").length,
    inProgress: grievances.filter(g => g.status?.toLowerCase() === "in progress").length,
    resolved: grievances.filter(g => g.status?.toLowerCase() === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Interactive Onboarding Popover Tour */}
      <OnboardingTooltip
        steps={onboardingSteps}
        storageKey="grievance_user_tour_seen"
        forceOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Dashboard Title & Quick Guide Trigger */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
              Citizen Redressal Portal
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("User Dashboard")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("Manage your public grievances and track real-time resolution progress.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
          >
            <HelpCircle size={15} className="text-blue-500" />
            <span>{t("How to use? Take a tour")}</span>
          </button>
        </div>

        {/* Citizen KPI Summary Bar (KPI Dashboard Design Pattern) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Filed</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{citizenStats.total}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime complaints</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Review</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{citizenStats.pending}</div>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">Awaiting field dispatch</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">In Progress</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{citizenStats.inProgress}</div>
            <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">Technician assigned</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Resolved</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{citizenStats.resolved}</div>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">Ground work confirmed</span>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Submit a Grievance Form */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("Submit a Grievance")}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">AI Duplicate Guard Active</span>
            </div>
            <GrievanceForm
              onSubmitted={(newItem) =>
                setGrievances((prev) => [newItem, ...prev])
              }
            />
          </div>

          {/* Right Column: Your Grievances List */}
          <div
            id="step-grievances-list"
            className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("Your Grievances")}
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {grievances.length} Active Records
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-slate-500 dark:text-slate-400 animate-pulse text-sm">
                  {t("Loading data...")}
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-4 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                ⚠️ {error}
              </div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="text-base font-medium">{t("No grievances yet.")}</p>
                <p className="text-xs mt-1">
                  {t("Submit one using the form or AI Assistant!")}
                </p>
              </div>
            ) : (
              <GrievanceList grievances={grievances} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Chatbot UI */}
      {submissionMode === "chatbot" && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] z-50 shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[500px] max-h-[70vh]">
          <GrievanceChatbot
            onSubmitted={(newItem) => {
              setGrievances((prev) => [newItem, ...prev]);
              setSubmissionMode("form");
            }}
          />
        </div>
      )}

      {/* Floating AI Chatbot Action Button */}
      <button
        id="step-ai-assistant"
        type="button"
        onClick={() =>
          setSubmissionMode(submissionMode === "chatbot" ? "form" : "chatbot")
        }
        title={submissionMode === "chatbot" ? t("Close AI Assistant") : t("AI Assistant")}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-50 cursor-pointer"
      >
        {submissionMode === "chatbot" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <Bot size={24} />
        )}
      </button>
    </div>
  );
}

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
      emoji: "??",
      position: "bottom",
    },
    {
      targetId: "step-location-evidence",
      title: "2. Pin Location & Add Photo",
      description: "Click 'Select Location' to drop a pin on the interactive map, and 'Add Image' to attach photos of the issue.",
      emoji: "??",
      position: "top",
    },
    {
      targetId: "step-grievances-list",
      title: "3. Track All Your Complaints",
      description: "All your submitted complaints appear here in real-time. You can monitor progress from Pending to Resolved.",
      emoji: "??",
      position: "left",
    },
    {
      targetId: "step-ai-assistant",
      title: "4. Need Help? Use AI Chatbot",
      description: "Click this button anytime to chat with our AI assistant who can help file your grievance step-by-step.",
      emoji: "🤖",
      position: "left",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      {/* Interactive Onboarding Popover Tour */}
      <OnboardingTooltip
        steps={onboardingSteps}
        storageKey="grievance_user_tour_seen"
        forceOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      <div className="px-6 md:px-12 py-8">
        {/* Dashboard Title & Quick Guide Trigger */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {t("User Dashboard")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t("Manage your public grievances and requests.")}
            </p>
          </div>
          <button
            onClick={() => setShowTour(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
          >
            <HelpCircle size={15} className="text-cyan-500" />
            <span>{t("How to use? Take a tour")}</span>
          </button>
        </div>

        {/* Original Clean 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Submit a Grievance Form */}
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {t("Submit a Grievance")}
            </h2>
            <GrievanceForm
              onSubmitted={(newItem) =>
                setGrievances((prev) => [newItem, ...prev])
              }
            />
          </div>

          {/* Right Column: Your Grievances List */}
          <div
            id="step-grievances-list"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 min-h-[400px]"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
              {t("Your Grievances")}
            </h2>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-gray-500 dark:text-gray-400 animate-pulse">
                  {t("Loading data...")}
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
                ⚠️ {error}
              </div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">{t("No grievances yet.")}</p>
                <p className="text-sm">
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
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[500px] max-h-[70vh]">
          <GrievanceChatbot
            onSubmitted={(newItem) => {
              setGrievances((prev) => [newItem, ...prev]);
              setSubmissionMode("form");
            }}
          />
        </div>
      )}

      {/* Floating AI Chatbot Button */}
      <button
        id="step-ai-assistant"
        onClick={() =>
          setSubmissionMode(submissionMode === "chatbot" ? "form" : "chatbot")
        }
        title={submissionMode === "chatbot" ? t("Close AI Assistant") : t("AI Assistant")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all z-50"
      >
        {submissionMode === "chatbot" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
          <Bot size={26} />
        )}
      </button>
    </div>
  );
}

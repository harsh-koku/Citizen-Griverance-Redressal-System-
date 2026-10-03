"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import GrievanceChatbot from "@/components/GrievanceChatbot";
import GrievanceForm from "@/components/GrievanceForm";
import GrievanceList from "@/components/GrievanceList";
import { useLanguage } from "@/context/LanguageContext";

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
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        // 1. Check if token exists before making request
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No access token found. Please login.");
        }

        const res = await api.get("/grievance/my-grievances");
        setGrievances(res.data);
      } catch (err: unknown) {
        const error = err as { response?: { status: number, data?: { detail?: string } }, message?: string };
        console.error("Dashboard Error:", error); // 🔍 Check Console for this!

        // 2. Handle 401 Unauthorized (Token expired/invalid)
        if (error.response?.status === 401) {
          setError("Session expired. Redirecting to login...");
          setTimeout(() => {
            localStorage.removeItem("token");
            router.push("/auth/login/user");
          }, 2000);
        } 
        // 3. Handle Network Errors (Backend down/CORS)
        else if (error.message === "Network Error") {
           setError("Cannot connect to server. Is the backend running?");
        }
        else {
          setError(error.response?.data?.detail || "Failed to load grievances.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="px-6 md:px-12 py-8">
        
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t("User Dashboard")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t("Manage your public grievances and requests.")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Input Section (Form) */}
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("Submit a Grievance")}</h2>
            <GrievanceForm 
              onSubmitted={(newItem) => setGrievances((prev) => [newItem, ...prev])}
            />
          </div>

          {/* Grievance List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 min-h-[400px]">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t("Your Grievances")}</h2>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                 <p className="text-gray-500 dark:text-gray-400 animate-pulse">{t("Loading data...")}</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
                ⚠️ {error}
              </div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">{t("No grievances yet.")}</p>
                <p className="text-sm">{t("Submit one using the form or AI Assistant!")}</p>
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
              setSubmissionMode("form"); // close after submission if desired, or keep open
            }}
          />
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={() => setSubmissionMode(submissionMode === "chatbot" ? "form" : "chatbot")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all z-50"
      >
        {submissionMode === "chatbot" ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        )}
      </button>
    </div>
  );
}
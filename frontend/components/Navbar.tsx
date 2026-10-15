"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const { t, language, setLanguage } = useLanguage();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  
  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setRole(localStorage.getItem("role"));
    } else {
      setIsLoggedIn(false);
      setRole(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setRole(null);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <h1
          onClick={() => router.push("/")}
          className="text-xl font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-cyan-400 dark:hover:text-blue-400 transition"
        >
          {t("Public Grievance Portal")}
        </h1>

        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <div className="flex items-center gap-3 mr-4 border-r pr-4 border-gray-300 dark:border-gray-700">
              <button 
                onClick={() => router.push("/auth/register")}
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-cyan-500 transition"
              >
                {t("Register")}
              </button>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {t("Login")} <ChevronDown size={14} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <button 
                      onClick={() => { router.push("/auth/login/user"); setIsDropdownOpen(false); }}
                      className="px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      {t("User Login")}
                    </button>
                    <button 
                      onClick={() => { router.push("/auth/login/worker"); setIsDropdownOpen(false); }}
                      className="px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-t border-gray-100 dark:border-gray-700"
                    >
                      {t("Field Worker Login")}
                    </button>
                    <button 
                      onClick={() => { router.push("/auth/login/admin"); setIsDropdownOpen(false); }}
                      className="px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-t border-gray-100 dark:border-gray-700"
                    >
                      {t("Admin Login")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mr-4 border-r pr-4 border-gray-300 dark:border-gray-700">
              <button 
                onClick={() => router.push(`/${role}/dashboard`)}
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-cyan-500 transition"
              >
                {t("Dashboard")}
              </button>
              {role === "user" && (
                <>
                  <button
                    onClick={() => {
                      router.push("/user/dashboard");
                      setTimeout(() => {
                        const el = document.getElementById("submit");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }, 300);
                    }}
                    className="hidden md:inline text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                  >
                    {t("+ New Grievance")}
                  </button>
                  <button
                    onClick={() => {
                      router.push("/user/dashboard");
                      setTimeout(() => {
                        const el = document.getElementById("grievances");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }, 300);
                    }}
                    className="hidden md:inline text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                  >
                    {t("My Grievances")}
                  </button>
                </>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
              >
                {t("Logout")}
              </button>
            </div>
          )}

          <div className="relative hidden md:block" ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-cyan-500 transition font-medium text-sm"
            >
              <Globe size={18} /> {language === "en" ? "English" : language === "hi" ? "हिंदी" : "मराठी"} <ChevronDown size={14} />
            </button>
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                <button 
                  onClick={() => { setLanguage("en"); setIsLangDropdownOpen(false); }}
                  className={`px-4 py-2 text-sm text-left transition ${language === "en" ? "bg-cyan-50 text-cyan-600 dark:bg-gray-700 dark:text-cyan-400 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                >
                  English
                </button>
                <button 
                  onClick={() => { setLanguage("hi"); setIsLangDropdownOpen(false); }}
                  className={`px-4 py-2 text-sm text-left transition ${language === "hi" ? "bg-cyan-50 text-cyan-600 dark:bg-gray-700 dark:text-cyan-400 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                >
                  हिंदी (Hindi)
                </button>
                <button 
                  onClick={() => { setLanguage("mr"); setIsLangDropdownOpen(false); }}
                  className={`px-4 py-2 text-sm text-left transition ${language === "mr" ? "bg-cyan-50 text-cyan-600 dark:bg-gray-700 dark:text-cyan-400 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

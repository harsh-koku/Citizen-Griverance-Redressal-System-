"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import ProfileModal from "./ProfileModal";
import Logo from "./Logo";
import api from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const { t, language, setLanguage } = useLanguage();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  
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
      const currentRole = localStorage.getItem("role");
      setRole(currentRole);
      const cachedName = localStorage.getItem("username");
      if (cachedName) setUserName(cachedName);

      // Throttle profile fetch to at most once every 5 minutes unless explicitly invalidated
      const lastFetch = sessionStorage.getItem("last_profile_fetch");
      const now = Date.now();
      if (!lastFetch || now - parseInt(lastFetch, 10) > 5 * 60 * 1000) {
        api.get("/auth/me")
          .then((res) => {
            sessionStorage.setItem("last_profile_fetch", now.toString());
            if (res.data?.name) {
              setUserName(res.data.name);
              localStorage.setItem("username", res.data.name);
            }
            if (res.data?.role) {
              setRole(res.data.role);
              localStorage.setItem("role", res.data.role);
            }
          })
          .catch(() => {});
      }
    } else {
      setIsLoggedIn(false);
      setRole(null);
      setUserName("");
    }

    const handleProfileSync = () => {
      const cachedName = localStorage.getItem("username");
      if (cachedName) setUserName(cachedName);
      const cachedRole = localStorage.getItem("role");
      if (cachedRole) setRole(cachedRole);
    };

    window.addEventListener("profileUpdated", handleProfileSync);
    return () => window.removeEventListener("profileUpdated", handleProfileSync);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
    setRole(null);
    setUserName("");
    router.push("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <Logo size="md" showText={true} />

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <div className="flex items-center gap-3 mr-4 border-r pr-4 border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => router.push("/auth/register")}
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                >
                  {t("Register")}
                </button>
                
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
                  >
                    {t("Login")} <ChevronDown size={14} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col py-1">
                      <button 
                        onClick={() => { router.push("/auth/login/user"); setIsDropdownOpen(false); }}
                        className="px-4 py-2.5 text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {t("User Login")}
                      </button>
                      <button 
                        onClick={() => { router.push("/auth/login/worker"); setIsDropdownOpen(false); }}
                        className="px-4 py-2.5 text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        {t("Field Worker Login")}
                      </button>
                      <button 
                        onClick={() => { router.push("/auth/login/admin"); setIsDropdownOpen(false); }}
                        className="px-4 py-2.5 text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        {t("Admin Login")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mr-4 border-r pr-4 border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => router.push(`/${role}/dashboard`)}
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                >
                  {t("Dashboard")}
                </button>

                {/* Profile Trigger Button */}
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-sm group cursor-pointer"
                  title={t("My Profile")}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                    role === "admin"
                      ? "bg-purple-600"
                      : role === "worker"
                      ? "bg-amber-600"
                      : "bg-blue-600"
                  }`}>
                    {userName ? userName.trim().charAt(0).toUpperCase() : (role ? role.charAt(0).toUpperCase() : "U")}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate hidden sm:inline">
                    {userName || (role === "admin" ? "Admin" : role === "worker" ? "Worker" : "Citizen")}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize border ${
                    role === "admin"
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                      : role === "worker"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  }`}>
                    {role === "admin" ? "Admin" : role === "worker" ? "Worker" : "Citizen"}
                  </span>
                </button>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                >
                  {t("Logout")}
                </button>
              </div>
            )}

            <div className="relative hidden md:block" ref={langDropdownRef}>
              <button 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
              >
                <Globe size={15} /> 
                <span>{language === "en" ? "English" : language === "hi" ? "हिन्दी" : "मराठी"}</span> 
                <ChevronDown size={13} />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col py-1">
                  <button 
                    onClick={() => { setLanguage("en"); setIsLangDropdownOpen(false); }}
                    className={`px-3.5 py-2 text-xs text-left transition cursor-pointer ${language === "en" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => { setLanguage("hi"); setIsLangDropdownOpen(false); }}
                    className={`px-3.5 py-2 text-xs text-left transition cursor-pointer ${language === "hi" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    हिन्दी (Hindi)
                  </button>
                  <button 
                    onClick={() => { setLanguage("mr"); setIsLangDropdownOpen(false); }}
                    className={`px-3.5 py-2 text-xs text-left transition cursor-pointer ${language === "mr" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
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

      {/* Global Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updatedName) => setUserName(updatedName)}
      />
    </>
  );
}

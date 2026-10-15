"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FilePlus,
  ListChecks,
  MessageSquareBot,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Sparkles,
  X,
  Menu,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  description: string;
}

export default function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("username") || localStorage.getItem("email");
    setUsername(storedName);
  }, []);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      href: "/user/dashboard",
      description: "Overview of your grievances",
    },
    {
      label: "Submit Grievance",
      icon: <FilePlus size={20} />,
      href: "/user/dashboard#submit",
      description: "File a new public complaint",
      badge: "New",
    },
    {
      label: "My Grievances",
      icon: <ListChecks size={20} />,
      href: "/user/dashboard#grievances",
      description: "Track all your submitted issues",
    },
    {
      label: "AI Assistant",
      icon: <MessageSquareBot size={20} />,
      href: "/user/dashboard#chatbot",
      description: "Submit via AI-powered chat",
      badge: "AI",
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleNavClick = (item: NavItem) => {
    setIsMobileOpen(false);
    if (item.href.includes("#")) {
      const [path, hash] = item.href.split("#");
      if (pathname === path || pathname === "/user/dashboard") {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        router.push(item.href);
      }
    } else {
      router.push(item.href);
    }
  };

  const isActive = (href: string) => {
    const path = href.split("#")[0];
    return pathname === path;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Profile Card */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200/50 dark:border-cyan-700/30 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {username ? username : t("Citizen")}
            </p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
              {t("Verified User")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-1">
          {t("Navigation")}
        </p>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                title={item.description}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 relative overflow-hidden
                  ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-700/40 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full" />
                )}

                <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${active ? "text-cyan-500" : ""}`}>
                  {item.icon}
                </span>

                <span className="flex-1">
                  <span className="block text-sm font-semibold">{t(item.label)}</span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5 group-hover:text-gray-500">
                    {t(item.description)}
                  </span>
                </span>

                {item.badge && (
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full
                    ${item.badge === "AI"
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
                      : "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300"
                    }`}>
                    {item.badge}
                  </span>
                )}

                {!item.badge && (
                  <ChevronRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Tip Box */}
        <div className="mt-6 p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-700/30 rounded-xl">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                {t("Pro Tip")}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300/80 leading-relaxed">
                {t("Use the AI Assistant to submit grievances faster with voice input!")}
              </p>
            </div>
          </div>
        </div>

        {/* Help Link */}
        <button
          onClick={() => window.open("/", "_self")}
          className="w-full mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200 transition-all group"
        >
          <HelpCircle size={18} className="group-hover:text-cyan-500 transition-colors" />
          <span className="text-sm font-medium">{t("Help & Guide")}</span>
        </button>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all group font-semibold text-sm"
        >
          <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          {t("Logout")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700/50 min-h-[calc(100vh-60px)] sticky top-[60px] self-start h-[calc(100vh-60px)]">
        <SidebarContent />
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-20 left-4 z-40 w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105"
        aria-label="Open Navigation Menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="font-bold text-gray-800 dark:text-white text-sm">Grievance Portal</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

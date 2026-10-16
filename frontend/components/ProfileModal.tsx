"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  Wrench,
  Check,
  X,
  LogOut,
  ExternalLink,
  Save,
  Loader2,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (name: string) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: ProfileModalProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string>("user");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Nagpur");
  const [workerCategory, setWorkerCategory] = useState("");
  const [joinedDate, setJoinedDate] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const storedRole = localStorage.getItem("role") || "user";
        setRole(storedRole);

        // Load local preferences
        const savedAddress = localStorage.getItem("user_address") || "";
        const savedCity = localStorage.getItem("user_city") || "Nagpur";
        setAddress(savedAddress);
        setCity(savedCity);

        // Fetch user info from backend
        const res = await api.get("/auth/me");
        if (res.data) {
          setName(res.data.name || "");
          setEmail(res.data.email || "");
          setPhone(res.data.phone || "");
          if (res.data.role) setRole(res.data.role);
          if (res.data.worker_category) setWorkerCategory(res.data.worker_category);
          if (res.data.created_at) {
            const d = new Date(res.data.created_at);
            setJoinedDate(d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }));
          }
        }
      } catch (err) {
        console.warn("Could not load backend profile, falling back to localStorage", err);
        // Fallback from localStorage
        setName(localStorage.getItem("username") || "Citizen");
        setEmail(localStorage.getItem("email") || "user@grievance.gov.in");
        setPhone(localStorage.getItem("phone") || "");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading(t("Saving profile..."));

    try {
      // 1. Update backend (name and phone)
      await api.put("/auth/me", {
        name: name.trim(),
        phone: phone.trim(),
      });

      // 2. Persist in localStorage
      localStorage.setItem("username", name.trim());
      localStorage.setItem("phone", phone.trim());
      localStorage.setItem("user_address", address.trim());
      localStorage.setItem("user_city", city.trim());

      sessionStorage.removeItem("last_profile_fetch");
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success(t("Profile updated successfully!"), { id: toastId });
      if (onProfileUpdated) onProfileUpdated(name.trim());
      setTimeout(() => onClose(), 600);
    } catch (err: unknown) {
      console.error("Save error:", err);
      // Even if backend call fails (e.g. offline), save locally
      localStorage.setItem("username", name.trim());
      localStorage.setItem("phone", phone.trim());
      localStorage.setItem("user_address", address.trim());
      localStorage.setItem("user_city", city.trim());
      sessionStorage.removeItem("last_profile_fetch");
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success(t("Profile saved locally!"), { id: toastId });
      if (onProfileUpdated) onProfileUpdated(name.trim());
      setTimeout(() => onClose(), 600);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    onClose();
    router.push("/");
  };

  const roleMeta = {
    admin: {
      title: "System Administrator",
      badge: "Administrator",
      badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      avatarBg: "bg-purple-600",
      dashboardUrl: "/admin/dashboard",
      icon: <ShieldCheck size={18} className="text-purple-600 dark:text-purple-400" />,
      tagline: "Central Command & Public Redressal Oversight",
    },
    worker: {
      title: "Field Operations Worker",
      badge: "Field Officer",
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      avatarBg: "bg-amber-600",
      dashboardUrl: "/worker/dashboard",
      icon: <Wrench size={18} className="text-amber-600 dark:text-amber-400" />,
      tagline: `Assigned Department: ${workerCategory || "Public Works"}`,
    },
    user: {
      title: "Verified Citizen",
      badge: "Citizen",
      badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      avatarBg: "bg-blue-600",
      dashboardUrl: "/user/dashboard",
      icon: <User size={18} className="text-blue-600 dark:text-blue-400" />,
      tagline: "Civic Redressal & Grievance Reporting Account",
    },
  }[role] || {
    title: "Citizen",
    badge: "User",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    dashboardUrl: "/user/dashboard",
    icon: <User size={18} className="text-blue-600 dark:text-blue-400" />,
    tagline: "Public Grievance Portal User",
  };

  const initial = name ? name.trim().charAt(0).toUpperCase() : role.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Top Decorative Solid Banner */}
        <div className="h-20 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 relative flex items-center justify-between px-6">
          <span className="text-xs uppercase tracking-widest font-black text-slate-300">
            {t("Account Profile")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Avatar & Header Block */}
        <div className="px-6 pb-2 -mt-10 flex items-end justify-between">
          <div className="flex items-end gap-3">
            <div className={`w-20 h-20 rounded-2xl ${roleMeta.avatarBg} text-white font-black text-3xl flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900`}>
              {initial}
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {name || t("User Profile")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Mail size={12} /> {email || "No email available"}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleMeta.badgeClass} mb-1 flex items-center gap-1`}>
            {roleMeta.icon}
            {roleMeta.badge}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Module-Specific Highlight Card */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/70 dark:border-gray-700/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              {roleMeta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {roleMeta.title}
                </span>
                {joinedDate && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar size={11} /> {t("Joined")} {joinedDate}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {roleMeta.tagline}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{t("Loading profile details...")}</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {t("Full Name")}
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-cyan-500 overflow-hidden px-3.5 py-1">
                  <User size={16} className="text-gray-400 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    required
                    className="w-full bg-transparent border-0 outline-none py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t("Email Address")}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={11} /> {t("Verified")}
                  </span>
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50 overflow-hidden px-3.5 py-1 cursor-not-allowed">
                  <Mail size={16} className="text-gray-400 shrink-0 mr-2.5" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-transparent border-0 outline-none py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {t("Contact Phone")}
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-cyan-500 overflow-hidden px-3.5 py-1">
                  <Phone size={16} className="text-gray-400 shrink-0 mr-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-transparent border-0 outline-none py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Address / Primary Locality */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {role === "worker"
                    ? t("Assigned Station / Depot")
                    : role === "admin"
                    ? t("Office Jurisdiction")
                    : t("Residential Address / Locality")}
                </label>
                <div className="flex items-start rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-cyan-500 overflow-hidden px-3.5 py-2.5">
                  <MapPin size={16} className="text-gray-400 shrink-0 mr-2.5 mt-0.5" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      role === "worker"
                        ? "Ward No. 12 Depot, Central Zone"
                        : role === "admin"
                        ? "Municipal Corporation HQ, Civil Lines"
                        : "e.g. Flat 302, Green Valley Apartments, Sitabuldi"
                    }
                    className="w-full bg-transparent border-0 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none p-0"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {role === "user"
                    ? t("Saving your address helps speed up your grievance lodging.")
                    : t("Your primary work and jurisdictional zone.")}
                </p>
              </div>

              {/* City / Region */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {t("City / Region")}
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-cyan-500 overflow-hidden px-3.5 py-1">
                  <Building2 size={16} className="text-gray-400 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nagpur"
                    className="w-full bg-transparent border-0 outline-none py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t("Saving...")}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{t("Save Changes")}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer with Quick Links & Logout */}
        <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onClose();
              router.push(roleMeta.dashboardUrl);
            }}
            className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            <span>{t("Go to Dashboard")}</span>
            <ExternalLink size={12} />
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 font-bold text-red-500 hover:text-red-600 transition"
          >
            <LogOut size={13} />
            <span>{t("Logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

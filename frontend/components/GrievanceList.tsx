import { MapPin, AlertTriangle, Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Grievance {
  id: number;
  description: string;
  status: string;
  category?: string;
  priority?: string;
  region?: string;
  state?: string;
  city?: string;
  zone?: string;
  ward?: string;
  latitude?: string;
  longitude?: string;
  image_url?: string;
  created_at?: string;
}

interface GrievanceListProps {
  grievances: Grievance[];
}

export default function GrievanceList({ grievances }: GrievanceListProps) {
  const { t } = useLanguage();
  
  // Helper to get status styling (Solid, accessible tokens)
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/50",
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-200 dark:border-emerald-800",
          icon: <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />,
          label: t("Resolved")
        };
      case "in progress":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/50",
          text: "text-blue-700 dark:text-blue-300",
          border: "border-blue-200 dark:border-blue-800",
          icon: <Clock size={13} className="text-blue-600 dark:text-blue-400" />,
          label: t("In Progress")
        };
      case "pending":
      default:
        return {
          bg: "bg-amber-50 dark:bg-amber-950/50",
          text: "text-amber-800 dark:text-amber-300",
          border: "border-amber-200 dark:border-amber-800",
          icon: <AlertCircle size={13} className="text-amber-600 dark:text-amber-400" />,
          label: t("Pending Review")
        };
    }
  };

  return (
    <ul className="space-y-4">
      {grievances.map((g) => {
        const badge = getStatusBadge(g.status);
        const isResolved = g.status.toLowerCase() === "resolved";
        const isInProgress = g.status.toLowerCase() === "in progress";

        return (
          <li 
            key={g.id} 
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            {/* Top Row: Ticket ID + Category + Status */}
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  #{g.id}
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                  {g.category ? t(g.category.toUpperCase()) : t("General")}
                </span>
              </div>
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed mb-4 font-normal">
              {g.description}
            </p>

            {/* Redressal Lifecycle Timeline Indicator (Storytelling) */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">1. Filed</span>
                <span className={isInProgress || isResolved ? "text-blue-600 dark:text-blue-400 font-semibold" : ""}>2. Dispatched</span>
                <span className={isResolved ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>3. Resolved</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-blue-600 h-full w-1/3"></div>
                <div className={`h-full w-1/3 ${isInProgress || isResolved ? "bg-blue-600" : "bg-transparent"}`}></div>
                <div className={`h-full w-1/3 ${isResolved ? "bg-emerald-600" : "bg-transparent"}`}></div>
              </div>
            </div>
            
            {/* Attached Image (if any) */}
            {g.image_url && (
              <div className="mb-4">
                <img src={g.image_url} alt="Grievance Attachment" className="w-full max-h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
              </div>
            )}

            {/* Bottom Row: Metadata (Priority, Region, GPS, Date) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              
              {/* Priority */}
              <div className={`flex items-center gap-1.5 ${
                g.priority === 'High' || g.priority === 'Critical' ? 'text-red-600 dark:text-red-400 font-semibold' : ''
              }`}>
                <AlertTriangle size={14} />
                <span>{g.priority || t("Normal")} {t("Priority")}</span>
              </div>

              {/* Region */}
              {(g.region || g.city || g.state) && (
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <MapPin size={13} className="text-slate-400" />
                  <span>
                    {g.city ? `${g.city}, ` : ''}{g.state ? `${g.state} ` : ''}{g.region ? `(${g.region})` : ''}
                  </span>
                  {(g.zone || g.ward) && (
                    <span className="text-slate-400 text-[11px]">
                      &bull; {g.ward ? `Ward: ${g.ward}` : g.zone ? `Zone: ${g.zone}` : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Coordinates Map Link (Clickable action with focus/hover) */}
              {g.latitude && g.longitude && (
                <a 
                  href={`https://maps.google.com/?q=${g.latitude},${g.longitude}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  <span>Google Maps</span>
                  <ExternalLink size={12} />
                </a>
              )}

              {/* Date */}
              {g.created_at && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Calendar size={13} />
                  <span>{new Date(g.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
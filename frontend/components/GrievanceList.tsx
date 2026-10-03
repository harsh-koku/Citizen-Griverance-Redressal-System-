import { MapPin, AlertTriangle, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
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
  
  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  // Helper to get Status Icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return <CheckCircle size={14} />;
      case "pending": return <Clock size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <ul className="space-y-4">
      {grievances.map((g) => (
        <li 
          key={g.id} 
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Top Row: Category Badge + Status */}
          <div className="flex justify-between items-start mb-3">
            <span className="px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full uppercase tracking-wider">
              {g.category ? t(g.category.toUpperCase()) : t("General")}
            </span>
            
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(g.status)}`}>
              {getStatusIcon(g.status)}
              <span>{g.status === "Resolved" ? t("Resolved") : g.status === "In Progress" ? t("In Progress") : t("Pending")}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed mb-4">
            {g.description}
          </p>
          
          {/* Attached Image (if any) */}
          {g.image_url && (
            <div className="mb-4">
              <img src={g.image_url} alt="Grievance Attachment" className="w-full max-h-48 object-cover rounded-lg border border-gray-200" />
            </div>
          )}

          {/* Bottom Row: Metadata (Priority, Region, Date) */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
            
            {/* Priority */}
            <div className={`flex items-center gap-1.5 ${
              g.priority === 'High' || g.priority === 'Critical' ? 'text-red-500 font-semibold' : ''
            }`}>
              <AlertTriangle size={14} />
              <span>{g.priority || t("Normal")} {t("Priority")}</span>
            </div>

            {/* Region */}
            {g.region || g.city || g.state ? (
                <div className="flex flex-col mt-4">
                  <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                      📍 {g.city ? `${g.city}, ` : ''}{g.state ? `${g.state} ` : ''}{g.region ? `(${g.region})` : ''}
                  </span>
                  {(g.zone || g.ward) && (
                      <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-medium mt-1 border border-transparent dark:border-gray-700">
                          🏢 {g.zone ? `${t("Zone")}: ${g.zone}` : ''} {g.zone && g.ward ? '|' : ''} {g.ward ? `${t("Ward")}: ${g.ward}` : ''}
                      </span>
                  )}
                  {g.latitude && g.longitude && (
                    <a href={`https://maps.google.com/?q=${g.latitude},${g.longitude}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 underline text-xs mt-1 inline-block">
                        {t("Open in Google Maps")}
                    </a>
                  )}
                </div>
            ) : null}

            {/* Date (Optional) */}
            {g.created_at && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Calendar size={14} />
                <span>{new Date(g.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import {
  LayoutDashboard,
  Map as MapIcon,
  ListChecks,
  BarChart3,
  Search,
  Filter,
  CheckCircle,
  MapPin,
  Eye,
  X,
  Lightbulb,
  Flame,
  Layers,
  Sparkles
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import "leaflet/dist/leaflet.css";

// --- Dynamic Imports for Map (Client-side only) ---
const AdminMap = dynamic(() => import("@/components/AdminMap"), { ssr: false });

interface Grievance {
  id: number;
  description: string;
  category: string;
  priority: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  solution: string;
  status: string;
  created_at: string;
  user_id: number;
  assigned_worker_id?: number | null;
}

interface ForecastData {
  date: string;
  predicted_count: number;
  lower_bound: number;
  upper_bound: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"list" | "map" | "analytics">("list");
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal & Map Focus State
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);
  const [workers, setWorkers] = useState<{ id: number, name: string, email: string, category: string }[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  const jumpToMap = (lat: number, lng: number) => {
    setFocusedLocation([lat, lng]);
    setActiveTab("map");
  };

  // Analytics State
  const [selectedCategory, setSelectedCategory] = useState("Water");
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [forecastSummary, setForecastSummary] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Geospatial Hotspot Clusters State (DBSCAN)
  const [clusterHotspots, setClusterHotspots] = useState<any[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  const fetchHotspots = async () => {
    setClustersLoading(true);
    try {
      const res = await api.get("/analytics/hotspots?limit=15&use_clustering=true");
      if (res.data?.cluster_hotspots) {
        setClusterHotspots(res.data.cluster_hotspots);
      }
    } catch (err) {
      console.warn("Failed to load geospatial cluster hotspots", err);
    } finally {
      setClustersLoading(false);
    }
  };

  // --- 1. Fetch Data on Load ---
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "admin") {
          router.push("/auth/login/admin");
          return;
        }

        const res = await api.get("/grievance/all");
        setGrievances(res.data);

        const workersRes = await api.get("/auth/workers");
        setWorkers(workersRes.data);

        // Pre-fetch cluster hotspots for map
        fetchHotspots();
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };
    init();

  }, [router]);

  // --- 2. Fetch Map Hotspots when Map Tab is active ---
  useEffect(() => {
    if (activeTab === "map") {
      fetchHotspots();
    }
  }, [activeTab]);

  // --- 3. Fetch Forecast when Analytics Tab is active ---
  useEffect(() => {
    if (activeTab === "analytics") {
      fetchForecast(selectedCategory);
    }
  }, [activeTab, selectedCategory]);

  const fetchForecast = async (category: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get(`/analytics/forecast/${category}`);
      if (res.data.status === "success") {
        setForecastData(res.data.forecast);
        setForecastSummary(res.data.summary);
      } else {
        setForecastData([]);
        setForecastSummary(res.data.error || "Insufficient data.");
      }
    } catch (error) {
      console.warn("Forecast API error:", error);
      setForecastData([]);
      setForecastSummary("Not enough data yet. We need more past records to predict the future for this category.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // --- 3. Update Status Logic ---
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const originalGrievances = [...grievances];

    // Optimistic Update for both list and modal
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
    if (selectedGrievance && selectedGrievance.id === id) {
      setSelectedGrievance(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      await api.put(`/grievance/${id}/status`, null, {
        params: { status: newStatus }
      });
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update status on server.");
      setGrievances(originalGrievances); // Revert on failure
    }
  };

  const handleAssignWorker = async (grievanceId: number) => {
    if (!selectedWorkerId) return alert("Please select a worker first.");
    try {
      await api.put(`/grievance/${grievanceId}/assign?worker_id=${selectedWorkerId}`);
      alert("Worker assigned successfully! An email has been sent to the citizen.");

      // Update local state
      setGrievances(prev => prev.map(g => g.id === grievanceId ? { ...g, status: "In Progress", assigned_worker_id: Number(selectedWorkerId) } : g));
      if (selectedGrievance && selectedGrievance.id === grievanceId) {
        setSelectedGrievance({ ...selectedGrievance, status: "In Progress", assigned_worker_id: Number(selectedWorkerId) });
      }
      setSelectedWorkerId("");
    } catch (error) {
      console.error("Assign failed", error);
      alert("Failed to assign worker.");
    }
  };

  const handleUnassignWorker = async (grievanceId: number) => {
    try {
      await api.put(`/grievance/${grievanceId}/assign`);
      alert("Worker unassigned successfully.");

      // Update local state
      setGrievances(prev => prev.map(g => g.id === grievanceId ? { ...g, status: g.status === "In Progress" ? "Pending" : g.status, assigned_worker_id: null } : g));
      if (selectedGrievance && selectedGrievance.id === grievanceId) {
        setSelectedGrievance({ ...selectedGrievance, status: selectedGrievance.status === "In Progress" ? "Pending" : selectedGrievance.status, assigned_worker_id: null });
      }
    } catch (error) {
      console.error("Unassign failed", error);
      alert("Failed to unassign worker.");
    }
  };

  const handleAutoAssign = async () => {
    try {
      const res = await api.post("/grievance/auto-assign");
      alert(res.data.message);
      // Refresh grievances
      const gRes = await api.get("/grievance/all");
      setGrievances(gRes.data);
    } catch (error) {
      console.error("Auto assign failed", error);
      alert("Failed to auto-assign workers.");
    }
  };

  const handleAiEscalation = async () => {
    try {
      const res = await api.post("/ai/run-escalations");
      alert(res.data.message);
      // Refresh grievances
      const gRes = await api.get("/grievance/all");
      setGrievances(gRes.data);
    } catch (error) {
      console.error("AI Escalation failed", error);
      alert("Failed to run AI Escalation.");
    }
  };

  const [filterPriority, setFilterPriority] = useState("All");

  // --- Computed Data ---
  const filteredGrievances = useMemo(() => {
    // 1. Filter
    let filtered = grievances.filter(g => {
      const matchesSearch =
        g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "All" || g.status === filterStatus;
      const matchesPriority = filterPriority === "All" || g.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // 2. Sort (Starvation Prevention Algorithm)
    // We calculate an "Urgency Score" combining Priority and Age (Days Pending).
    const priorityWeight: Record<string, number> = { "Critical": 40, "High": 30, "Medium": 20, "Low": 10 };
    
    filtered.sort((a, b) => {
      // If it's already resolved/closed, just sort by date (newest first)
      if (a.status === "Resolved" || a.status === "Closed") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const getUrgency = (g: Grievance) => {
        const weight = priorityWeight[g.priority] || 10;
        const daysPending = (Date.now() - new Date(g.created_at).getTime()) / (1000 * 3600 * 24);
        // Add 2 points per day pending. A 10-day old Low priority (10 + 20 = 30) matches a brand new High priority (30).
        return weight + (daysPending * 2);
      };

      return getUrgency(b) - getUrgency(a); // Highest urgency first
    });

    return filtered;
  }, [grievances, searchTerm, filterStatus, filterPriority]);

  const stats = useMemo(() => ({
    total: grievances.length,
    pending: grievances.filter(g => g.status === "Pending").length,
    resolved: grievances.filter(g => g.status === "Resolved").length,
    critical: grievances.filter(g => g.priority === "High" || g.priority === "Critical").length,
  }), [grievances]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500">Loading Admin Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans relative">

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Dashboard Title */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Portal</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage platform operations and analytics.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAiEscalation}
              className="hidden md:flex bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              Run AI Escalation
            </button>
            <button
              onClick={handleAutoAssign}
              className="hidden md:flex bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              Auto Assign Workers
            </button>
            <div className="hidden md:flex gap-1 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
              <TabButton active={activeTab === "list"} onClick={() => setActiveTab("list")} icon={<ListChecks size={16} />} label="List" />
              <TabButton active={activeTab === "map"} onClick={() => setActiveTab("map")} icon={<MapIcon size={16} />} label="Map" />
              <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 size={16} />} label="Analytics" />
            </div>
          </div>
        </div>

        {/* KPI Operations Grid (KPI Dashboard Design Pattern) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Grievances" value={stats.total} color="blue" subtext="Aggregated across all wards" />
          <StatCard label="Pending Triage" value={stats.pending} color="yellow" subtext="Awaiting worker assignment" />
          <StatCard label="Verified Resolved" value={stats.resolved} color="green" subtext="Citizen & worker confirmed" />
          <StatCard label="Critical Urgency" value={stats.critical} color="red" subtext="Elevated priority escalation" />
        </div>

        {/* --- VIEW: LIST --- */}
        {activeTab === "list" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/70 dark:bg-slate-900/60">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search grievances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-500 dark:text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                  title="Filter by priority. List is smart-sorted to prevent low-priority starvation."
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Priority</th>
                    <th className="px-6 py-4 font-semibold">Region</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredGrievances.map((g) => (
                    <tr key={g.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{g.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300">
                          {g.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${g.priority === 'High' || g.priority === 'Critical' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900' :
                            g.priority === 'Medium' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'}`}>
                          {g.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{g.region || "Unknown"}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {g.description}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={g.status}
                          onChange={(e) => handleStatusUpdate(g.id, e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer hover:border-blue-500 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1">
                        <button
                          onClick={() => setSelectedGrievance(g)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 p-2 rounded-full transition cursor-pointer"
                          title="View Details & AI Solution"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (g.latitude && g.longitude) {
                              jumpToMap(g.latitude, g.longitude);
                            } else {
                              alert("No location data available for this grievance.");
                            }
                          }}
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 p-2 rounded-full transition cursor-pointer"
                          title="View on Map"
                        >
                          <MapPin size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredGrievances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: MAP --- */}
        {activeTab === "map" && (
          <div className="space-y-4">
            {/* AI Hotspots Summary Banner */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      AI Geospatial Cluster Hotspots
                    </h3>
                    <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold border border-red-200 dark:border-red-900">
                      DBSCAN Haversine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aggregated micro-hotspots within a 1.5 km spatial tolerance radius.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5 text-xs">
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>{clusterHotspots.length} Clusters Found</span>
                </div>

                {clusterHotspots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => jumpToMap(clusterHotspots[0].latitude, clusterHotspots[0].longitude)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer border border-red-200 dark:border-red-900"
                    title="Jump to highest density hotspot"
                  >
                    <Flame className="w-3.5 h-3.5 text-red-600" />
                    <span>Peak Zone: {clusterHotspots[0].complaint_density} Issues (Focus)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={fetchHotspots}
                  disabled={clustersLoading}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 rounded-lg font-medium transition disabled:opacity-50 cursor-pointer border border-blue-200 dark:border-blue-900"
                >
                  {clustersLoading ? "Scanning..." : "Recalculate Clusters"}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-lg h-[620px] z-0 relative border border-slate-200 dark:border-slate-800">
              <AdminMap 
                focusedLocation={focusedLocation} 
                grievances={filteredGrievances} 
                clusterHotspots={clusterHotspots}
              />
            </div>
          </div>
        )}

        {/* --- VIEW: ANALYTICS --- */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Predicted Issue Trends (Next 30 Days)</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none"
                >
                  <option value="Water">Water Supply</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Medical">Medical</option>
                </select>
              </div>

              <div className="h-[400px] w-full flex items-center justify-center">
                {analyticsLoading ? (
                  <p className="text-slate-400 animate-pulse">Analyzing Future Trends...</p>
                ) : forecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} fontSize={12} tickLine={false} axisLine={false} stroke="#64748b" />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a' }} 
                        itemStyle={{ color: '#0f172a' }}
                        cursor={{ fill: '#f1f5f9' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="predicted_count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Predicted Complaints" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <BarChart3 size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400">Not enough data to forecast trends for <strong>{selectedCategory}</strong>.</p>
                    <p className="text-sm text-slate-400 mt-1">Try selecting a different category from the dropdown above.</p>
                  </div>
                )}
              </div>
            </div>
            {/* Insights Panel */}
            <div className="space-y-6">
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700"><BarChart3 size={16} className="text-blue-400" /></div>
                  <span>AI Predictive Advisory</span>
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {forecastSummary || "Select a category above to evaluate 30-day projected municipal complaint volume and deployment strategies."}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Current Queue</span>
                    <span className="font-medium text-slate-900 dark:text-white">{stats.pending} tickets</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Resolution Rate</span>
                    <span className="font-medium text-slate-900 dark:text-white">{Math.round((stats.resolved / stats.total) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(stats.resolved / stats.total) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL: GRIEVANCE DETAILS --- */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">

            {/* Modal Header */}
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  Grievance #{selectedGrievance.id}
                  <span className="bg-blue-500/50 text-xs px-2 py-0.5 rounded border border-blue-400">
                    {selectedGrievance.status}
                  </span>
                </h3>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {selectedGrievance.region || "Unknown Region"}
                </p>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-white/80 hover:text-white hover:bg-blue-700 rounded-full p-2 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

              {/* Section 1: User's Grievance */}
              <div>
                <h4 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Citizen Report
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-200 dark:border-slate-700">
                  {selectedGrievance.description}
                </div>
              </div>

              {/* Section 3: Worker Assignment */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Assign Field Worker
                </h4>
                {selectedGrievance.assigned_worker_id ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg flex justify-between items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 text-sm"><CheckCircle size={18} /> Field Worker is assigned. (ID: {selectedGrievance.assigned_worker_id})</div>
                    <button
                      onClick={() => handleUnassignWorker(selectedGrievance.id)}
                      className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-md transition cursor-pointer border border-red-200 dark:border-red-800"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Select Field Worker --</option>
                      {workers
                        .filter(w => !w.category || !selectedGrievance.category || w.category.toLowerCase() === selectedGrievance.category.toLowerCase())
                        .map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.category})</option>
                        ))
                      }
                      <optgroup label="Other Categories">
                        {workers
                          .filter(w => w.category && selectedGrievance.category && w.category.toLowerCase() !== selectedGrievance.category.toLowerCase())
                          .map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.category})</option>
                          ))
                        }
                      </optgroup>
                    </select>
                    <button
                      onClick={() => handleAssignWorker(selectedGrievance.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      Assign & Notify
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedGrievance.id, "Resolved")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      Force Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                Submitted on {new Date(selectedGrievance.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGrievance(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedGrievance.id, "Resolved");
                    setSelectedGrievance(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg text-sm font-medium transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={16} /> Mark Resolved
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// --- Sub-components ---

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ 
  label, 
  value, 
  color,
  subtext 
}: { 
  label: string; 
  value: number; 
  color: "blue" | "green" | "red" | "yellow";
  subtext?: string;
}) {
  const styles = {
    blue: {
      card: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      accent: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900"
    },
    green: {
      card: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      accent: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
    },
    red: {
      card: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      accent: "text-red-600 dark:text-red-400",
      badge: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-900"
    },
    yellow: {
      card: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      accent: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900"
    },
  };

  const style = styles[color];

  return (
    <div className={`p-5 rounded-xl border ${style.card} shadow-sm flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${style.badge}`}>
          Active
        </span>
      </div>
      <div className="mt-2 mb-1">
        <span className={`text-3xl font-extrabold ${style.accent}`}>{value}</span>
      </div>
      {subtext && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500">{subtext}</span>
      )}
    </div>
  );
}


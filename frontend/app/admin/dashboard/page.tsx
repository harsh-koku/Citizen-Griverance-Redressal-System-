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
  Lightbulb
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
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };
    init();

  }, [router]);

  // --- 2. Fetch Forecast when Analytics Tab is active ---
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading Admin Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans relative">

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Dashboard Title */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Portal</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage platform operations and analytics.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAiEscalation}
              className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md"
            >
              Run AI Escalation
            </button>
            <button
              onClick={handleAutoAssign}
              className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md"
            >
              Auto Assign Workers
            </button>
            <div className="hidden md:flex gap-1 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-1 rounded-lg">
              <TabButton active={activeTab === "list"} onClick={() => setActiveTab("list")} icon={<ListChecks size={16} />} label="List" />
              <TabButton active={activeTab === "map"} onClick={() => setActiveTab("map")} icon={<MapIcon size={16} />} label="Map" />
              <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 size={16} />} label="Analytics" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Grievances" value={stats.total} color="blue" />
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Resolved" value={stats.resolved} color="green" />
          <StatCard label="Critical Priority" value={stats.critical} color="red" />
        </div>

        {/* --- VIEW: LIST --- */}
        {activeTab === "list" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search grievances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500 dark:text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none"
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
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
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
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredGrievances.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">#{g.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                          {g.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${g.priority === 'High' || g.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                            g.priority === 'Medium' ? 'bg-orange-100 text-orange-600' :
                              'bg-green-100 text-green-600'}`}>
                          {g.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{g.region || "Unknown"}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {g.description}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={g.status}
                          onChange={(e) => handleStatusUpdate(g.id, e.target.value)}
                          className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 cursor-pointer hover:border-blue-500 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1">
                        <button
                          onClick={() => setSelectedGrievance(g)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition"
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
                          className="text-green-600 hover:bg-green-50 p-2 rounded-full transition"
                          title="View on Map"
                        >
                          <MapPin size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredGrievances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: MAP --- */}
        {activeTab === "map" && (
          <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg h-[600px] z-0 relative">
            <AdminMap focusedLocation={focusedLocation} grievances={filteredGrievances} />
          </div>
        )}

        {/* --- VIEW: ANALYTICS --- */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Predicted Issue Trends (Next 30 Days)</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none"
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
                  <p className="text-gray-400 animate-pulse">Analyzing Future Trends...</p>
                ) : forecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} fontSize={12} tickLine={false} axisLine={false} stroke="#6b7280" />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ color: '#1f2937' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="predicted_count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Predicted Complaints" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <BarChart3 size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Not enough data to forecast trends for <strong>{selectedCategory}</strong>.</p>
                    <p className="text-sm text-gray-400 mt-1">Try selecting a different category from the dropdown above.</p>
                  </div>
                )}
              </div>
            </div>
            {/* Insights Panel */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-full"><BarChart3 size={16} /></div>
                  AI Summary & Advice
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  {forecastSummary || "Select a category above to see our AI's advice on what issues to expect and how to prepare."}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Current Queue</span>
                    <span className="font-medium">{stats.pending} tickets</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Resolution Rate</span>
                    <span className="font-medium">{Math.round((stats.resolved / stats.total) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.resolved / stats.total) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL: GRIEVANCE DETAILS --- */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

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
                className="text-white/80 hover:text-white hover:bg-blue-500 rounded-full p-2 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

              {/* Section 1: User's Grievance */}
              <div>
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Citizen Report
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-gray-800 dark:text-gray-200 leading-relaxed border border-gray-100 dark:border-gray-700">
                  {selectedGrievance.description}
                </div>
              </div>

              {/* Section 2 removed per user request */}

              {/* Section 3: Worker Assignment */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">
                  Assign Field Worker
                </h4>
                {selectedGrievance.assigned_worker_id ? (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2"><CheckCircle size={18} /> Field Worker is already assigned. (ID: {selectedGrievance.assigned_worker_id})</div>
                    <button
                      onClick={() => handleUnassignWorker(selectedGrievance.id)}
                      className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    >
                      <option value="">-- Select Field Worker --</option>
                      {workers
                        .filter(w => !w.category || !selectedGrievance.category || w.category.toLowerCase() === selectedGrievance.category.toLowerCase())
                        .map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.category})</option>
                        ))
                      }
                      {/* Show others if they want to override */}
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
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition whitespace-nowrap"
                    >
                      Assign & Notify
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedGrievance.id, "Resolved")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition whitespace-nowrap"
                    >
                      Force Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">
                Submitted on {new Date(selectedGrievance.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGrievance(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedGrievance.id, "Resolved");
                    setSelectedGrievance(null);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
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
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${active
          ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "green" | "red" | "yellow" }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800",
  };
  return (
    <div className={`p-5 rounded-xl border ${colors[color]} shadow-sm flex flex-col justify-between h-28`}>
      <span className="text-sm font-medium opacity-80">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  );
}


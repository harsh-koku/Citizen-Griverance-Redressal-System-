"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { Wrench, CheckCircle, Lightbulb, Image as ImageIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";
// Map Imports
const WorkerMap = dynamic(() => import("@/components/WorkerMap"), { ssr: false });



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
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Grievance[]>([]);
  const [proofUrls, setProofUrls] = useState<{ [key: number]: string }>({});
  const [workerNotes, setWorkerNotes] = useState<{ [key: number]: string }>({});
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "worker") {
        router.push("/auth/login/worker");
        return;
      }

      try {
        const res = await api.get("/grievance/worker/tasks");
        setTasks(res.data);
      } catch (error) {
        console.error("Failed to fetch worker tasks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();


  }, [router]);

  const handleResolve = async (id: number) => {
    if (isResolving[id]) return; // Prevent double clicks
    setIsResolving(prev => ({ ...prev, [id]: true }));
    try {
      const proofUrl = proofUrls[id] || "";
      const note = workerNotes[id] || "";

      await api.put(`/grievance/${id}/status`, null, {
        params: { status: "Resolved", resolution_proof_url: proofUrl, worker_note: note }
      });
      alert("Task marked as resolved!");
      setTasks(tasks.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
    } catch (error: any) {
      // Extract the detailed message from the backend if it exists (e.g., AI Vision Rejection)
      const errorMsg = error.response?.data?.detail || "Failed to update status.";
      alert(errorMsg);
      console.error(error);
    } finally {
      setIsResolving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleImageUpload = async (id: number, file: File) => {
    setUploadingImageId(id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/grievance/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProofUrls(prev => ({ ...prev, [id]: res.data.image_url }));
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImageId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
    </div>
  );

  const pendingTasks = tasks.filter(t => t.status !== "Resolved");
  const resolvedTasks = tasks.filter(t => t.status === "Resolved");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      <main className="p-6 max-w-7xl mx-auto">

        {/* Dashboard Title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-lg shadow-sm">
            <Wrench className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Field Worker Portal</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and resolve assigned grievances.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Col: Task List */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Your Daily Assignments</h2>
              <p className="text-slate-500 dark:text-slate-400">You have {pendingTasks.length} pending tasks to resolve.</p>
            </div>

            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'Critical' || task.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'}`}></div>

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded">#{task.id} • {task.category}</span>
                      <h3 className="font-semibold text-lg mt-2 text-slate-900 dark:text-white">{task.region || "Unknown Region"}</h3>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${task.priority === 'Critical' || task.priority === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'}`}>
                      {task.priority} Priority
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">{task.description}</p>

                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 rounded-lg mb-4">
                    <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2 flex items-center gap-1"><Lightbulb size={14} /> AI Recommended Fix:</h4>
                    <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: task.solution.replace(/\*\*Short-term Action:\*\*/g, '<b>Short-term Action:</b>').replace(/\*\*Long-term Solution:\*\*/g, '<br/><b>Long-term Solution:</b>').replace(/\n/g, '<br/>') }} />
                  </div>

                  {task.user && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Citizen Details (Contact for Updates):</h4>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{task.user.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{task.user.email}</p>
                      {task.user.phone && <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">📞 {task.user.phone}</p>}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">Received on {new Date(task.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Evidence Section */}
                  <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">Resolution Evidence</h4>
                    <textarea
                      placeholder="Add notes about what you fixed..."
                      value={workerNotes[task.id] || ""}
                      onChange={(e) => setWorkerNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                      className="w-full text-sm p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg mb-3 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                      rows={2}
                    />

                    <div className="flex justify-between items-center">
                      <div>
                        <input
                          type="file"
                          id={`file-${task.id}`}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(task.id, e.target.files[0]);
                            }
                          }}
                        />
                        {!proofUrls[task.id] ? (
                          <label
                            htmlFor={`file-${task.id}`}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-200"
                          >
                            <ImageIcon size={16} className="text-slate-500 dark:text-slate-400" />
                            {uploadingImageId === task.id ? "Uploading..." : "Upload Photo Proof"}
                          </label>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <CheckCircle size={16} /> Photo Attached!
                            <button
                              onClick={() => setProofUrls(prev => { const newUrls = {...prev}; delete newUrls[task.id]; return newUrls; })}
                              className="text-red-500 hover:text-red-700 underline ml-2 text-xs cursor-pointer"
                            >
                              (Remove)
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleResolve(task.id)}
                        disabled={isResolving[task.id]}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition active:scale-[0.98] shadow-sm cursor-pointer ${
                          isResolving[task.id] 
                            ? 'bg-slate-400 cursor-not-allowed text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isResolving[task.id] ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Analyzing Image...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} /> Mark as Resolved
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-8 rounded-xl text-center border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle className="mx-auto w-12 h-12 mb-3 text-emerald-500" />
                  <h3 className="font-bold text-lg">All caught up!</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">You have no pending tasks right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Map & Resolved */}
          <div className="space-y-6 sticky top-6 h-fit">
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-[500px] z-10 relative">
              <WorkerMap tasks={pendingTasks} />
            </div>

            {/* Resolved Tasks summary */}
            {resolvedTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <CheckCircle className="text-emerald-600" size={20} />
                  Recently Resolved ({resolvedTasks.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resolvedTasks.map(task => (
                    <div key={task.id} className="text-sm p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span className="text-slate-800 dark:text-slate-200">#{task.id} - {task.region}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

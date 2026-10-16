"use client";

import { useEffect, useState, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker } from "react-leaflet";
import { Flame, Layers, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js/Webpack
if (typeof window !== "undefined") {
  const L = require("leaflet");
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

export interface ClusterHotspot {
  cluster_id: number;
  latitude: number;
  longitude: number;
  complaint_density: number;
}

function MapController({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

function Markers({ grievances }: { grievances: any[] }) {
  const map = useMap();
  return (
    <>
      {grievances.filter(g => g.latitude && g.longitude).map((g) => (
        <Marker 
          key={g.id} 
          position={[g.latitude, g.longitude]}
          eventHandlers={{ click: () => map.flyTo([g.latitude, g.longitude], 16, { duration: 1 }) }}
        >
          <Popup>
            <div className="text-sm font-sans">
              <strong className="block text-blue-600 mb-1">{g.category}</strong>
              <p className="mb-2 text-gray-800">{g.description}</p>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 font-semibold shadow-sm">
                Status: {g.status}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function ClusterHotspotsOverlay({ clusters }: { clusters: ClusterHotspot[] }) {
  const map = useMap();

  const getClusterColor = (density: number) => {
    if (density >= 10) return { stroke: "#dc2626", fill: "#ef4444" }; // Red (Critical)
    if (density >= 5) return { stroke: "#ea580c", fill: "#f97316" };  // Orange (High)
    if (density >= 3) return { stroke: "#ca8a04", fill: "#eab308" };  // Yellow (Moderate)
    return { stroke: "#2563eb", fill: "#3b82f6" };                    // Blue (Emerging)
  };

  return (
    <>
      {clusters.map((c) => {
        const colors = getClusterColor(c.complaint_density);
        return (
          <Fragment key={`cluster-${c.cluster_id}`}>
            {/* DBSCAN 1.5km Radius Influence Zone */}
            <Circle
              center={[c.latitude, c.longitude]}
              radius={1500}
              pathOptions={{
                color: colors.stroke,
                fillColor: colors.fill,
                fillOpacity: 0.16,
                weight: 2,
                dashArray: "5, 5"
              }}
            />
            {/* Centroid Core Marker */}
            <CircleMarker
              center={[c.latitude, c.longitude]}
              radius={Math.min(22, Math.max(12, 10 + c.complaint_density / 2))}
              pathOptions={{
                color: colors.stroke,
                fillColor: colors.fill,
                fillOpacity: 0.85,
                weight: 3
              }}
              eventHandlers={{
                click: () => map.flyTo([c.latitude, c.longitude], 15, { duration: 1.2 })
              }}
            >
              <Popup>
                <div className="text-sm font-sans min-w-[210px] p-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b pb-1.5 mb-2">
                    <Flame size={15} className="text-red-500 flex-shrink-0" />
                    <span>AI Cluster Hotspot #{c.cluster_id + 1}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    Detected by <strong>DBSCAN Haversine Clustering</strong> (1.5 km tolerance radius).
                  </p>
                  <div className="bg-red-50 text-red-700 font-semibold px-2.5 py-1 rounded-md text-xs mb-3 inline-block border border-red-200">
                    Density: {c.complaint_density} Active Complaints
                  </div>
                  <div className="text-xs text-gray-500 mb-3 font-mono">
                    Centroid: {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                  </div>
                  <button
                    onClick={() => map.flyTo([c.latitude, c.longitude], 16, { duration: 1 })}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-medium py-1.5 px-3 rounded shadow transition cursor-pointer"
                  >
                    Focus Centroid Area
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </>
  );
}

export default function AdminMap({ 
    focusedLocation, 
    grievances,
    clusterHotspots = []
}: { 
    focusedLocation: [number, number] | null, 
    grievances: any[],
    clusterHotspots?: ClusterHotspot[]
}) {
    const nagpurBounds: any = [[20.9, 78.8], [21.4, 79.4]];
    const [layerMode, setLayerMode] = useState<"both" | "clusters" | "markers">("both");

    return (
        <div className="relative w-full h-full">
            {/* Interactive Layer Toggle Overlay */}
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex gap-1 text-xs font-medium">
                <button
                    type="button"
                    onClick={() => setLayerMode("both")}
                    className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${layerMode === "both" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                    <Layers size={13} />
                    <span>Both ({grievances.length} / {clusterHotspots.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setLayerMode("clusters")}
                    className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${layerMode === "clusters" ? "bg-red-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                    <Flame size={13} />
                    <span>Clusters ({clusterHotspots.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setLayerMode("markers")}
                    className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${layerMode === "markers" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                    <MapPin size={13} />
                    <span>Pins ({grievances.length})</span>
                </button>
            </div>

            <MapContainer 
                center={focusedLocation || [21.1458, 79.0882]} 
                zoom={focusedLocation ? 16 : 12} 
                maxBounds={nagpurBounds}
                maxBoundsViscosity={1.0}
                minZoom={10}
                style={{ height: "100%", width: "100%", borderRadius: "10px" }}
            >
                <MapController center={focusedLocation} zoom={16} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {(layerMode === "both" || layerMode === "markers") && (
                    <Markers grievances={grievances} />
                )}
                {(layerMode === "both" || layerMode === "clusters") && (
                    <ClusterHotspotsOverlay clusters={clusterHotspots} />
                )}
            </MapContainer>
        </div>
    );
}


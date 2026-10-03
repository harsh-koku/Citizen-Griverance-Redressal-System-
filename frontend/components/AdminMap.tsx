"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

export default function AdminMap({ 
    focusedLocation, 
    grievances 
}: { 
    focusedLocation: [number, number] | null, 
    grievances: any[] 
}) {
    const nagpurBounds: any = [[20.9, 78.8], [21.4, 79.4]];

    return (
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
            <Markers grievances={grievances} />
        </MapContainer>
    );
}

"use client";

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

function Markers({ tasks }: { tasks: any[] }) {
  const map = useMap();
  return (
    <>
      {tasks.filter(g => g.latitude && g.longitude).map((g) => (
        <Marker 
          key={g.id} 
          position={[g.latitude, g.longitude]}
          eventHandlers={{ click: () => map.flyTo([g.latitude, g.longitude], 16, { duration: 1 }) }}
        >
          <Popup>
            <div className="text-sm text-gray-800 font-sans">
              <strong className="block text-orange-600 mb-1">#{g.id} - {g.category}</strong>
              <p className="mb-1 text-xs text-gray-500">{g.region}</p>
              <p className="text-gray-800">{g.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function WorkerMap({ 
    tasks 
}: { 
    tasks: any[] 
}) {
    const nagpurBounds: any = [[20.9, 78.8], [21.4, 79.4]];

    return (
        <MapContainer 
            center={[21.1458, 79.0882]} 
            zoom={12} 
            maxBounds={nagpurBounds}
            maxBoundsViscosity={1.0}
            minZoom={10}
            style={{ height: "100%", width: "100%", borderRadius: "8px", zIndex: 0 }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
            />
            <Markers tasks={tasks} />
        </MapContainer>
    );
}

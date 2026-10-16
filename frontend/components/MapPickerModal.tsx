"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

interface LocationData {
  lat: number;
  lng: number;
  region: string;
  state: string;
  city: string;
}

interface MapPickerModalProps {
  onClose: () => void;
  onSelect: (location: LocationData) => void;
}

function LocationMarker({ position, setPosition, setLocationDetails, setLoading }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchRegion(e.latlng.lat, e.latlng.lng);
    },
  });

  const fetchRegion = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const city = data.address.city || data.address.town || data.address.county || "";
      const state = data.address.state || "";
      const region = city || state || "Unknown Region";
      setLocationDetails({ region, city, state });
    } catch (err) {
      console.error(err);
      setLocationDetails({ region: "Unknown Region", city: "", state: "" });
    } finally {
      setLoading(false);
    }
  };

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPickerModal({ onClose, onSelect }: MapPickerModalProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [locationDetails, setLocationDetails] = useState({ region: "", state: "", city: "" });
  const [loading, setLoading] = useState(false);

  // Center roughly on Nagpur initially
  const initialCenter: [number, number] = [21.1458, 79.0882];
  const nagpurBounds: L.LatLngBoundsExpression = [[20.9, 78.8], [21.4, 79.4]];

  const handleConfirm = () => {
    if (position && locationDetails.region) {
      onSelect({ 
        lat: position.lat, 
        lng: position.lng, 
        region: locationDetails.region,
        state: locationDetails.state,
        city: locationDetails.city
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Location</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer">&times;</button>
        </div>
        
        <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800">
          <MapContainer 
            center={initialCenter} 
            zoom={12} 
            maxBounds={nagpurBounds}
            maxBoundsViscosity={1.0}
            minZoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} setLocationDetails={setLocationDetails} setLoading={setLoading} />
          </MapContainer>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex-1">
            {loading ? (
              <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">Fetching address...</span>
            ) : position ? (
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{locationDetails.region}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}</p>
              </div>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">Click on the map to drop a pin</span>
            )}
          </div>
          <button 
            onClick={handleConfirm}
            disabled={!position || loading}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors text-xs font-semibold cursor-pointer shadow-sm"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}

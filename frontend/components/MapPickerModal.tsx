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
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Select Location</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xl font-bold">&times;</button>
        </div>
        
        <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-700">
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1">
            {loading ? (
              <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Fetching address...</span>
            ) : position ? (
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{locationDetails.region}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}</p>
              </div>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">Click on the map to drop a pin</span>
            )}
          </div>
          <button 
            onClick={handleConfirm}
            disabled={!position || loading}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:dark:text-gray-400 disabled:cursor-not-allowed transition"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}

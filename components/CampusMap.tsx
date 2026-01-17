import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BUILDINGS, UIT_CENTER, Bin } from '../types';
import { findNearestBuilding, apiGetBins } from '../services/mockApi';
import { Navigation } from 'lucide-react';

const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface CampusMapProps {
    mode?: 'student' | 'collector';
}

const CampusMap: React.FC<CampusMapProps> = ({ mode = 'student' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);

  useEffect(() => {
    fixLeafletIcon();

    if (mapRef.current && !mapInstance.current) {
      const map = L.map(mapRef.current).setView([UIT_CENTER.lat, UIT_CENTER.lng], 17);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add Building Markers
      BUILDINGS.forEach(b => {
        L.marker([b.lat, b.lng])
         .addTo(map)
         .bindPopup(`<b>${b.name}</b><br>Center Point`);
      });

      mapInstance.current = map;
    }

    // Collector Mode Logic
    if (mode === 'collector' && mapInstance.current) {
        apiGetBins().then(fetchedBins => {
            setBins(fetchedBins);
            const fullBins = fetchedBins.filter(b => b.status === 'full');
            const emptyBins = fetchedBins.filter(b => b.status === 'empty');
            
            // Plot Full Bins (Red)
            fullBins.forEach(b => {
                L.circleMarker([b.lat, b.lng], { color: '#ef4444', radius: 8, fillOpacity: 0.8 })
                 .addTo(mapInstance.current!)
                 .bindPopup(`<b style="color:red">FULL: ${b.location}</b>`);
            });

            // Plot Empty Bins (Green)
            emptyBins.forEach(b => {
                L.circleMarker([b.lat, b.lng], { color: '#4ade80', radius: 5, fillOpacity: 0.4 })
                 .addTo(mapInstance.current!)
                 .bindPopup(`Empty: ${b.location}`);
            });

            // Draw Route Polyline (Simple connecting of full bins)
            if (fullBins.length > 1) {
                const latlngs = fullBins.map(b => [b.lat, b.lng] as L.LatLngExpression);
                L.polyline(latlngs, { color: '#ef4444', weight: 4, dashArray: '10, 10' }).addTo(mapInstance.current!);
            }
        });
    }

    return () => {
      // Cleanup logic if needed, but we keep map instance alive usually in SPA 
      // or remove strictly on unmount. 
      // Not removing mapInstance here to prevent re-init issues in strict mode unless explicitly handled.
    };
  }, [mode]);

  const handleFindNearest = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      
      if (mapInstance.current) {
        L.circleMarker([latitude, longitude], { color: '#22c55e', radius: 8 }).addTo(mapInstance.current).bindPopup("You").openPopup();
        const nearest = findNearestBuilding(latitude, longitude);
        mapInstance.current.flyTo([nearest.lat, nearest.lng], 19);
      }
    });
  };

  return (
    <div className="relative h-full w-full min-h-[500px]">
        <div ref={mapRef} className="h-full w-full z-0" />
        
        {mode === 'student' && (
            <button 
                onClick={handleFindNearest}
                className="absolute bottom-6 right-6 z-[400] bg-uit-neon text-uit-dark font-bold p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
            >
                <Navigation size={24} />
                <span className="hidden md:inline">Find Nearest Bin</span>
            </button>
        )}
        
        {mode === 'collector' && (
             <div className="absolute top-4 right-4 z-[400] bg-black/80 text-white p-3 rounded-lg text-xs">
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Full Bin (Pickup)</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Empty Bin</div>
                <div className="flex items-center gap-2"><span className="w-8 h-1 bg-red-500 border-dashed border-white"></span> Suggested Route</div>
             </div>
        )}
    </div>
  );
};

export default CampusMap;
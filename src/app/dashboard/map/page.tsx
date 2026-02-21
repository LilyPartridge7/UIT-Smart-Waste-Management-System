"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [bins, setBins] = useState<any[]>([]);
  const [mapObj, setMapObj] = useState<any>(null);
  const [myLocation, setMyLocation] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch bins from PHP API
    fetch('http://localhost/uit_smart_waste_management/api/fetch_map_bins.php')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setBins(data.bins);
        }
      })
      .catch(error => {
        console.error("Failed to fetch bins:", error);
      });

    // 2. Load Google Maps JS Script dynamically
    if (!window.google) {
      const script = document.createElement('script');
      // NOTE: For full functionality, the exact API Key must be supplied in a real environment.
      // This allows initialization using the generic callback without billing enabled for dev.
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap`;
      script.async = true;
      script.defer = true;
      window.initMap = initGoogleMap;
      document.head.appendChild(script);
    } else {
      initGoogleMap();
    }
  }, []);

  function initGoogleMap() {
    if (!mapRef.current) return;

    // Center Map on UIT Yangon Hlaing Campus 
    const uitCenter = { lat: 16.8398, lng: 96.1287 };
    const gMap = new window.google.maps.Map(mapRef.current, {
      zoom: 17,
      center: uitCenter,
      mapTypeId: 'satellite', // Better for campus viewing
    });

    setMapObj(gMap);
  }

  // Effect to add markers once map and bins are ready
  useEffect(() => {
    if (!mapObj || bins.length === 0) return;

    bins.forEach((bin) => {
      const isFull = bin.status === 'Full';
      // Use standard Google map markers (Red for full, Green for available)
      const iconUrl = isFull
        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(bin.lat), lng: parseFloat(bin.lng) },
        map: mapObj,
        title: `Bin ${bin.id} - ${bin.status}`,
        icon: iconUrl
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div><strong>Bin #${bin.id}</strong><br/>Status: <span style="color: ${isFull ? 'red' : 'green'}">${bin.status}</span></div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(mapObj, marker);
      });
    });
  }, [mapObj, bins]);

  // --- Haversine Formula for Nearest Bin ---
  function haversineDistance(coords1: any, coords2: any) {
    function toRad(x: number) { return x * Math.PI / 180; }

    const R = 6371; // Earth radius in km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const findNearestBin = () => {
    if (navigator.geolocation && bins.length > 0 && mapObj) {
      navigator.geolocation.getCurrentPosition(position => {
        const userLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMyLocation(userLoc);

        // Add user marker
        new window.google.maps.Marker({
          position: userLoc,
          map: mapObj,
          title: "Your Location",
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });

        let nearest = null;
        let minDistance = Infinity;

        // Find nearest NON-FULL bin (or nearest overall if user prefers)
        // Here we find nearest overall, but highlight if it's full.
        bins.forEach(bin => {
          const binLoc = { lat: bin.lat, lng: bin.lng };
          const distance = haversineDistance(userLoc, binLoc);

          // Only suggest Functional bins for throwing waste
          if (bin.status !== 'Full' && distance < minDistance) {
            minDistance = distance;
            nearest = bin;
          }
        });

        if (nearest) {
          const nearestBin = nearest as any;
          alert(`The nearest available bin is ID: ${nearestBin.id} at a distance of ${(minDistance * 1000).toFixed(0)} meters.`);
          mapObj.panTo({ lat: nearestBin.lat, lng: nearestBin.lng });
          mapObj.setZoom(19);
        } else {
          alert("No available bins found nearby.");
        }
      }, () => {
        alert("Location access denied or unavailable.");
      });
    } else {
      alert("Geolocation not supported or map not loaded.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8 text-primary" />
            Campus Bin Map
          </h2>
          <p className="text-muted-foreground">Live interactive map of UIT smart bins.</p>
        </div>
        <Button onClick={findNearestBin} className="bg-primary hover:bg-primary/90 gap-2">
          <Navigation className="w-4 h-4" />
          Find Nearest Bin (GPS)
        </Button>
      </div>

      <Card className="bg-card/50 border-border/50 overflow-hidden shadow-2xl">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Google Maps Integration</CardTitle>
              <CardDescription>Red markers indicate full bins. Green markers are functional.</CardDescription>
            </div>

            <div className="flex gap-4 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full" /> Full</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full" /> Available</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            className="w-full h-[600px] bg-slate-100 flex items-center justify-center text-slate-400"
          >
            Initializing Map...
          </div>
        </CardContent>
      </Card>

      {/* Typescript declarations for Google window object */}
    </div>
  );
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';

interface VehicleLiveMapProps {
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  registrationNumber: string;
  lastUpdate: string;
}

export function VehicleLiveMap({
  latitude,
  longitude,
  speed,
  heading,
  registrationNumber,
  lastUpdate,
}: VehicleLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Update or create marker
    const truckIcon = L.divIcon({
      className: 'custom-truck-marker',
      html: `
        <div style="
          width: 36px; height: 36px;
          background: hsl(var(--primary));
          border: 3px solid white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: rotate(${heading || 0}deg);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L4 20l8-6 8 6z"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(truckIcon);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: truckIcon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`<b>${registrationNumber}</b><br/>Speed: ${speed ?? 0} km/h`);
    }

    mapInstanceRef.current!.setView([latitude, longitude], mapInstanceRef.current!.getZoom());

    return () => {};
  }, [latitude, longitude, heading, speed, registrationNumber]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      '_blank'
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Live Location
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" />
              Auto-refresh 30s
            </Badge>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openGoogleMaps}>
              <Navigation className="h-3.5 w-3.5" />
              Navigate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-[300px] rounded-lg border border-border overflow-hidden"
        />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
          <span>Last update: {lastUpdate}</span>
        </div>
      </CardContent>
    </Card>
  );
}

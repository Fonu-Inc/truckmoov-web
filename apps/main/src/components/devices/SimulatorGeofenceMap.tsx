import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shadcn/card';
import { MapPin } from 'lucide-react';
import type { GeofenceZone, GeofenceAlert } from '@/hooks/useMQTTSimulator';

interface SimulatorGeofenceMapProps {
  zones: GeofenceZone[];
  alerts: GeofenceAlert[];
}

export const SimulatorGeofenceMap: React.FC<SimulatorGeofenceMapProps> = ({ zones, alerts }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const geofenceCirclesRef = useRef<Map<string, L.Circle>>(new Map());
  const alertLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = zones.length
      ? [zones[0].center.lat, zones[0].center.lng]
      : [6.5244, 3.3792]; // Lagos fallback

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    alertLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      alertLayerRef.current = null;
      geofenceCirclesRef.current.clear();
    };
  }, [zones]);

  // Render geofence zones
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    geofenceCirclesRef.current.forEach((circle) => circle.remove());
    geofenceCirclesRef.current.clear();

    zones.forEach((zone) => {
      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radius,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: zone.type === 'restricted' ? '5, 10' : undefined,
      }).addTo(map);

      circle.bindPopup(
        `<div style="min-width: 150px; padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${zone.name}</div>
          <div style="font-size: 12px; color: #666;">
            <div>Type: ${zone.type}</div>
            <div>Radius: ${zone.radius}m</div>
          </div>
        </div>`
      );

      geofenceCirclesRef.current.set(zone.id, circle);
    });

    if (zones.length > 0) {
      const bounds = L.latLngBounds(
        zones.map((z) => [z.center.lat, z.center.lng] as [number, number])
      );
      map.fitBounds(bounds.pad(0.3));
    }
  }, [zones]);

  // Render latest alerts as markers
  useEffect(() => {
    if (!mapRef.current || !alertLayerRef.current) return;

    const layer = alertLayerRef.current;
    layer.clearLayers();

    alerts.forEach((alert) => {
      const marker = L.circleMarker([alert.latitude, alert.longitude], {
        radius: 6,
        color: alert.geofenceType === 'restricted' ? '#ef4444' : '#3b82f6',
        fillColor: alert.alertType === 'entry' ? '#22c55e' : '#f59e0b',
        fillOpacity: 0.9,
        weight: 2,
      });

      marker.bindTooltip(
        `${alert.deviceName} ${alert.alertType === 'entry' ? 'entered' : 'exited'} ${alert.geofenceName}`,
        { direction: 'top' }
      );

      marker.addTo(layer);
    });
  }, [alerts]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          Geofence Map
        </CardTitle>
        <CardDescription>Visualize zones and recent alerts</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative h-[320px] rounded-md overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
};

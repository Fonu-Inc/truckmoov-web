import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Locate } from 'lucide-react';
import type { SimulatedDevice } from '@/hooks/useMQTTSimulator';

interface SimulatorDeviceMapProps {
  devices: SimulatedDevice[];
  selectedDeviceId?: string | null;
  onSelectDevice?: (deviceId: string) => void;
}

const statusColors: Record<SimulatedDevice['status'], string> = {
  disconnected: '#6b7280',
  connecting: '#f59e0b',
  connected: '#22c55e',
  error: '#ef4444',
};

const createDeviceIcon = (device: SimulatedDevice, isSelected: boolean) => {
  const color = statusColors[device.status];
  const size = isSelected ? 36 : 28;
  const rotation = device.heading || 0;

  return L.divIcon({
    className: 'custom-sim-device-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.7)'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
        transition: transform 0.3s ease;
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4 20h16L12 2z"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const getPopupContent = (device: SimulatedDevice) => `
  <div style="min-width: 180px; padding: 6px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span style="font-weight: 600; font-size: 12px;">${device.imei}</span>
      <span style="background: ${statusColors[device.status]}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
        ${device.status}
      </span>
    </div>
    <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
      ${device.manufacturer} ${device.model}
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
      <div>🚗 ${device.speed.toFixed(0)} km/h</div>
      <div>⛽ ${device.fuel.toFixed(0)}%</div>
      <div>🔋 ${device.battery.toFixed(1)}V</div>
      <div>📨 ${device.messageCount}</div>
    </div>
  </div>
`;

export const SimulatorDeviceMap: React.FC<SimulatorDeviceMapProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const connectedCount = devices.filter((d) => d.status === 'connected').length;
  const defaultCenter: [number, number] =
    devices.length > 0
      ? [devices[0].latitude, devices[0].longitude]
      : [6.5244, 3.3792];

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Sync markers with devices
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const existingIds = new Set(markersRef.current.keys());
    const currentIds = new Set(devices.map((d) => d.id));

    // Remove old markers
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    // Upsert markers
    devices.forEach((device) => {
      const isSelected = device.id === selectedDeviceId;
      const icon = createDeviceIcon(device, isSelected);
      const existingMarker = markersRef.current.get(device.id);

      if (existingMarker) {
        existingMarker.setLatLng([device.latitude, device.longitude]);
        existingMarker.setIcon(icon);
        existingMarker.getPopup()?.setContent(getPopupContent(device));
      } else {
        const marker = L.marker([device.latitude, device.longitude], { icon })
          .addTo(map)
          .bindPopup(getPopupContent(device));

        marker.on('click', () => {
          onSelectDevice?.(device.id);
        });

        markersRef.current.set(device.id, marker);
      }
    });

    // Fit bounds when devices exist
    if (devices.length > 0) {
      const bounds = L.latLngBounds(
        devices.map((d) => [d.latitude, d.longitude] as [number, number])
      );
      map.fitBounds(bounds.pad(0.2), { maxZoom: 14 });
    }
  }, [devices, selectedDeviceId, onSelectDevice]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Locate className="h-4 w-4 text-primary" />
            Live Device Map
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {connectedCount}/{devices.length} online
          </Badge>
        </div>
        <CardDescription className="text-xs">Real-time location of every simulated device on the MQTT bridge</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative h-[320px] rounded-md overflow-hidden border">
          <div ref={mapContainerRef} className="w-full h-full" />
          {devices.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
              Add devices to see them on the map
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

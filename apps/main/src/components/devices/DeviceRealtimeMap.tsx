import { formatTime } from "@truckmoov/app-core/utils/time-utils";
import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { 
  AlertTriangle,
  MapPin,
  Maximize2,
  Route,
  Shield
} from 'lucide-react';
import { DeviceWithTelemetry } from '@/hooks/useDeviceTelemetry';
import 'leaflet/dist/leaflet.css';

export interface GeofenceZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  color: string;
  type: 'depot' | 'delivery' | 'restricted' | 'customer' | 'custom';
  isActive: boolean;
}

interface DeviceRealtimeMapProps {
  devices: DeviceWithTelemetry[];
  selectedDevice?: string | null;
  onSelectDevice?: (deviceId: string) => void;
  showTrail?: boolean;
  className?: string;
  trailHistory?: Map<string, Array<{ lat: number; lng: number; timestamp: string }>>;
  geofences?: GeofenceZone[];
  showGeofences?: boolean;
  onGeofenceAlert?: (deviceId: string, geofenceName: string, alertType: 'enter' | 'exit') => void;
}

// Create custom vehicle icons based on status
const createDeviceIcon = (status: string, heading?: number) => {
  const colors: Record<string, string> = {
    active: '#22c55e',
    configured: '#3b82f6',
    assigned: '#8b5cf6',
    registered: '#f59e0b',
    faulty: '#ef4444',
    decommissioned: '#6b7280',
  };

  const color = colors[status] || '#6b7280';
  const rotation = heading || 0;

  return L.divIcon({
    className: 'custom-device-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4 20h16L12 2z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Generate popup content as HTML string
const getPopupContent = (device: DeviceWithTelemetry) => {
  const statusColors: Record<string, string> = {
    active: '#22c55e',
    configured: '#3b82f6',
    assigned: '#8b5cf6',
    registered: '#f59e0b',
    faulty: '#ef4444',
    decommissioned: '#6b7280',
  };
  const color = statusColors[device.status] || '#6b7280';

  return `
    <div style="min-width: 200px; padding: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600;">${device.imei}</span>
        <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
          ${device.status}
        </span>
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
        ${device.manufacturer} ${device.model || ''}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        ${device.speed !== undefined ? `<div>🚗 ${device.speed?.toFixed(0)} km/h</div>` : ''}
        ${device.fuel_level !== undefined ? `<div>⛽ ${device.fuel_level?.toFixed(0)}%</div>` : ''}
        ${device.battery_level !== undefined ? `<div>🔋 ${device.battery_level}%</div>` : ''}
        ${device.signal_strength !== undefined ? `<div>📶 ${device.signal_strength}%</div>` : ''}
      </div>
      ${device.last_seen ? `<div style="font-size: 11px; color: #999; margin-top: 8px;">Last seen: ${formatTime(device.last_seen)}</div>` : ''}
    </div>
  `;
};

// Trail colors for different devices
const trailColors = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

export function DeviceRealtimeMap({
  devices,
  selectedDevice,
  onSelectDevice,
  showTrail = false,
  className = '',
  trailHistory,
  geofences = [],
  showGeofences = true,
  onGeofenceAlert,
}: DeviceRealtimeMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trailsVisible, setTrailsVisible] = useState(true);
  const [geofencesVisible, setGeofencesVisible] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const trailsRef = useRef<Map<string, L.Polyline>>(new Map());
  const geofenceCirclesRef = useRef<Map<string, L.Circle>>(new Map());
  
  const validDevices = devices.filter(d => d.latitude && d.longitude);
  const defaultCenter: [number, number] = validDevices.length > 0
    ? [validDevices[0].latitude!, validDevices[0].longitude!]
    : [6.5244, 3.3792]; // Lagos, Nigeria

  const activeCount = devices.filter(d => d.status === 'active').length;
  const faultyCount = devices.filter(d => d.status === 'faulty').length;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update geofence circles
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear old geofence circles
    geofenceCirclesRef.current.forEach((circle) => {
      circle.remove();
    });
    geofenceCirclesRef.current.clear();

    if (!geofencesVisible || !showGeofences) return;

    // Create new geofence circles
    geofences.forEach((geofence) => {
      if (!geofence.isActive) return;

      const circle = L.circle(geofence.center, {
        radius: geofence.radius,
        color: geofence.color,
        fillColor: geofence.color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: geofence.type === 'restricted' ? '5, 10' : undefined,
      }).addTo(map);

      // Add popup with geofence info
      circle.bindPopup(`
        <div style="min-width: 150px; padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${geofence.name}</div>
          <div style="font-size: 12px; color: #666;">
            <div>Type: ${geofence.type}</div>
            <div>Radius: ${geofence.radius}m</div>
          </div>
        </div>
      `);

      geofenceCirclesRef.current.set(geofence.id, circle);
    });
  }, [geofences, geofencesVisible, showGeofences]);

  // Update trails when history changes
  useEffect(() => {
    if (!mapRef.current || !trailHistory || !trailsVisible) return;

    const map = mapRef.current;
    const deviceIds = Array.from(trailHistory.keys());

    // Clear old trails
    trailsRef.current.forEach((polyline) => {
      polyline.remove();
    });
    trailsRef.current.clear();

    // Create new trails
    deviceIds.forEach((deviceId, index) => {
      const history = trailHistory.get(deviceId);
      if (!history || history.length < 2) return;

      const device = devices.find(d => d.id === deviceId);
      const isSelected = selectedDevice === deviceId;
      const color = trailColors[index % trailColors.length];

      const latLngs = history.map(p => [p.lat, p.lng] as [number, number]);
      
      const polyline = L.polyline(latLngs, {
        color: color,
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 0.9 : 0.6,
        dashArray: isSelected ? undefined : '5, 10',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Add tooltip on hover
      polyline.bindTooltip(`${device?.imei || deviceId} trail (${history.length} points)`, {
        sticky: true,
        className: 'trail-tooltip',
      });

      trailsRef.current.set(deviceId, polyline);
    });
  }, [trailHistory, trailsVisible, selectedDevice, devices]);

  // Update markers when devices change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const existingMarkerIds = new Set(markersRef.current.keys());
    const currentDeviceIds = new Set(validDevices.map(d => d.id));

    // Remove markers for devices no longer present
    existingMarkerIds.forEach(id => {
      if (!currentDeviceIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    });

    // Add or update markers
    validDevices.forEach(device => {
      const existingMarker = markersRef.current.get(device.id);
      const position: [number, number] = [device.latitude!, device.longitude!];
      
      if (existingMarker) {
        // Update position
        existingMarker.setLatLng(position);
        existingMarker.setIcon(createDeviceIcon(device.status, device.heading));
        existingMarker.getPopup()?.setContent(getPopupContent(device));
      } else {
        // Create new marker
        const marker = L.marker(position, {
          icon: createDeviceIcon(device.status, device.heading)
        })
          .addTo(map)
          .bindPopup(getPopupContent(device));

        marker.on('click', () => {
          onSelectDevice?.(device.id);
        });

        markersRef.current.set(device.id, marker);
      }
    });

    // Fit bounds if there are devices
    if (validDevices.length > 0) {
      const bounds = L.latLngBounds(
        validDevices.map(d => [d.latitude!, d.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [validDevices, onSelectDevice]);

  // Toggle geofence visibility
  const toggleGeofences = () => {
    setGeofencesVisible(prev => {
      const newValue = !prev;
      geofenceCirclesRef.current.forEach((circle) => {
        if (newValue) {
          circle.addTo(mapRef.current!);
        } else {
          circle.remove();
        }
      });
      return newValue;
    });
  };

  // Toggle trail visibility
  const toggleTrails = () => {
    setTrailsVisible(prev => {
      const newValue = !prev;
      trailsRef.current.forEach((polyline) => {
        if (newValue) {
          polyline.addTo(mapRef.current!);
        } else {
          polyline.remove();
        }
      });
      return newValue;
    });
  };

  // Handle fullscreen changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  return (
    <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Real-time Device Tracking
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{activeCount} Active</span>
              </div>
              {faultyCount > 0 && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{faultyCount} Faulty</span>
                </div>
              )}
            </div>
            <Button
              variant={geofencesVisible ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleGeofences}
              className="gap-1"
            >
              <Shield className="h-4 w-4" />
              Geofences
            </Button>
            <Button
              variant={trailsVisible ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleTrails}
              className="gap-1"
            >
              <Route className="h-4 w-4" />
              Trails
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainerRef}
          className={isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[500px]'}
          style={{ width: '100%' }}
        />
      </CardContent>
    </Card>
  );
}
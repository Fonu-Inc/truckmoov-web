import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Separator } from '@/components/shadcn/separator';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  CornerUpRight,
  ArrowUp,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';
type RouteDirection = any;
type RouteWaypoint = { lat: number; lng: number; name?: string };
import { cn } from '@/lib/utils';

interface MapboxRouteMapProps {
  waypoints: RouteWaypoint[];
  mapboxToken: string;
  className?: string;
  showDirections?: boolean;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

function getManeuverIcon(type: string, modifier?: string) {
  switch (type) {
    case 'turn':
      return modifier?.includes('left') ? 
        <CornerDownRight className="h-4 w-4 rotate-180" /> : 
        <CornerDownRight className="h-4 w-4" />;
    case 'merge':
    case 'fork':
      return modifier?.includes('left') ? 
        <CornerUpRight className="h-4 w-4 rotate-180" /> : 
        <CornerUpRight className="h-4 w-4" />;
    case 'roundabout':
      return <RotateCcw className="h-4 w-4" />;
    case 'arrive':
      return <MapPin className="h-4 w-4 text-green-500" />;
    case 'depart':
      return <Navigation className="h-4 w-4 text-blue-500" />;
    default:
      return <ArrowUp className="h-4 w-4" />;
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function MapboxRouteMap({
  waypoints,
  mapboxToken,
  className,
  showDirections = true,
  onRouteCalculated,
}: MapboxRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const getDirections = async (..._args: any[]) => {};
  const isLoading = false;
  const routeData: any = null;
  const clearRoute = () => {};

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [28.0473, -26.2041], // Johannesburg default
      zoom: 10,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.FullscreenControl(),
      'top-right'
    );

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add waypoint markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    waypoints.forEach((wp, index) => {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-lg';
      el.style.backgroundColor = index === 0 ? '#22c55e' : index === waypoints.length - 1 ? '#ef4444' : '#3b82f6';
      el.textContent = String(index + 1);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([wp.lng, wp.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2"><strong>${wp.name || `Stop ${index + 1}`}</strong></div>`
          )
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have waypoints
    if (waypoints.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach(wp => bounds.extend([wp.lng, wp.lat]));
      map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
    }
  }, [waypoints]);

  // Draw route on map
  useEffect(() => {
    if (!map.current || !routeData) return;

    const mapInstance = map.current;

    // Wait for map style to load
    const addRoute = () => {
      // Remove existing route layer and source
      if (mapInstance.getLayer('route')) {
        mapInstance.removeLayer('route');
      }
      if (mapInstance.getLayer('route-outline')) {
        mapInstance.removeLayer('route-outline');
      }
      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }

      // Add route source
      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: routeData.route.geometry.coordinates,
          },
        },
      });

      // Add route outline
      mapInstance.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1e3a5f',
          'line-width': 10,
        },
      });

      // Add route line
      mapInstance.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
        },
      });

      // Fit bounds to route
      const coordinates = routeData.route.geometry.coordinates;
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
      mapInstance.fitBounds(bounds, { padding: 80, duration: 1000 });

      onRouteCalculated?.(routeData.route.distance, routeData.route.duration);
    };

    if (mapInstance.isStyleLoaded()) {
      addRoute();
    } else {
      mapInstance.on('style.load', addRoute);
    }
  }, [routeData, onRouteCalculated]);

  // Calculate route when waypoints change
  const calculateRoute = useCallback(async () => {
    if (waypoints.length >= 2) {
      await getDirections(waypoints);
    }
  }, [waypoints, getDirections]);

  const handleStepClick = (index: number, direction: RouteDirection) => {
    setActiveStep(index);
    if (map.current) {
      map.current.flyTo({
        center: direction.location,
        zoom: 16,
        duration: 1000,
      });
    }
  };

  return (
    <div className={cn("relative flex gap-4", className)}>
      {/* Map */}
      <div className={cn(
        "relative rounded-lg overflow-hidden border border-border shadow-lg transition-all duration-300",
        isExpanded ? "flex-1" : showDirections ? "w-2/3" : "flex-1"
      )}>
        <div ref={mapContainer} className="w-full h-[500px]" />
        
        {/* Map controls overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={calculateRoute}
            disabled={isLoading || waypoints.length < 2}
            className="shadow-lg"
          >
            <Navigation className={cn("h-4 w-4 mr-2", isLoading && "animate-pulse")} />
            {isLoading ? 'Calculating...' : 'Get Directions'}
          </Button>
          {routeData && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearRoute}
              className="shadow-lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Route summary */}
        {routeData && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm px-3 py-1.5">
              <Navigation className="h-4 w-4 mr-2 text-primary" />
              {formatDistance(routeData.route.distance)}
            </Badge>
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm px-3 py-1.5">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              {formatDuration(routeData.route.duration)}
            </Badge>
          </div>
        )}

        {/* Expand/collapse button */}
        {showDirections && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 bg-background/80 backdrop-blur-sm shadow-lg"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Directions panel */}
      {showDirections && !isExpanded && routeData && (
        <Card className="w-1/3 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Turn-by-Turn Directions
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{routeData.directions.length} steps</Badge>
              <Badge variant="outline">{formatDistance(routeData.route.distance)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-1">
                {routeData.directions.map((direction, index) => (
                  <button
                    key={`${direction.legIndex}-${direction.stepIndex}`}
                    onClick={() => handleStepClick(index, direction)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all",
                      activeStep === index 
                        ? "bg-primary/20 border border-primary/30" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        activeStep === index ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {getManeuverIcon(direction.type, direction.modifier)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {direction.instruction}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatDistance(direction.distance)}</span>
                          <span>•</span>
                          <span>{formatDuration(direction.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

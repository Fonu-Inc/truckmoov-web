import { useState } from 'react';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteDirection {
  legIndex: number;
  stepIndex: number;
  instruction: string;
  type: string;
  modifier?: string;
  distance: number;
  duration: number;
  name: string;
  location: [number, number];
}

export interface RouteData {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
  legs: {
    legIndex: number;
    distance: number;
    duration: number;
    summary: string;
  }[];
}

export interface MapboxRouteResult {
  route: RouteData;
  directions: RouteDirection[];
  waypoints: any[];
}

export function useMapboxDirections() {
  const isLoading = false;
  const routeData: MapboxRouteResult | null = null;

  const getDirections = async (
    _waypoints: RouteWaypoint[],
    _profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving'
  ): Promise<MapboxRouteResult | null> => null;

  const clearRoute = () => {};

  return {
    getDirections,
    isLoading,
    routeData,
    clearRoute,
  };
}

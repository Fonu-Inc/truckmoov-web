import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Waypoint {
  lat: number;
  lng: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { waypoints, profile = 'driving' } = await req.json();

    if (!waypoints || waypoints.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 waypoints are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!MAPBOX_TOKEN) {
      throw new Error('MAPBOX_PUBLIC_TOKEN is not configured');
    }

    // Build coordinates string for Mapbox API
    const coordinates = waypoints
      .map((wp: Waypoint) => `${wp.lng},${wp.lat}`)
      .join(';');

    // Call Mapbox Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?` +
      `geometries=geojson&steps=true&overview=full&annotations=duration,distance,speed&access_token=${MAPBOX_TOKEN}`;

    console.log('Fetching route from Mapbox...');
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', response.status, errorText);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No route found between the specified waypoints' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const route = data.routes[0];
    const legs = route.legs;

    // Extract turn-by-turn directions
    const directions = legs.flatMap((leg: any, legIndex: number) => 
      leg.steps.map((step: any, stepIndex: number) => ({
        legIndex,
        stepIndex,
        instruction: step.maneuver.instruction,
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
        distance: step.distance,
        duration: step.duration,
        name: step.name || '',
        location: step.maneuver.location,
      }))
    );

    // Calculate total stats
    const totalDistance = legs.reduce((sum: number, leg: any) => sum + leg.distance, 0);
    const totalDuration = legs.reduce((sum: number, leg: any) => sum + leg.duration, 0);

    return new Response(
      JSON.stringify({
        success: true,
        route: {
          geometry: route.geometry,
          distance: totalDistance,
          duration: totalDuration,
          legs: legs.map((leg: any, index: number) => ({
            legIndex: index,
            distance: leg.distance,
            duration: leg.duration,
            summary: leg.summary,
          })),
        },
        directions,
        waypoints: data.waypoints,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mapbox-directions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

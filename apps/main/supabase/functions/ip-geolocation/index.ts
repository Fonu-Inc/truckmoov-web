import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  threat: {
    isTor: boolean;
    isProxy: boolean;
    isVpn: boolean;
    isDatacenter: boolean;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

// Free IP geolocation using ip-api.com (no API key required for non-commercial use)
async function getIPGeolocation(ip: string): Promise<GeoLocation | null> {
  try {
    // Using ip-api.com free tier (45 requests per minute limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,hosting,proxy`);
    
    if (!response.ok) {
      console.error('IP API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.error('IP API returned failure:', data.message);
      return null;
    }

    // Determine threat level based on various factors
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const isDatacenter = data.hosting === true;
    const isProxy = data.proxy === true;
    
    // Known high-risk country codes (this is simplified, real implementation would be more nuanced)
    const highRiskCountries = ['RU', 'CN', 'KP', 'IR'];
    const mediumRiskCountries = ['UA', 'BY', 'VN'];
    
    if (isProxy || isDatacenter) {
      threatLevel = 'medium';
    }
    if (highRiskCountries.includes(data.countryCode)) {
      threatLevel = threatLevel === 'medium' ? 'high' : 'medium';
    } else if (mediumRiskCountries.includes(data.countryCode)) {
      threatLevel = threatLevel === 'low' ? 'medium' : threatLevel;
    }

    return {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      region: data.regionName || data.region || 'Unknown',
      city: data.city || 'Unknown',
      isp: data.isp || 'Unknown',
      org: data.org || 'Unknown',
      threat: {
        isTor: false, // Would need additional service to detect
        isProxy: isProxy,
        isVpn: isProxy, // Simplified - proxies often include VPNs
        isDatacenter: isDatacenter,
        threatLevel
      }
    };
  } catch (error) {
    console.error('Error fetching IP geolocation:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip_address } = await req.json();

    if (!ip_address) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching geolocation for IP:', ip_address);

    const geolocation = await getIPGeolocation(ip_address);

    if (!geolocation) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not fetch geolocation data',
          ip_address,
          geolocation: {
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            isp: 'Unknown',
            org: 'Unknown',
            threat: {
              isTor: false,
              isProxy: false,
              isVpn: false,
              isDatacenter: false,
              threatLevel: 'low'
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Geolocation result:', { ip_address, country: geolocation.country, threatLevel: geolocation.threat.threatLevel });

    return new Response(
      JSON.stringify({ ip_address, geolocation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ip-geolocation function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelemetryData {
  device_id: string;
  speed: number;
  harsh_braking: boolean;
  harsh_acceleration: boolean;
  harsh_cornering: boolean;
  timestamp: string;
}

interface BehaviorEvent {
  event_type: string;
  severity: string;
  created_at: string;
  speed: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { device_id, driver_id, driver_name, tenant_id } = await req.json();
    
    if (!device_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'device_id and tenant_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch last 4 hours of telemetry data
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: telemetryData, error: telemetryError } = await supabase
      .from('device_telemetry')
      .select('*')
      .eq('device_id', device_id)
      .gte('timestamp', fourHoursAgo)
      .order('timestamp', { ascending: true });

    if (telemetryError) {
      console.error('Error fetching telemetry:', telemetryError);
      throw telemetryError;
    }

    // Fetch behavior events
    const { data: behaviorEvents, error: behaviorError } = await supabase
      .from('driver_behavior_events')
      .select('*')
      .eq('device_id', device_id)
      .gte('created_at', fourHoursAgo)
      .order('created_at', { ascending: true });

    if (behaviorError) {
      console.error('Error fetching behavior events:', behaviorError);
      throw behaviorError;
    }

    // Calculate driving duration
    let drivingDurationMinutes = 0;
    if (telemetryData && telemetryData.length > 1) {
      const firstTimestamp = new Date(telemetryData[0].timestamp).getTime();
      const lastTimestamp = new Date(telemetryData[telemetryData.length - 1].timestamp).getTime();
      drivingDurationMinutes = Math.round((lastTimestamp - firstTimestamp) / (1000 * 60));
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      driving_duration_minutes: drivingDurationMinutes,
      total_telemetry_points: telemetryData?.length || 0,
      behavior_events: behaviorEvents?.length || 0,
      harsh_braking_count: telemetryData?.filter((t: TelemetryData) => t.harsh_braking).length || 0,
      harsh_acceleration_count: telemetryData?.filter((t: TelemetryData) => t.harsh_acceleration).length || 0,
      harsh_cornering_count: telemetryData?.filter((t: TelemetryData) => t.harsh_cornering).length || 0,
      average_speed: telemetryData?.length 
        ? telemetryData.reduce((sum: number, t: TelemetryData) => sum + (t.speed || 0), 0) / telemetryData.length 
        : 0,
      speed_variations: calculateSpeedVariation(telemetryData || []),
      severe_events: behaviorEvents?.filter((e: BehaviorEvent) => e.severity === 'high' || e.severity === 'critical').length || 0,
      time_since_last_break: calculateTimeSinceLastBreak(telemetryData || []),
    };

    // Call Lovable AI for fatigue analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a driver fatigue detection AI assistant. Analyze driving patterns and behavior data to assess driver fatigue levels.
            
Based on the provided data, you must return a JSON object with these exact fields:
- fatigue_score: number from 0-10 (0=alert, 10=severely fatigued)
- risk_level: "low", "medium", "high", or "critical"
- indicators: array of detected fatigue indicators
- recommendations: array of actionable recommendations
- analysis: brief explanation of your assessment

Consider these fatigue indicators:
- Extended driving duration (>2 hours without break = concerning, >4 hours = critical)
- Erratic speed patterns and frequent speed variations
- Increased harsh braking/acceleration (reaction time deterioration)
- Harsh cornering (reduced motor control)
- Time of day (night driving increases fatigue risk)
- Pattern degradation over time

Return ONLY valid JSON, no markdown.`
          },
          {
            role: 'user',
            content: `Analyze this driving data for fatigue indicators:\n${JSON.stringify(dataSummary, null, 2)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'report_fatigue_analysis',
              description: 'Report the fatigue analysis results',
              parameters: {
                type: 'object',
                properties: {
                  fatigue_score: { type: 'number', minimum: 0, maximum: 10 },
                  risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  indicators: { 
                    type: 'array', 
                    items: { type: 'string' }
                  },
                  recommendations: { 
                    type: 'array', 
                    items: { type: 'string' }
                  },
                  analysis: { type: 'string' }
                },
                required: ['fatigue_score', 'risk_level', 'indicators', 'recommendations', 'analysis']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'report_fatigue_analysis' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    let analysisResult;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysisResult = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback parsing
      const content = aiData.choices?.[0]?.message?.content || '';
      try {
        analysisResult = JSON.parse(content);
      } catch {
        analysisResult = {
          fatigue_score: 5,
          risk_level: 'medium',
          indicators: ['Unable to parse AI response'],
          recommendations: ['Manual review recommended'],
          analysis: content || 'Analysis unavailable'
        };
      }
    }

    // Calculate rest compliance score (0-10)
    const restComplianceScore = calculateRestCompliance(drivingDurationMinutes, dataSummary.time_since_last_break);

    // Insert fatigue alert into database
    const { data: alertData, error: insertError } = await supabase
      .from('driver_fatigue_alerts')
      .insert({
        tenant_id,
        driver_id,
        driver_name,
        device_id,
        fatigue_score: analysisResult.fatigue_score,
        risk_level: analysisResult.risk_level,
        driving_duration_minutes: drivingDurationMinutes,
        rest_compliance_score: restComplianceScore,
        indicators: analysisResult.indicators,
        recommendations: analysisResult.recommendations,
        ai_analysis: analysisResult.analysis,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting alert:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        alert: alertData,
        analysis: analysisResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fatigue analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateSpeedVariation(telemetry: TelemetryData[]): number {
  if (telemetry.length < 2) return 0;
  
  const speeds = telemetry.map(t => t.speed || 0);
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / speeds.length;
  return Math.sqrt(variance);
}

function calculateTimeSinceLastBreak(telemetry: TelemetryData[]): number {
  if (telemetry.length < 2) return 0;
  
  // A "break" is defined as speed = 0 for at least 5 consecutive readings
  let lastBreakIndex = -1;
  let zeroSpeedCount = 0;
  
  for (let i = telemetry.length - 1; i >= 0; i--) {
    if (telemetry[i].speed === 0 || telemetry[i].speed === null) {
      zeroSpeedCount++;
      if (zeroSpeedCount >= 5) {
        lastBreakIndex = i;
        break;
      }
    } else {
      zeroSpeedCount = 0;
    }
  }
  
  if (lastBreakIndex === -1) {
    // No break found, return total driving time
    const first = new Date(telemetry[0].timestamp).getTime();
    const last = new Date(telemetry[telemetry.length - 1].timestamp).getTime();
    return Math.round((last - first) / (1000 * 60));
  }
  
  const breakTime = new Date(telemetry[lastBreakIndex].timestamp).getTime();
  const lastTime = new Date(telemetry[telemetry.length - 1].timestamp).getTime();
  return Math.round((lastTime - breakTime) / (1000 * 60));
}

function calculateRestCompliance(drivingMinutes: number, timeSinceBreak: number): number {
  // EU regulations: max 4.5 hours driving, then 45 min break
  const maxContinuousDriving = 270; // 4.5 hours in minutes
  const recommendedBreakInterval = 120; // 2 hours
  
  let score = 10;
  
  if (timeSinceBreak > maxContinuousDriving) {
    score = 2; // Critical non-compliance
  } else if (timeSinceBreak > recommendedBreakInterval * 2) {
    score = 4;
  } else if (timeSinceBreak > recommendedBreakInterval) {
    score = 6;
  } else if (timeSinceBreak > 60) {
    score = 8;
  }
  
  return score;
}

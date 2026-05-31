import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusRequest {
  referenceId: string;
}

interface StatusResponse {
  success: boolean;
  status?: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  financialTransactionId?: string;
  amount?: string;
  currency?: string;
  reason?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MTN_MOMO_API_KEY');
    const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY');

    if (!apiKey || !subscriptionKey) {
      console.error('Missing MTN MoMo API credentials');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'MTN MoMo API credentials not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { referenceId }: StatusRequest = await req.json();

    if (!referenceId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: referenceId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Checking MTN MoMo payment status:', { referenceId });

    // In production, you would call:
    // GET https://sandbox.momoapi.mtn.com/collection/v1_0/requesttopay/{referenceId}
    
    // Simulate a random status for demo purposes
    const statuses: Array<'PENDING' | 'SUCCESSFUL' | 'FAILED'> = ['PENDING', 'SUCCESSFUL', 'FAILED'];
    const randomStatus = statuses[Math.floor(Math.random() * 3)];

    const mockResponse: StatusResponse = {
      success: true,
      status: randomStatus,
      financialTransactionId: randomStatus === 'SUCCESSFUL' ? `FT${Date.now()}` : undefined,
      amount: '50000',
      currency: 'NGN',
      reason: randomStatus === 'FAILED' ? 'Payment was declined by the user' : undefined
    };

    console.log('MTN MoMo payment status:', {
      referenceId,
      status: mockResponse.status,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify(mockResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Error checking MTN MoMo payment status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

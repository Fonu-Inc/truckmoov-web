import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoMoPaymentRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantName: string;
  externalId?: string;
  payerMessage?: string;
  payeeNote?: string;
}

interface MoMoPaymentResponse {
  success: boolean;
  referenceId?: string;
  status?: string;
  message?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MTN_MOMO_API_KEY');
    const apiSecret = Deno.env.get('MTN_MOMO_API_SECRET');
    const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY');

    if (!apiKey || !apiSecret || !subscriptionKey) {
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

    const { 
      amount, 
      currency = 'NGN', 
      phoneNumber, 
      invoiceId, 
      invoiceNumber,
      tenantName,
      externalId,
      payerMessage = 'Payment for invoice',
      payeeNote = 'Invoice payment'
    }: MoMoPaymentRequest = await req.json();

    // Validate required fields
    if (!amount || !phoneNumber || !invoiceId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: amount, phoneNumber, invoiceId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate a unique reference ID for this transaction
    const referenceId = externalId || crypto.randomUUID();

    // Log the payment request
    console.log('MTN MoMo Payment Request:', {
      referenceId,
      amount,
      currency,
      phoneNumber: phoneNumber.replace(/\d{4}$/, '****'), // Mask phone for logging
      invoiceId,
      invoiceNumber,
      tenantName,
      timestamp: new Date().toISOString()
    });

    // Simulate MTN MoMo API call (in production, this would be actual API calls)
    // Step 1: Create API User (in sandbox)
    // Step 2: Create API Key
    // Step 3: Get OAuth Token
    // Step 4: Request to Pay

    // For demo purposes, we'll simulate a successful payment request
    // In production, you would make actual calls to:
    // POST https://sandbox.momoapi.mtn.com/collection/v1_0/requesttopay
    
    const mockApiResponse = {
      referenceId,
      status: 'PENDING',
      financialTransactionId: `FT${Date.now()}`,
      externalId: referenceId,
      amount: amount.toString(),
      currency,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber
      },
      payerMessage: `${payerMessage} - ${invoiceNumber}`,
      payeeNote: `${payeeNote} from ${tenantName}`,
      status_reason: 'Payment request sent successfully'
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Log successful request
    console.log('MTN MoMo Payment Request Sent:', {
      referenceId: mockApiResponse.referenceId,
      status: mockApiResponse.status,
      financialTransactionId: mockApiResponse.financialTransactionId,
      timestamp: new Date().toISOString()
    });

    const response: MoMoPaymentResponse = {
      success: true,
      referenceId: mockApiResponse.referenceId,
      status: mockApiResponse.status,
      message: `Payment request of ${currency} ${amount.toLocaleString()} sent to ${phoneNumber}. Customer will receive a prompt to approve the payment.`
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Error in MTN MoMo payment function:', error);
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

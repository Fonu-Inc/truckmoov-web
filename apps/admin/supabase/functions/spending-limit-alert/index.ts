import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpendingAlertRequest {
  email: string;
  tenantId: string;
  tenantName?: string;
  thresholdType: '80' | '100';
  currentSpending: number;
  spendingLimit: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      tenantId, 
      tenantName, 
      thresholdType, 
      currentSpending, 
      spendingLimit 
    }: SpendingAlertRequest = await req.json();

    if (!email) {
      console.log("No alert email configured for tenant:", tenantId);
      return new Response(
        JSON.stringify({ success: false, error: "No alert email configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const percentage = thresholdType === '80' ? '80%' : '100%';
    const isWarning = thresholdType === '80';
    const statusColor = isWarning ? '#f59e0b' : '#ef4444';
    const statusText = isWarning ? 'Warning' : 'Limit Reached';

    const subject = isWarning 
      ? `⚠️ Spending Alert: You've reached ${percentage} of your monthly limit`
      : `🚨 Spending Limit Reached: Monthly communication limit exceeded`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background-color: ${statusColor}; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                  ${isWarning ? '⚠️' : '🚨'} Spending ${statusText}
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Hello${tenantName ? ` ${tenantName}` : ''},
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  ${isWarning 
                    ? `Your communication spending has reached <strong>${percentage}</strong> of your monthly limit. Consider reviewing your usage or increasing your limit to avoid service interruption.`
                    : `Your communication spending has reached your monthly limit. <strong>New communications will be blocked</strong> until your limit resets or you increase it.`
                  }
                </p>
                
                <!-- Usage Stats -->
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Current Spending</span>
                    <span style="color: #111827; font-weight: 600;">₦${currentSpending.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Monthly Limit</span>
                    <span style="color: #111827; font-weight: 600;">₦${spendingLimit.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Usage</span>
                    <span style="color: ${statusColor}; font-weight: 600;">${Math.round((currentSpending / spendingLimit) * 100)}%</span>
                  </div>
                  
                  <!-- Progress bar -->
                  <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; margin-top: 16px; overflow: hidden;">
                    <div style="background-color: ${statusColor}; height: 100%; width: ${Math.min((currentSpending / spendingLimit) * 100, 100)}%;"></div>
                  </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${isWarning 
                    ? 'You can adjust your spending limit in your Wallet settings to avoid reaching the cap.'
                    : 'To continue sending messages and making calls, please increase your monthly limit or wait for the next billing cycle.'
                  }
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  FleetPro Fleet Management System
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending ${percentage} spending alert to ${email} for tenant ${tenantId}`);

    const emailResponse = await resend.emails.send({
      from: "FleetPro <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending spending alert:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KYCNotificationRequest {
  tenantEmail: string;
  tenantName: string;
  tenantId?: string;
  documentId?: string;
  documentName: string;
  documentType: string;
  status: "approved" | "rejected";
  feedback?: string;
  sentBy?: string;
}

const getApprovedEmailHtml = (tenantName: string, documentName: string, documentType: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Document Approved ✓</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Dear <strong>${tenantName}</strong>,</p>
    <p>Great news! Your KYC document has been reviewed and <strong style="color: #10b981;">approved</strong>.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Document Details</p>
      <p style="margin: 0; font-weight: 600;">${documentName}</p>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${documentType}</p>
    </div>
    
    <p>Your verification process is progressing. If all required documents are approved, your account will be fully verified soon.</p>
    
    <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">Best regards,<br>The FleetPro Verification Team</p>
  </div>
</body>
</html>
`;

const getRejectedEmailHtml = (tenantName: string, documentName: string, documentType: string, feedback: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Document Requires Attention</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Dear <strong>${tenantName}</strong>,</p>
    <p>We've reviewed your KYC document and unfortunately it could not be approved at this time.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Document Details</p>
      <p style="margin: 0; font-weight: 600;">${documentName}</p>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${documentType}</p>
    </div>
    
    <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 600; font-size: 14px;">Reason for Rejection:</p>
      <p style="margin: 0; color: #7f1d1d;">${feedback || 'No specific feedback provided.'}</p>
    </div>
    
    <p>Please upload a new document addressing the issues mentioned above. If you have any questions, feel free to contact our support team.</p>
    
    <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">Best regards,<br>The FleetPro Verification Team</p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for logging
  const supabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!
  );

  let logId: string | null = null;

  try {
    const { 
      tenantEmail, 
      tenantName, 
      tenantId,
      documentId,
      documentName, 
      documentType, 
      status, 
      feedback,
      sentBy 
    }: KYCNotificationRequest = await req.json();

    console.log(`Sending KYC ${status} notification to ${tenantEmail} for document: ${documentName}`);

    if (!tenantEmail) {
      throw new Error("Tenant email is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const subject = status === "approved" 
      ? `✓ Your Document Has Been Approved - ${documentName}`
      : `Action Required: Document Review - ${documentName}`;

    const html = status === "approved"
      ? getApprovedEmailHtml(tenantName, documentName, documentType)
      : getRejectedEmailHtml(tenantName, documentName, documentType, feedback || '');

    // Create initial log entry with pending status
    const { data: logData, error: logError } = await supabase
      .from('kyc_notification_logs')
      .insert({
        tenant_id: tenantId || 'unknown',
        tenant_email: tenantEmail,
        tenant_name: tenantName,
        document_id: documentId || null,
        document_name: documentName,
        document_type: documentType,
        notification_type: status,
        rejection_reason: status === 'rejected' ? feedback : null,
        email_subject: subject,
        delivery_status: 'pending',
        sent_by: sentBy || null,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to create notification log:', logError);
    } else {
      logId = logData?.id;
      console.log('Created notification log with ID:', logId);
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FleetPro KYC <onboarding@resend.dev>",
        to: [tenantEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      
      // Update log with failed status
      if (logId) {
        await supabase
          .from('kyc_notification_logs')
          .update({
            delivery_status: 'failed',
            error_message: errorData,
          })
          .eq('id', logId);
      }
      
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    // Update log with sent status and Resend message ID
    if (logId) {
      await supabase
        .from('kyc_notification_logs')
        .update({
          delivery_status: 'sent',
          resend_message_id: emailResponse.id,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', logId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      logId 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending KYC notification:", error);
    
    // Update log with failed status if we have a log ID
    if (logId) {
      await supabase
        .from('kyc_notification_logs')
        .update({
          delivery_status: 'failed',
          error_message: error.message,
        })
        .eq('id', logId);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
